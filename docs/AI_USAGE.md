# AI usage

## How I used AI

I built this project with Claude Code, using Claude Opus 5.5 as a pair programmer working in my terminal. I gave it the brief and my rules: version isolation, Docker only, no comments, and a limited set of read-only git commands. Then:

- I asked it for a plan first and reviewed `docs/PLAN.md` before any code was written.
- I changed two things in the plan: the wording for deployment, and lower memory caps of 512 MB per service.
- After that I asked it to work through the remaining milestones without stopping, while I committed the work myself.

The AI wrote most of the code, the tests and these documents. My part was:

- setting the rules;
- reviewing the plan and correcting it;
- choosing the trade-offs;
- reading the code to make sure I can explain every file.

## What was verified, and how

- **Backend behaviour:**
  - 55 RSpec examples, run twice in random order with different seeds. They pass in about one second.
  - The `SalaryInsights` specs compare against numbers worked out by hand in the spec, including odd and even medians and rounding of a half dollar.
- **SQL insights on real volume.** With 10,000 seeded rows, I compared every country's min, max, average, median and headcount, and the median of every job title in India, against a plain Ruby calculation. There were 0 mismatches.
- **Frontend behaviour:**
  - 25 Vitest tests, run several times.
  - They run inside the running web container with `bin/dc exec web npm test`, which is the command the checks require.
- **End to end.** I ran `curl` through the Vite proxy against the running stack: create (201), validation errors (422 with field keys), update, the job title insight, delete (204), then 404.
- **Lint and types:**
  - RuboCop: 34 files, no offences.
  - oxlint: 0 warnings.
  - `tsc -b`: clean.
  - The production build succeeds.
- **No comments.** `bin/check-comments` greps 88 project files.
- **Performance.** The seed benchmark ran three times, and each endpoint was timed five times. The numbers are in `DECISIONS.md`.
- **Isolation.**
  - After each milestone, the Docker containers, images, volumes and networks were compared with the baseline saved in `.preflight/` before anything was created.
  - Only `salary_mgmt*` resources were added, and all carry the `com.salary-mgmt=true` label.
  - Docker memory was checked before every build and before starting containers.
- **Git identity.** Before each suggested commit, `git config --show-origin` and `git var` confirmed `Abhinav Shere <abhhinavdev12@gmail.com>` from `.git/config`.

## What was corrected along the way

| Problem | Fix |
| --- | --- |
| `rails new` reported a process killed while running at 512 MB, leaving the bundle incomplete | Re-ran `bundle install`, then checked that Rails boots and RuboCop runs |
| Bundler's index cache lived in `/root/.bundle`, outside any volume, so every run re-downloaded about 25 MB over a slow connection and timed out | Set `BUNDLE_USER_HOME` and `npm_config_cache` to paths inside the project's volumes |
| create-vite treated the target path as relative and scaffolded into `web/tmp/scaffold` | Moved the files into `web/` without overwriting anything |
| oxlint scanned `node_modules`, because the container doesn't see the root `.gitignore` | The lint script names `src` and `vite.config.ts` explicitly |
| Vitest started 10 jsdom workers and was killed at 512 MB, which also took down the dev server once | One worker, using threads |
| MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame` | Updated the test setup after reading the installed package's source |
| Mantine Selects matched two elements by label, and their dropdowns were still hidden while their opening animation ran | Added test helpers that query the input, and Mantine `env="test"` in the test render helper to turn transitions off |
| A retry test registered its one-off 500 handler before the success handler, so MSW never used it | Registered the failing handler last, since MSW checks the newest first |
| A request spec memoized the first response with `let(:json)` and asserted on it twice | Split it into two examples |
| Rails host authorization blocked the Vite proxy's `Host: api:3000` | `config.hosts << "api"` in development only |
| The long-running api container didn't see the SQLite volume nested under `/app/storage` and created an empty database on the host | Moved the volume to `/data` and pointed `database.yml` at it with `DATABASE_DIR` |
| After the first finished run, the UI returned 500 because the web container had lost its nested `node_modules` volume. I reproduced the trigger: any one-off `bin/dc run --rm web` container exiting | Installed the npm packages into `/node_modules` in the web image instead, outside the bind mount. Added `/node_modules` to Vite's `server.fs.allow`. Removed the unused `salary_mgmt_node_modules` volume. Then confirmed the server survives a one-off run |
| Running `tsc` inside the dev container, with its default parallel checkers, pushed it past 512 MB and the kernel killed it | `tsc -b --singleThreaded` in the typecheck and build scripts; measured each command's peak memory from the container's cgroup counter |
| `db:prepare` runs the seed on a new database, so setup failed without the name files | The README asks for the name files before `bin/setup` |
| The first `bin/check-comments` used `git ls-files`, which is outside my allowed git commands; the permission check blocked it | Rewrote it with `find` |
| The first version of the comment grep flagged Ruby splats (`**stats`) and path globs (`log/*`) | Tightened the patterns, and checked they still catch real comments |
| The setup notes needed the real name files, which were not in the repository yet | The seeder raises a clear error before deleting anything. The benchmark used the spec's fixture names, and I recorded that next to the numbers |

## The prompt, as written

```text
Build a minimal, usable salary management tool for an HR manager in a 10,000-employee organization. This is my own assessment solution: design and write it fresh in this folder. Don't copy code from any other repository.

THE BRIEF (requirements to meet)
- Employees: add, view, update and delete through the UI. Fields: full name, job title, country, salary, plus other meaningful data.
- Salary insights through the UI:
  (a) minimum, maximum and average salary in a country;
  (b) average salary for a given job title in a country;
  (c) other metrics that help an HR manager.
- End-to-end working software: backend, relational DB (SQLite) and a React UI with a component library.
- Seed script: 10,000 employees, full names combining first_names.txt and last_names.txt. Engineers run it regularly, so its performance matters.
- Production-quality code; a meaningful set of fast, deterministic, readable unit tests that cover the core functionality; good structure.
- Artifacts: planning notes, an architecture diagram, the AI prompts used, trade-offs and performance considerations.
- Deployment and a video demo are out of scope for now.

RULES (always)
- Code style:
  - No comments in any code, test, config or script file. The only exceptions are lines that aren't really comments: shebangs (#!/usr/bin/env …) and Ruby magic comments (# frozen_string_literal: true).
  - Remove the comments that generators add (rails new, Vite templates) from the files we keep and edit.
  - Write natural, idiomatic code, the way an experienced Rails and React developer writes it: clear names instead of explanations, small methods, no boilerplate, no speculative abstractions, no unused code, no placeholder TODOs. If code needs a comment to be understood, rename or simplify it instead.
  - Every file must be something I can explain in an interview.
- Version isolation. My machine has other projects (for example Themis) that depend on the host's Ruby, Rails, Bundler, Node and gems.
  - Never install, upgrade, downgrade or remove anything on the host: no brew, gem, bundle, npm, yarn, npx, rbenv, rvm, asdf, nvm or mise, and no change to ~/.gemrc, ~/.bundle, ~/.npmrc, shell profiles or any global config.
  - Ruby, Rails, Bundler, gems, Node and npm packages exist only inside this project's Docker images and volumes, at the versions pinned in VERSIONS.md. Never run rails, bundle, ruby, node or npm directly on the host; only through bin/dc.
  - Never read, change or run anything in the Themis folder or any other project.
- Git:
  - My identity is already configured in this repository: Abhinav Shere <abhhinavdev12@gmail.com>.
  - You may run only these read-only git commands: git config --show-origin --get user.name, git config --show-origin --get user.email, git var GIT_AUTHOR_IDENT, git var GIT_COMMITTER_IDENT, git status and git diff --cached --stat.
  - Never run any other git command and never change any git config.
  - After each milestone, before printing the suggested commit message:
    (1) run the identity checks; both identities must be exactly "Abhinav Shere <abhhinavdev12@gmail.com>", from file:.git/config. If anything else appears (for example an Abhishek name or a clio.com email), stop and tell me;
    (2) run git status and check that no secret, .env, .preflight/, database or log file would be committed.
  - Then print a one-line suggested commit message: short, plain, lowercase start, no prefixes or emojis. I commit and push myself, then say "next".
- Create a .gitignore (writing the file is fine) covering: .preflight/, .env, node_modules/, log/*, tmp/*, storage/*.sqlite3*, config/master.key, coverage/, the frontend dist/ folder, and .DS_Store. Never put secrets in tracked files.
- Work only inside this folder.
- Docker isolation:
  - Compose project name salary_mgmt, used only through a bin/dc wrapper. It clears COMPOSE_* variables, forces --project-name salary_mgmt --file compose.yaml, and refuses global options, pull, --pull and --rmi all.
  - Base images pinned by digest (resolve them read-only with docker buildx imagetools inspect).
  - Unique names and the label com.salary-mgmt=true on the network, volumes and image.
  - Ports bound to 127.0.0.1, checked free first (default 3200 for the API, 5180 for the UI); if one is taken, use the next free port.
  - Memory caps on every service (api 768m, web 768m). Before heavy steps, check docker stats --no-stream; if memory is tight, stop and tell me.
  - Never run prune, rm, rmi, stop, kill, restart, tag or bulk commands on anything that isn't salary_mgmt*. Never touch Themis containers, images, volumes or networks.
  - Before creating anything, save baseline lists of containers, images, volumes and networks to .preflight/. Compare against them after each milestone.

STACK
Ask me first: "Which backend language and framework does your job description name?" If I don't specify, use Rails 8 (API mode) + SQLite + RSpec. Frontend: React + TypeScript + Vite + Mantine, with Vitest + React Testing Library. Pin exact versions in VERSIONS.md.

MILESTONES (stop after each one)
0. Plan, no code: docs/PLAN.md with:
   - the HR manager's real questions;
   - the scope (in and out);
   - the data model and why each extra field exists;
   - the API;
   - the screens;
   - each insight metric and why it helps the persona;
   - the seed design;
   - the testing approach;
   - an architecture diagram (Mermaid);
   - trade-offs.
   Wait for my "go".
1. Docker skeleton: Dockerfile.dev for the api and web services, compose.yaml, bin/dc, .dockerignore, .gitignore, an empty backend and an empty Vite app. Check: both start, /up returns 200, the UI loads.
2. Employee model: full_name, job_title, country, salary (integer, annual, one currency), department, email (unique), hire_date. Validations; indexes on country, (country, job_title) and job_title. Unit tests.
3. Employee API under /api/v1/employees: list with pagination (never return all 10,000), search by name, filters by country and job title, plus show, create, update, delete. JSON errors, 422 with field errors, 404. Request tests.
4. Insights, all from SQL aggregates, in one service object:
   - per country: min, max, average;
   - per country and job title: the average;
   - extra metrics from the plan, for example headcount, median and the country comparison.
   API under /api/v1/insights. Unit tests against hand-computed numbers.
5. Seed script:
   - 10,000 employees; names from db/seeds/first_names.txt + last_names.txt (I place my files there; if they're missing, stop and tell me);
   - bulk inserts in batches inside one transaction; deterministic random seed;
   - safe to re-run (replace, no duplicates); prints its elapsed time.
   Unit tests: count, names come from the files, every row is valid, deterministic, a missing file raises. Measure the time against a naive one-row-at-a-time insert on 1,000 rows, and record both.
6. UI, employees:
   - a table with server-side pagination, search and filters;
   - add/edit forms with client-side validation and server errors shown on the fields;
   - a view/detail page;
   - delete with confirmation;
   - loading, empty and error states.
   Component tests.
7. UI, insights:
   - a country selector showing min/max/avg (requirement a);
   - a job title selector, within the chosen country, showing that title's average salary (requirement b), plus a job-title table for the country;
   - the extra metrics (requirement c);
   - loading, empty and error states.
   Component tests.
8. Artifacts, in plain first-person wording, without marketing words or emojis:
   - README: what it is, setup, the bin/dc commands, tests, seed timing, cleanup;
   - docs/DECISIONS.md: trade-offs, performance numbers, what I'd do next;
   - docs/AI_USAGE.md: how AI was used, what was verified and how, what was corrected, with this prompt included as written.

CHECKS FOR EVERY MILESTONE
- Backend tests and bin/dc exec web npm test pass, fast and deterministic. Linter and tsc are clean.
- A grep over the project's own source files finds no comments other than shebangs and magic comments.
- The isolation check against .preflight/ shows only salary_mgmt* resources and the pinned base images.
- Record the results in docs/PROGRESS.md.

CLEANUP (document it in the README; never run it unless I ask)
bin/dc down / bin/dc down -v / bin/dc down -v --rmi local. Each removes only salary_mgmt resources.
```

## Follow-up instructions, as written

After reviewing the plan:

```text
Before milestone 1, two changes to docs/PLAN.md:
1. In the out-of-scope table, change the deployment row to: "Deployment and video demo | Deferred: required by the brief's Readiness section, planned after the core app is complete."
2. Memory: lower the caps to api 512m and web 512m everywhere in the plan. Build one image at a time, and check docker stats --no-stream before each build and before starting the containers. If Docker memory use would go above about 85%, stop and tell me. Never stop or touch any other container.
Update PROGRESS.md to match.

go: start milestone 1 (Docker skeleton) with these caps. When it's done, run all milestone checks and the git identity and status checks, then stop with a suggested commit message.
```

During milestone 1:

```text
do one thing continue with the implementation do the commits as per plan we will push all at once I dont want you to ask me run the commands you do it by yourself and tell me once you finisted then only I will the commits all at once
```
