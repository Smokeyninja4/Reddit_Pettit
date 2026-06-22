# Pettit

One Pet. Thousands of Owners.

Pettit is a community-raised virtual pet built for Reddit using Devvit and Phaser.

## Core Idea

Every subreddit raises a single shared Pettit.

The community votes on decisions, shapes its personality, creates memories, and writes its story together.

## Status

Early prototype: first playable

The current build supports a single shared Pettit per subreddit, community voting on one active quest, persistent memories and journals in Redis, and a manual vote-resolution flow for playtesting.

## Stack

- [Devvit](https://developers.reddit.com/)
- [Vite](https://vite.dev/)
- [Phaser](https://phaser.io/)
- [Hono](https://hono.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Commands

- `npm run dev`: Starts a live Devvit playtest session
- `npm run build`: Builds the client and server bundles
- `npm run deploy`: Type-checks, lints, and uploads a new app version
- `npm run launch`: Deploys and publishes the app
- `npm run login`: Logs the Devvit CLI into Reddit
- `npm run type-check`: Type checks the workspace
- `npm run lint`: Runs ESLint across the source tree
