# Repository Guidelines

## Project Structure & Module Organization
Core code lives in `src/`. The CLI entry points are `src/main.js`, `src/wechat-main.js`, and `src/bjh-notion-main.js`. Platform integrations and workflow modules sit beside them, for example `src/baijiahao-api.js`, `src/wechat-api.js`, `src/article-generator.js`, and `src/notion-local-sync.js`. Utility scripts live in `scripts/`, currently `scripts/download-images.js` for image collection. Runtime content and local state are intentionally untracked: `images/`, `archive/`, `logs/`, `data/`, and `publish_config.json`.

## Build, Test, and Development Commands
Install dependencies with `npm install`.

Use these commands during development:
- `npm run check`: verify login state across supported platforms.
- `npm run batch`: generate and publish according to `publish_config.json`.
- `npm run batch:dry`: run the batch flow without pushing content.
- `npm run wx:batch`: sync or push WeChat drafts.
- `npm run bjh:sync`: pull Notion content into local Markdown.
- `npm run bjh:status`: inspect local sync and publish state.
- `node scripts/download-images.js <work>`: fetch candidate image assets for a work.

Prefer dry-run or status commands before any publish command.

## Coding Style & Naming Conventions
This project uses CommonJS (`require`, `module.exports`) and plain Node.js scripts. Follow the existing style: 2-space indentation, semicolons, single quotes, and small focused modules under `src/`. Use kebab-case for file names (`batch-publish.js`) and lowerCamelCase for functions and variables. Keep CLI wiring in entry files and isolate platform or content logic in dedicated modules.

## Testing Guidelines
There is no automated test suite yet. Validate changes with targeted CLI runs, especially `npm run batch:dry`, `npm run check`, and platform-specific status commands. When touching publish logic, test the safest non-publishing path first and document the exact command used in the PR.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style: `feat:`, `fix:`, and optional scopes such as `feat(sync):`. Keep subjects short and action-oriented. For PRs, include:
- a clear summary of the workflow changed
- any config or env keys added or updated
- sample commands used for verification
- screenshots or terminal excerpts when draft/publish behavior changes

## Security & Configuration Tips
Never commit `.env.local`, cookies, API keys, or real `publish_config.json` values. Start from `.env.local.example` and `publish_config.json.example`. Treat `images/` and synced article data as local working data, not source of truth.
