# Progress

## Milestone 0: Plan

- `docs/PLAN.md` written. No code yet.
- Docker baseline saved to `.preflight/`: 17 containers, 19 images, 22 volumes, 7 networks. Nothing has been created in Docker.
- Docker memory at baseline: about 5 GB used of 7.65 GB, by other projects' containers. Caps lowered to api 512m and web 512m. Images are built one at a time, with `docker stats --no-stream` checked before each build and before starting containers; I stop if usage would pass about 85%.
- Deployment and video demo moved from "excluded" to "deferred until the core app is complete".
- Tests, lint and the comment grep did not apply yet. There was no source code.
- Suggested commit: `add project plan and gitignore`

## Milestone 1: Docker skeleton

- `bin/dc`, `compose.yaml`, `api/Dockerfile.dev`, `web/Dockerfile.dev`, both `.dockerignore` files and `.gitignore` are in place.
- Base images pinned by digest: `ruby:3.4.13-slim` and `node:24.22.3-slim`.
- `bin/dc` guards tested: it refuses `-p x ps`, `pull`, `up --pull always`, `build --pull`, `down --rmi all` and `down --rmi=all`. It ignores `COMPOSE_PROJECT_NAME=evil`; `config` still shows `name: salary_mgmt`.
- Rails 8.1.4.1 generated in API mode inside the container. Unused generated files were removed, and generator comments were stripped from every kept file.
- The Vite React TypeScript template was generated inside the container. Template assets and comments were removed.
- Memory before each build and before starting the stack: 66–67%.
- `/up` returns 200 on 127.0.0.1:3200, and the UI loads on 127.0.0.1:5180.
- Suggested commit: `add docker setup with empty rails api and vite app`

## Milestone 2: Employee model

- Migration with `full_name`, `job_title`, `country`, `department`, `salary` (integer), `email` and `hire_date`.
- Indexes on `country`, `(country, job_title)` and `job_title`, plus a unique index on `email`.
- Validations: presence, length, the country and department lists, a whole-number salary in (0, 10,000,000], email format and case-insensitive uniqueness, and a hire date not in the future.
- Normalization: names and titles are squished; emails are stripped and lowercased.
- Model spec covers validations, normalization, `.filtered` and serialization.
- Suggested commit: `add employee model with validations and indexes`

## Milestone 3: Employees API

- `/api/v1/employees`:
  - index with `page` and `per_page` (default 25, capped at 100), `q`, `country` and `job_title`;
  - show, create, update and destroy.
- `/api/v1/lookups` returns the countries, departments and job titles in use.
- Errors: 404 `{ error }`, 422 `{ errors: { field: [...] } }`, 400 for a missing `employee` key.
- Request specs cover all of the above.
- Suggested commit: `add employees api with pagination, search and filters`

## Milestone 4: Insights

- `SalaryInsights` service: summary, country comparison, one country with a job title breakdown, and one job title in a country compared with the country and global averages.
- Everything comes from SQL aggregates. The median uses window functions.
- Unit specs check against hand-computed numbers. A request spec covers each endpoint and a 400.
- Cross-checked on 10,000 rows against plain Ruby: 0 mismatches.
- Suggested commit: `add salary insights service and api`

## Milestone 5: Seed

- `EmployeeSeeder`: names come from `db/seeds/*.txt`. It uses a fixed random seed and replaces all rows in one transaction with batches of 1,000.
- `db/seeds.rb` prints the elapsed time. `bin/rails db:seed:benchmark` compares it with one-row-at-a-time inserts.
- Specs check:
  - the count and the 10,000 default;
  - names come from the files;
  - every row is valid and every email unique;
  - the output is deterministic;
  - re-running replaces rows instead of adding them;
  - a missing file raises and keeps existing data;
  - an empty file raises.
- Benchmark (fixture names, three runs): one row at a time took 2.31–2.58 s for 1,000 rows; the batched seeder took 0.04–0.05 s for 1,000 rows and about 0.49 s for 10,000.
- **Open item:** `api/db/seeds/first_names.txt` and `last_names.txt` were not in the folder. The real seed has not run yet. Running `bin/dc exec api bin/rails db:seed` now stops with `Names file not found` and leaves existing data untouched.
- Suggested commit: `add deterministic batched employee seeder`

## Milestone 6: Employees UI

- Mantine `AppShell` with Employees and Insights navigation.
- The list:
  - search is debounced;
  - country and job title use selects;
  - filters and page live in the URL;
  - pagination is server-side, with "Showing x–y of z";
  - states: loading skeleton rows, an empty state with "Clear filters", and an error with retry.
- One form serves create and edit, with client-side validation. Server 422 errors are shown on their fields.
- Detail page shows tenure, Edit, and Delete with a confirmation modal. A 404 gets its own message.
- Component tests use MSW.
- Suggested commit: `add employee list, detail and form screens`

## Milestone 7: Insights UI

- Organisation summary cards.
- A country selector shows min, max, average, median, headcount and payroll.
- A job title selector, limited to titles in that country, shows the average, median and range, plus the percentage difference from the country average and from the same title globally.
- The job title table can be sorted by highest average or A–Z. A country comparison table is included.
- Each section has its own loading, empty and error states. Component tests cover it.
- Suggested commit: `add salary insights screen`

## Milestone 8: Artifacts

- `README.md`, `VERSIONS.md`, `docs/DECISIONS.md` and `docs/AI_USAGE.md` written. `docs/PLAN.md` was updated where the build differed from the plan: oxlint, and the `/data` volume.
- Suggested commit: `add readme, decisions and ai usage notes`

## Fix after milestone 8: web dependencies out of the bind mount

- **Problem:** when I started the stack, the UI returned 500. The web container had lost its `node_modules` volume, which was mounted inside the `web/` bind mount.
- **Trigger, reproduced:** any one-off `bin/dc run --rm web ...` exiting.
- **Fix:**
  - The web image now runs `npm ci` into `/node_modules`, and compose only bind-mounts `web/` at `/app`.
  - Vite's `server.fs.allow` includes `/node_modules`.
  - `typecheck` and `build` use `tsc -b --singleThreaded`.
  - The unused `salary_mgmt_node_modules` volume was removed.
- **Verified:**
  - The UI and the API both keep serving after one-off `run` containers exit.
  - All web checks pass inside the running container, with a peak of 448 MB of 512 MB.
- Suggested commit: `install web packages in the image instead of a nested volume`

## Fix: JSON for every API path, and VS Code types

- **API:** `/`, `/api` and `/api/v1` now return the list of API endpoints as JSON, built from the routes. Any unknown path returns `{ "error": "No route matches ..." }` with status 404, instead of Rails' HTML pages. Request specs cover both.
- **VS Code:** added `.devcontainer/devcontainer.json` and an `editor` compose service.
  - The service uses the web image, 768m, a compose profile, and the repository mounted at `/workspace`.
  - Inside it, `vite/client`, `@types/node` and `@testing-library/jest-dom/vitest` resolve. `tsc` is clean, with a peak of 207 MiB.
  - Docker memory with the editor running is at most 79%.
- Suggested commit: `return json for every api path and add a vs code dev container`

## Check results (final run, all milestones)

| Check | Result |
| --- | --- |
| `bin/dc exec api bundle exec rspec` | 59 examples, 0 failures, about 0.8 s. Run twice with different random seeds. |
| `bin/dc exec api bin/rubocop` | 36 files, no offences |
| `bin/dc exec web npm test` | 25 tests in 6 files passed, about 8 s. Repeated runs pass. |
| `bin/dc exec web npm run lint` | oxlint: 0 warnings, 0 errors |
| `bin/dc exec web npm run typecheck` | Clean |
| `bin/dc run --rm --no-deps web npm run build` | Builds; warns about one chunk over 500 kB |
| `bin/check-comments` | No comments found in 88 files |
| Isolation vs `.preflight/` | Added only `salary_mgmt_api`, `salary_mgmt_web`, `salary_mgmt_editor` (when started), `salary_mgmt-api:dev`, `salary_mgmt-web:dev`, `salary_mgmt_bundle`, `salary_mgmt_storage` and `salary_mgmt_net`, all labelled `com.salary-mgmt=true`. Ports are bound to 127.0.0.1:3200 and 127.0.0.1:5180. No other resources changed. |
| Memory | At most 69% before each build and start. Running tests, typecheck and lint in a row inside the dev container peaked at 448 MB of 512 MB. |
| Git identity | Both identities are `Abhinav Shere <abhhinavdev12@gmail.com>` from `file:.git/config` |
