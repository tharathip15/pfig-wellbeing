import {sso} from '../server/pfig-sso/index.mjs';
export default async function handler(request,response){await sso.handle(request,response);}
