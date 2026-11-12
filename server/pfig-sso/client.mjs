// Server-only PFIG module session adapter. No credential is exposed to JavaScript.
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const opaque=/^[A-Za-z0-9_-]{43}$/;
const random=()=>randomBytes(32).toString('base64url');
const reject=(statusCode,code)=>{throw Object.assign(new Error(code),{statusCode,status:statusCode,code});};
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createPfigSso({id,origin,env=process.env,transport=fetch,now=Date.now}){
 if(!/^[a-z][a-z0-9-]{0,30}$/.test(id))throw Error('INVALID_PFIG_APPLICATION');
 const enabled=()=>env.PFIG_SSO_ENABLED==='1';
 const cache=new Map(),pending=new Map();
 const name='__Host-pfig_'+id.replaceAll('-','_')+'_sso',flowName=name+'_flow';
 const base=new URL(origin),callback=base.origin+'/api/pfig-sso?action=callback';
 const central=new URL(env.PFIG_SSO_ISSUER||'https://pfig-portal.vercel.app');
 if(base.protocol!=='https:'||base.pathname!=='/'||base.username||base.password||base.search||base.hash||central.protocol!=='https:'||central.pathname!=='/'||central.username||central.password||central.search||central.hash)throw Error('INVALID_PFIG_SSO_ORIGIN');
 const secret=()=>{const value=env.PFIG_SSO_CLIENT_SECRET;if(typeof value!=='string'||value.length<43)reject(503,'PFIG_SSO_NOT_CONFIGURED');return value;};
 const signature=(value,purpose)=>createHmac('sha256',secret()).update(purpose+':'+value).digest('base64url');
 const seal=(value,purpose)=>{const encoded=Buffer.from(JSON.stringify(value)).toString('base64url');return encoded+'.'+signature(encoded,purpose);};
 function open(value,purpose){const parts=String(value||'').split('.');if(parts.length!==2||!equal(parts[1],signature(parts[0],purpose)))reject(401,'PFIG_SESSION_INVALID');let result;try{result=JSON.parse(Buffer.from(parts[0],'base64url').toString());}catch{reject(401,'PFIG_SESSION_INVALID');}if(!Number.isFinite(result.exp)||result.exp<=now())reject(401,'PFIG_SESSION_EXPIRED');return result;}
 function cookie(request,key){const values=String(request.headers?.cookie||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(key+'='));if(!values.length)return null;if(values.length!==1)reject(401,'PFIG_COOKIE_DUPLICATE');return values[0].slice(key.length+1);}
 const header=(key,value,seconds)=>`${key}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax${seconds===null?'':'; Max-Age='+seconds}`;
 function validIdentity(identity){if(!identity||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(identity.pfigUserId||'')||!identity.username||typeof identity.moduleRole!=='string')reject(503,'PFIG_IDENTITY_INVALID');return identity;}
 async function call(path,input){
  let response;try{response=await transport(central.origin+'/api/platform/sso/'+path,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',Authorization:'Basic '+Buffer.from(id+':'+secret()).toString('base64')},body:JSON.stringify(input)});}catch(error){if(error.statusCode)throw error;reject(503,'PFIG_SSO_UNAVAILABLE');}
  if(!response.ok)reject([401,403].includes(response.status)?response.status:503,[401,403].includes(response.status)?'PFIG_SIGN_IN_REQUIRED':'PFIG_SSO_UNAVAILABLE');
  let value;try{value=await response.json();}catch{reject(503,'PFIG_SSO_INVALID_RESPONSE');}return value;
 }
 async function read(request,{fresh=false}={}){
  if(!enabled())return null;const value=cookie(request,name);if(value===null)return null;
  const session=open(value,'session');if(!opaque.test(session.token||'')||!opaque.test(session.csrf||''))reject(401,'PFIG_SESSION_INVALID');
  const mutation=!['GET','HEAD'].includes(request.method||'GET');
  if(mutation&&(request.headers.origin!==base.origin||!equal(request.headers['x-csrf-token'],session.csrf)))reject(403,'PFIG_CSRF_REQUIRED');
  const key=createHash('sha256').update(session.token).digest('hex'),cached=cache.get(key);
  let identity;
  if(!mutation&&!fresh&&cached?.until>now())identity=cached.identity;
  else{
   // Coalesce simultaneous reads, but mutations always ask Core for current status.
   let task=!mutation&&!fresh?pending.get(key):null;
   if(!task){task=call('introspect',{token:session.token}).then(result=>{if(result.active!==true)reject(401,'PFIG_SIGN_IN_REQUIRED');return validIdentity(result.identity);});if(!mutation&&!fresh)pending.set(key,task);}
   try{identity=await task;}catch(error){cache.delete(key);throw error;}finally{if(pending.get(key)===task)pending.delete(key);}
   for(const [key,value]of cache)if(value.until<=now())cache.delete(key);
   if(cache.size>=500)cache.delete(cache.keys().next().value);
   cache.set(key,{identity,until:Math.min(now()+30000,session.exp)});
  }
  return {...identity,authenticationMode:'pfig-sso',csrfToken:session.csrf,sessionExpiresAt:session.exp};
 }
 return {enabled,cookieName:name,read,async handle(request,response){
  const url=new URL(request.url,base);if(url.pathname!=='/api/pfig-sso')return false;
  response.setHeader('Cache-Control','no-store');response.setHeader('Referrer-Policy','no-referrer');
  const redirect=target=>{response.statusCode=303;response.setHeader('Location',target);response.end();return true;};
  const send=(value,status=200)=>{response.statusCode=status;response.setHeader('Content-Type','application/json; charset=utf-8');response.end(JSON.stringify(value));return true;};
  if(!enabled())return send({error:'PFIG_SSO_NOT_ENABLED'},404);
  try{
   const action=url.searchParams.get('action')||'start';
   if(action==='logout'){
    if(request.method!=='POST')reject(405,'POST_REQUIRED');await read(request,{fresh:true});
    const session=open(cookie(request,name),'session');await call('revoke',{token:session.token});
    cache.delete(createHash('sha256').update(session.token).digest('hex'));
    response.setHeader('Set-Cookie',[header(name,'',0),header(flowName,'',0)]);return send({ok:true});
   }
   if(request.method!=='GET')reject(405,'GET_REQUIRED');
   if(action==='session'){const identity=await read(request);if(!identity)reject(401,'PFIG_SIGN_IN_REQUIRED');return send({identity,csrfToken:identity.csrfToken});}
   if(action==='start'){
    const state=random(),verifier=random(),challenge=createHash('sha256').update(verifier).digest('base64url');
    response.setHeader('Set-Cookie',header(flowName,seal({state,verifier,exp:now()+300000},'flow'),300));
    const target=new URL('/auth/platform/sso/authorize',central);target.search=new URLSearchParams({client_id:id,redirect_uri:callback,response_type:'code',state,code_challenge:challenge,code_challenge_method:'S256'}).toString();return redirect(target.href);
   }
   if(action==='callback'){
    const flow=open(cookie(request,flowName),'flow');response.setHeader('Set-Cookie',header(flowName,'',0));
    if(url.searchParams.getAll('state').length!==1||url.searchParams.getAll('code').length!==1||!equal(flow.state,url.searchParams.get('state'))||!opaque.test(url.searchParams.get('code')||''))reject(401,'PFIG_AUTH_STATE_INVALID');
    const result=await call('token',{grant_type:'authorization_code',code:url.searchParams.get('code'),code_verifier:flow.verifier,redirect_uri:callback});
    validIdentity(result.identity);const exp=Date.parse(result.expires_at);if(!opaque.test(result.access_token||'')||!Number.isFinite(exp)||exp<=now()||exp>now()+7*86400000+60000)reject(503,'PFIG_SESSION_INVALID');
    response.setHeader('Set-Cookie',[header(flowName,'',0),header(name,seal({token:result.access_token,csrf:random(),exp},'session'),result.remembered?Math.floor((exp-now())/1000):null)]);
    return redirect(base.origin+(id==='hr'?'/?mode=entra#home':'/'));
   }
   return send({error:'NOT_FOUND'},404);
  }catch(error){return send({error:error.code||'PFIG_SSO_UNAVAILABLE'},error.statusCode||503);}
 }};
}
