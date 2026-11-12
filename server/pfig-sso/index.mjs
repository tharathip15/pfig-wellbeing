import {createNativePfigSso} from './native.mjs';
export const {sso,prepare:prepareCompanySession}=createNativePfigSso({"id":"wellbeing","origin":"https://pfig-wellbeing.vercel.app","adminRole":"PFIG.Wellbeing.Admin"});
export {companySession} from './native.mjs';
