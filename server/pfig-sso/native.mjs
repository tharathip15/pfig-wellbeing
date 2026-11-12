import {createPfigSso} from './client.mjs';
const principal=Symbol('verified PFIG module session');
export const companySession=request=>request[principal]||null;
export function createNativePfigSso({id,origin,adminRole,env,transport}){
 const sso=createPfigSso({id,origin,env,transport});
 return {sso,async prepare(request,response){
  try{
   const identity=await sso.read(request);if(!identity)return true;
   request[principal]={pfigUserId:identity.pfigUserId,oid:identity.microsoftOid||identity.pfigUserId,tid:identity.microsoftTenantId||identity.organizationId,name:identity.name,email:identity.email,roles:identity.moduleRole==='admin'?[adminRole]:[],canEdit:identity.moduleRole==='admin',csrf:identity.csrfToken,authenticationMode:'pfig-sso'};
   if(new URL(request.url,origin).pathname==='/api/logout'){
    const previous=request.url;request.url='/api/pfig-sso?action=logout';try{await sso.handle(request,response);}finally{request.url=previous;}return false;
   }
   return true;
  }catch(error){response.statusCode=error.statusCode||503;response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-store');response.end(JSON.stringify({ok:false,error:error.code||'PFIG_SIGN_IN_REQUIRED'}));return false;}
 }};
}
