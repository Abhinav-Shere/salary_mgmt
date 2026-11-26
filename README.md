# Salary Management

A small tool for an HR manager responsible for about 10,000 employees. It lets them add, view, edit and delete employees, and answers salary questions per country and job title: minimum, maximum, average and median, headcount, payroll, and how a role compares with the country average and with the same role elsewhere.

- `api/`: Rails 8.1 in API mode, SQLite, RSpec.
- `web/`: React 19, TypeScript, Vite, Mantine, TanStack Query, React Router, Vitest and React Testing Library.
- `docs/PLAN.md`: the plan, including the data model, the API, the screens and the architecture diagram.
- `docs/DECISIONS.md`: trade-offs, performance numbers and what I'd do next.
- `docs/AI_USAGE.md`: how I used AI on this project.
- `docs/PROGRESS.md`: the checks I ran after each milestone.
- `VERSIONS.md`: every pinned version, including base image digests.

## How it runs

Everything runs in Docker. Ruby, Node, gems and npm packages exist only inside this project's images and volumes, so nothing is installed on the host and other projects' toolchains are untouched.

`bin/dc` is the only way I call Docker Compose for this project. It:

- clears any `COMPOSE_*` environment variables;
- always passes `--project-name salary_mgmt --file compose.yaml`;
- refuses global options, `pull`, `--pull` and `--rmi all`;
- picks the API and web ports. The defaults are 3200 and 5180, bound to 127.0.0.1. If a port is taken by something else, it uses the next free one and prints it on `up`.

Every container, image, volume and network is named `salary_mgmt*` and labelled `com.salary-mgmt=true`. Both services are capped at 512 MB of memory.

## Setup

First, put the two name files in `api/db/seeds/` (see "Seeding 10,000 employees" below). Then:

```sh
bin/dc build api
bin/dc build web
bin/dc run --rm --no-deps api bin/setup
bin/dc up -d
```

- `bin/setup` installs the gems and runs `bin/rails db:prepare`. On a new database, that creates it, loads the schema and runs the seed.
- The web image installs the npm packages into `/node_modules` at build time, outside the `web/` bind mount. Node, Vite and TypeScript find them by walking up from `/app`.
- I build the two images one at a time on purpose, because Docker on my machine is shared with other projects.

- API health check: http://127.0.0.1:3200/up
- API endpoint list: http://127.0.0.1:3200/api/v1 (also at `/` and `/api`). Unknown paths return a JSON 404.
- UI: http://127.0.0.1:5180

In development, the Vite server proxies `/api` to the Rails container, so the browser only talks to one origin.

## Seeding 10,000 employees

The seed builds full names from `api/db/seeds/first_names.txt` and `api/db/seeds/last_names.txt`, one name per line. If either file is missing or empty, the seed stops with an error before touching any data.

```sh
bin/dc exec api bin/rails db:seed
```

It replaces all employees in one transaction, using batched inserts and a fixed random seed. Running it twice gives the same 10,000 rows. It prints the elapsed time.

To compare the batched seeder with one-row-at-a-time inserts:

```sh
bin/dc exec api bin/rails db:seed:benchmark
```

### Seed timing

These are numbers from my machine. The benchmark used the small fixture name lists in `api/spec/fixtures/files`, because my real name files were not in place yet. Insert time depends on the number of rows, not on the names.

| Approach | Rows | Time (median of 3) |
| --- | --- | --- |
| `Employee.create!` one row at a time | 1,000 | 2.41 s |
| Batched seeder (`insert_all!`, 1,000 per batch, one transaction) | 1,000 | 0.04 s |
| Batched seeder | 10,000 | 0.49 s |

The batched path is about 55 times faster for the same 1,000 rows. More detail is in `docs/DECISIONS.md`.

## Tests and checks

```sh
bin/dc exec api bundle exec rspec
bin/dc exec api bin/rubocop
bin/dc exec web npm test
bin/dc exec web npm run lint
bin/dc exec web npm run typecheck
bin/check-comments
```

- Backend: 59 examples. They cover model validations, the employees, lookups and insights endpoints, the endpoint list and JSON 404s, the `SalaryInsights` service against numbers worked out by hand, and the seeder. They take about one second.
- Frontend: 25 tests across 6 files. They cover the employee list, form, detail page and insights page, through the real components, with the network mocked by MSW. They take about 8 seconds.
- All web checks fit inside the running container's 512 MB next to the dev server. Running all three in a row peaked at 448 MB. Vitest uses one thread and `tsc` runs with `--singleThreaded` to stay under the cap.
- `bin/check-comments` greps the project's own source files for comments. The only lines it allows are shebangs and Ruby magic comments.

A production build of the UI runs in a one-off container, so it doesn't compete with the dev server for memory:

```sh
bin/dc run --rm --no-deps web npm run build
```

## Useful commands

```sh
bin/dc ps
bin/dc logs -f api
bin/dc exec api bin/rails console
bin/dc exec api bin/rails dbconsole
```

## Editing in VS Code

The npm packages exist only inside the web image. Opened on the host, VS Code finds an empty `web/node_modules` and marks the tsconfig files and imports red, even though `tsc` in the container is clean.

To fix that, I open the project in the Dev Container. It needs the Dev Containers extension.

1. Open this folder in VS Code.
2. Run "Dev Containers: Reopen in Container".

How it works:
- `.devcontainer/devcontainer.json` starts the `editor` service. It runs the same `salary_mgmt-web:dev` image, with the repository mounted at `/workspace` and a 768m memory cap.
- VS Code's TypeScript server runs there and resolves packages from `/node_modules`.
- The `editor` service is behind a compose profile, so `bin/dc up` doesn't start it. VS Code drives compose directly for this one service, using the project name from `compose.yaml`.
- To stop it after closing the window: `bin/dc stop editor`.

To add or upgrade an npm package, update the manifest and lock file from a one-off container, then rebuild the web image:

```sh
bin/dc run --rm --no-deps web npm install --save-exact --package-lock-only <package>
bin/dc build web
bin/dc up -d
```

## Cleanup

These commands remove only `salary_mgmt` resources. I don't run them unless I mean to.

| Command | Removes |
| --- | --- |
| `bin/dc down` | The `salary_mgmt_api` and `salary_mgmt_web` containers and the `salary_mgmt_net` network |
| `bin/dc down -v` | The above, plus the `salary_mgmt_bundle` and `salary_mgmt_storage` volumes (gems and the SQLite databases) |
| `bin/dc down -v --rmi local` | The above, plus the locally built `salary_mgmt-api:dev` and `salary_mgmt-web:dev` images (the web image holds the npm packages) |

`bin/dc` refuses `--rmi all`, so cleanup can never remove the shared base images or anything that belongs to another project.
