# UPC Bangladesh – Bangladeshi Teams (University Physics Competition)

React + Supabase site that shows **Bangladesh-only** data from [The University Physics Competition](https://www.uphysicsc.com/). Data is stored in Supabase and editable via an admin portal.

## Stack

- **React** (Vite), **CSS**, **.env** for config
- **Supabase**: database + auth (admin sign-in)

## Setup

1. **Supabase project**
   - Create a project at [supabase.com](https://supabase.com).
   - In **SQL Editor**, run in order: `supabase/schema.sql`, then `supabase/universities.sql` (all universities from [List of universities in Bangladesh](https://en.wikipedia.org/wiki/List_of_universities_in_Bangladesh)), then optionally `supabase/seed.sql` to load 2025 competition + example team.
   - In **Authentication > Users**, create an admin user (email + password) so you can sign in at `/admin`.
   - In **Settings > API**, copy the project URL and anon key.

2. **Env**
   - Copy `.env.example` to `.env`.
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase dashboard.

3. **Run**
   ```bash
   npm install
   npm run dev
   ```
   - Public site: [http://localhost:5173](http://localhost:5173)
   - Admin: [http://localhost:5173/admin](http://localhost:5173/admin) (sign in with the user you created)

## Data source

Competition results and PDFs are published at [uphysicsc.com](https://www.uphysicsc.com/). This site only displays **Bangladeshi** teams; you add/update that data in the admin portal (manually or from the official results).

## Build

```bash
npm run build
npm run preview
```
