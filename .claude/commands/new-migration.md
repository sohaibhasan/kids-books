---
description: Create the next numbered Supabase migration
---

1. List existing migrations to find the highest four-digit prefix:
   ```bash
   ls supabase/migrations/
   ```
   The current highest is `0007` (`0007_nullable_title.sql`). Increment by one to get the next prefix (e.g. `0008`).

2. Ask the user for a short descriptive slug (e.g. `add_user_sessions`), then create `supabase/migrations/<NNNN>_<slug>.sql`.

3. Start the file with a comment header:
   ```sql
   -- Migration <NNNN>_<slug>.sql
   -- Created: <today's date>
   -- Description: <one-line summary of what this migration does>
   ```

4. Write the DDL body (if provided), or leave a `-- TODO` placeholder for the user to fill in.

5. Remind the user that migrations are **not** applied automatically. Apply via one of:
   - **Supabase dashboard SQL editor** — paste the file contents and run it against the project.
   - **`npx supabase db push`** — requires the project to be linked; check whether `supabase/.temp/` contains a project-ref file indicating an active link before running.

6. After the migration is applied, update CLAUDE.md if the change affects documented schema (e.g. the "Generated Story JSON Shape" column list or any migration references in the Monetization section).
