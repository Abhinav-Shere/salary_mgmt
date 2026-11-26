# Decisions

This file covers the trade-offs I made, the performance numbers I measured, and what I'd do next. The plan behind them is in `PLAN.md`.

## Trade-offs

### Data and API

- **One `employees` table.**
  - Country and department are validated against fixed lists in the model. Free text would let "USA" and "United States" split one group in two.
  - Job titles are free text, and the form suggests the titles already in use. A lookup table for titles would add screens nobody asked for.
- **One currency.** Every salary is annual USD, stored as an integer number of dollars. Integers avoid float drift in sums and averages. Comparing salaries across countries only makes sense in one unit.
- **Email as the human identity.** 10,000 names built from two lists will repeat. Email is unique, stored lowercased and backed by a unique index.
- **Hard delete.** The brief asks for delete. A real HR system would archive the record and keep its history.
- **Offset pagination capped at 100 rows.**
  - The list never returns all 10,000 employees.
  - At this size, `OFFSET` costs nothing noticeable: page 400 takes 17 ms end to end.
  - Offset gives page numbers, which is what the table shows.
- **Name search with `LIKE '%q%'`.** A leading wildcard can't use an index, but scanning 10,000 short strings takes about a millisecond. The query escapes `%` and `_`, so they are matched literally.
- **Error shapes.**
  - 422 responses return `{ errors: { field: [messages] } }`, so the form can show each message under its field.
  - 404 and 400 responses return `{ error: message }`.

### Insights

- **All in SQL, in one service object.** `SalaryInsights` uses `COUNT`, `MIN`, `MAX`, `AVG` and `SUM` with `GROUP BY`.
- **Median with window functions.**
  - SQLite has no `MEDIAN`, so the service ranks salaries with `ROW_NUMBER()` and `COUNT(*) OVER (PARTITION BY ...)`, keeps the middle one or two rows, and averages them.
  - This keeps the work in the database. I cross-checked it against a plain Ruby median on the 10,000 seeded rows: all 10 countries and all 20 job titles in India matched.
- **Rounding.** Averages and medians are rounded to whole dollars in SQL (`CAST(ROUND(AVG(salary)) AS INTEGER)`), so the API returns integers.
- **Empty groups.** An unknown country or job title returns headcount 0 and `null` figures rather than a 404. The UI shows an empty state for it.
- **No caching.** Each insights request runs 2 to 4 queries and takes about 1 ms of database time. Caching would add invalidation work for no measurable gain at this size.

### Seed

- **Rows are built in memory, then inserted in batches.**
  - `insert_all!` writes 1,000 rows per batch inside one transaction, which also contains the `delete_all`.
  - SQLite pays for one commit instead of 10,000.
  - The transaction makes the replace atomic: a failed run leaves the old data in place.
- **Validations are checked by a spec instead.** `insert_all!` skips model validations, so a spec builds an `Employee` from every generated row and checks that each one is valid.
- **Deterministic.**
  - One `Random` instance with a fixed seed drives every choice.
  - Hire dates come from a fixed range, not from today's date.
  - The same name files therefore always produce the same rows.
- **Replace, not upsert.** Each run ends with exactly 10,000 rows and no duplicates. It discards manual edits, which is acceptable for development data.
- **Realistic shape.** A small catalog maps departments to titles and base salaries. Countries have headcount weights and pay multipliers, and each salary varies by ±15%. The insights pages then show differences worth looking at.

### Frontend

- **Mantine for components.** Its `AppShell`, `Table`, `Select`, `Modal` and form fields cover every screen without custom CSS.
- **`@mantine/form`** handles the client-side validation, and server-side field errors are mapped onto the same form.
- **TanStack Query for server state.** It provides loading, error and retry states and caching. Saving or deleting an employee invalidates the employee, lookup and insights queries.
- **Employee list filters live in the URL.** Search, country, job title and page survive going to an employee's page and coming back.
- **Tests run the real components.** MSW mocks the network at the `fetch` level, and the tests go through the router, the providers and the components. Mantine runs with `env="test"` in tests, which turns off transitions so dropdowns and modals open and close immediately.

### Tooling

- **Docker only.** The cost is a slower first build and some indirection (`bin/dc exec ...`). In return, nothing touches the host's Ruby, Node or gems.
- **Memory caps of 512 MB per service.**
  - Three settings exist because of this cap:
    - Vitest runs with one thread, because ten parallel jsdom workers were killed at 512 MB.
    - `tsc` runs with `--singleThreaded`. Its parallel checkers peaked at 287 MB on their own, against 210 MB single-threaded, and the parallel version pushed the dev container past the cap.
    - The production build runs in a one-off container, not next to the dev server.
  - With the dev server warmed up, running tests, typecheck and lint in a row inside the container peaked at 448 MB.
- **No volumes inside bind mounts.**
  - I first mounted named volumes inside the bind mounts: SQLite at `/app/storage` and npm packages at `/app/node_modules`.
  - On Docker Desktop, every time a one-off `bin/dc run --rm` container exited, the long-running container lost sight of those nested volumes. Rails then quietly created an empty database on the host, and Vite failed with missing modules.
  - SQLite now lives in a named volume at `/data`. `database.yml` reads `DATABASE_DIR` and defaults to `storage`.
  - The npm packages are installed into `/node_modules` in the web image. Node, Vite and TypeScript find them by walking up from `/app`, and Vite's `server.fs.allow` includes `/node_modules`.
  - The cost: changing a dependency means rebuilding the web image. The benefit: one-off containers can't break the running dev server.
- **A separate `editor` container for VS Code.**
  - With packages only in the image, VS Code on the host can't resolve types.
  - The Dev Container attaches VS Code to an `editor` service built from the web image, with its own 768m cap, so the editor's TypeScript server doesn't compete with Vite for the web container's 512m.
  - It is behind a compose profile and only starts when VS Code (or `bin/dc up -d editor`) asks for it.
- **oxlint instead of ESLint.** The current Vite template ships oxlint, and it runs in under a second.
- **`db/schema.rb` without its header.** I removed Rails' generated comment header to keep the no-comments rule. Rails writes the header back whenever migrations run, so it has to be removed again after a new migration.
- **Production bundle size.** The bundle is a single chunk over 500 kB, mostly Mantine. For an internal tool on a fast network I left it. Route-level code splitting would be the fix.

## Performance numbers

Measured on my machine (Apple Silicon, Docker Desktop), inside the 512 MB containers, with 10,000 employees loaded.

### Seed

The benchmark used the fixture name lists, because my real name files weren't in place yet. Insert time doesn't depend on the names.

| Approach | Rows | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- | --- |
| `Employee.create!` one row at a time | 1,000 | 2.408 s | 2.308 s | 2.581 s |
| Batched seeder | 1,000 | 0.052 s | 0.038 s | 0.043 s |
| Batched seeder | 10,000 | 0.485 s | 0.491 s | 0.487 s |

- **Why one-at-a-time is slow:** each `create!` runs validations (including a uniqueness `SELECT`), builds an Active Record object, and commits its own transaction.
- **What the batched path does instead:** 10 `INSERT` statements and one commit.
- `bin/rails db:seed:benchmark` reproduces these numbers.

### API

Median of 5 requests with `curl` against the running API, with 10,000 rows:

| Endpoint | Time |
| --- | --- |
| `GET /employees?per_page=25` | 12 ms |
| `GET /employees?q=ada&country=Germany` | 10 ms |
| `GET /employees?page=400` | 17 ms |
| `GET /lookups` | 6 ms |
| `GET /insights/summary` | 13 ms |
| `GET /insights/countries` | 17 ms |
| `GET /insights/country?country=India` | 12 ms |
| `GET /insights/job_title?...` | 7 ms |

Rails logs about 1 ms of database time for most of these.

### Indexes

- `country` and `(country, job_title)` serve the country insights and the requirement (b) lookup. `job_title` serves the job title filter and the title comparison across countries.
- The single-column `country` index is redundant: SQLite can use the leading column of `(country, job_title)` for the same queries. I kept it because the brief asked for it. I'd drop it if write speed ever mattered.
- `email` has a unique index that enforces uniqueness in the database, not only in the model.

## What I'd do next

1. **Authentication and roles.** This is the first thing before real use, since salaries are sensitive. HR managers could edit; other managers would see only aggregates for their teams.
2. **Audit history and salary changes over time.** Keep a `salary_changes` table instead of overwriting, so the tool can answer "when did this person last get a raise".
3. **Archive instead of delete,** so headcount history and audits stay correct.
4. **Pay-equity views.** Spread within title and country, outliers more than two standard deviations from the median, and salary against tenure using `hire_date`.
5. **Multiple currencies.** Store the local currency plus an FX table, and report in a chosen currency.
6. **CSV import and export,** for HR teams that live in spreadsheets.
7. **Full-text search with FTS5,** if the organisation grows by an order of magnitude.
8. **Production deployment.** A production Dockerfile, the built UI served behind the same reverse proxy as the API, CI running the same checks as `docs/PROGRESS.md`, and the deferred demo video.
