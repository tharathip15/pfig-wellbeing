# Wellbeing SSO cutover

1. Create a single-tenant Microsoft Entra SPA registration for PFIG Wellbeing.
2. Register the exact Vercel production URL as a SPA redirect URI.
3. Add the `PFIG.Wellbeing.Admin` app role and assign the Wellbeing administrators.
4. Configure the variables from `.env.example` in Vercel Production and Preview.
5. Deploy the application to Vercel and verify Microsoft sign-in plus `/api/session`.
6. Add each employee's Microsoft Entra object ID to the new `entra_oid` field while the old database access remains available.
7. Confirm every employee can see only their own record and administrators can edit all records.
8. Apply `supabase/migrations/202607220001_entra_identity_cutover.sql` to revoke direct anonymous access.
9. Update `VITE_WELLBEING_URL` in PFIG Portal to the Vercel production URL.

Do not apply the database cutover migration before the Vercel API and identity mapping have been verified.
