# Srishti Wealth Launch Checklist

## Domain and DNS

1. Add `srishtiwealth.in` to your Vercel project.
2. Add `www.srishtiwealth.in` as an alias if you want both hostnames covered.
3. Point the apex domain to the Vercel target shown in the project dashboard.
4. Point `www` to the Vercel CNAME target if you are using the subdomain.
5. Verify SSL is issued and both the apex and `www` hosts resolve correctly.

## Vercel Project

1. Confirm the production project is linked to the correct repository and branch.
2. Set the production domain to `srishtiwealth.in`.
3. Add all required Supabase environment values in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
4. Redeploy after confirming the environment values are present.
5. Test the clean URLs:
   - `/`
   - `/signin`
   - `/support`
   - `/privacy`
   - `/terms`

## Support and Operations

1. Create `support@srishtiwealth.in` before launch.
2. Update the admin-managed contact email and phone in Settings after first admin sign-in.
3. Create backup inboxes if needed:
   - `hello@srishtiwealth.in`
   - `legal@srishtiwealth.in`
   - `admin@srishtiwealth.in`
4. Route support ownership clearly so users always receive a response.

## Final Product Checks

1. Confirm homepage metadata, favicon, and social preview tags are live.
2. Confirm `privacy` and `terms` pages load on the production domain.
3. Confirm sign-in, registration, customer creation, settings, and analytics flows work after deploy.
4. Confirm dark and light theme behavior on public and authenticated pages.
5. Confirm support links open the correct official email address and phone number.
