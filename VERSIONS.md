# Versions

Everything below runs only inside this project's Docker images and volumes. Nothing is installed on the host.

## Base images

| Image | Tag | Index digest |
| --- | --- | --- |
| Ruby | `ruby:3.4.13-slim` (Debian trixie) | `sha256:f038b6952ce49d4d7bcbe2a6c194299f5c70b45fc6d9f9fec4798c4c0f61aed3` |
| Node | `node:24.22.3-slim` (Debian bookworm) | `sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530` |

Digests were resolved read-only with `docker buildx imagetools inspect` on 2026-11-26.

## Backend (api)

| Tool | Version |
| --- | --- |
| Ruby | 3.4.13 |
| Bundler | 2.6.9 |
| Rails | 8.1.4.1 |
| sqlite3 gem | 2.10.2 (bundles SQLite 3.54.1) |
| Puma | 8.1.3 |
| Bootsnap | 1.26.2 |
| RSpec Rails | 8.1.0 |
| FactoryBot Rails | 6.5.1 |
| RuboCop Rails Omakase | 1.1.0 |

`api/Gemfile.lock` pins every gem exactly.

## Frontend (web)

| Package | Version |
| --- | --- |
| Node | 24.22.3 |
| npm | 11.19.1 |
| React / React DOM | 19.3.1 |
| TypeScript | 7.0.2 |
| Vite | 8.4.0 |
| @vitejs/plugin-react | 6.3.0 |
| Mantine (core, hooks, form, notifications) | 9.8.2 |
| TanStack Query | 5.108.4 |
| React Router | 8.5.3 |
| Vitest | 5.1.2 |
| React Testing Library | 16.3.3 |
| Testing Library user-event | 14.6.13 |
| jest-dom | 8.0.0 |
| MSW | 3.0.8 |
| jsdom | 31.0.1 |
| oxlint | 1.95.0 |

`web/package.json` uses exact versions (no `^` or `~`), and `web/package-lock.json` pins the full tree.

## Tooling on the host

| Tool | Version | Used for |
| --- | --- | --- |
| Docker Engine | 29.3.1 | Builds and runs everything |
| Docker Compose | 5.1.1 | Only through `bin/dc` |
