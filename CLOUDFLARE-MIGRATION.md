# Cloudflare migration

Target: Workers + D1 + R2 + Better Auth. A dedicated D1 replica contains all 1,317 rows in six tables, including two users, account password hashes, sessions, 24 announcements and view records. Arrays are JSON text and timestamps retain source microseconds as fixed-width UTC text. Better Auth uses the SQLite Drizzle adapter. Legacy account/email updates run in one D1 batch.

The current Blob listing contains one available object (242,094 bytes), backed up and copied to R2 with a complete download/SHA-256 check. Separately, nine image URLs remain on three soft-deleted, unpublished announcements. All nine return 404 from the source Blob server; those rows and original references were preserved. These are pre-existing missing files, not a migration deletion. No publicly active announcement references those nine files. Full historical-file recovery requires another original backup.

Uploads now use the native `MEDIA` R2 binding. `R2_PUBLIC_URL` points at the preview's `/media` endpoint. Deletion operates only on this application's R2 prefix and preserves legacy Blob objects. The old PostgreSQL storage rewrite command is disabled because the source must stay intact.

Validation: PostgreSQL restore and every-field comparison; local SQLite and remote D1 full-row/foreign-key validation; TypeScript, Workers build and three image-reference tests. Remote preview passed synthetic-user password signup/signin, admin authorization, image upload/download byte equality, announcement creation/editing, legacy email update and subsequent sign-in. Synthetic users, announcements, sessions and files were removed.

Production cutover has NOT happened. Before switching: pause writes and drain both apps, recopy all tables and any new images, verify data and auth, configure the production Better Auth URL, preserve the rest of notish.cloud DNS/mail/DNSSEC, then switch the hostname. Vercel/PostgreSQL/Blob stay available for rollback. A rollback after D1 writes requires tested reverse synchronization; restoring an old DB snapshot would lose later edits.

The manual workflow requires durable personal-account Cloudflare credentials. The Node maintenance helper targets local D1 only. Do not merge Cloudflare-only code into the Vercel production branch until deployment triggers have been changed.
