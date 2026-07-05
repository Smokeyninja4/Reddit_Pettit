# Pettit

One Pet. Thousands of Owners.

Pettit is a community-raised virtual pet built for Reddit using Devvit and Phaser.

## Core Idea

Every subreddit raises a single shared Pettit.

The community votes on decisions, shapes its personality, creates memories, and writes its story together.

## Status

Submission candidate: polished first playable dashboard build

The current build supports a single shared Pettit per subreddit, one active daily encounter, persistent memories and journals in Redis, automated daily advancement with playtest resolve support, trait feedback after resolves, community gifts and naming, seasonal story moments, milestones, and a polished expanded dashboard UI.

## Current Features

- One shared Pettit per subreddit
- Encounter voting and daily resolve flow
- Persistent journals, memories, traits, and community stats
- Trait feedback after each resolved community choice
- Community gift rounds, naming, keepsakes, and shared milestones
- Expanded Phaser dashboard with hero, encounter, journal, memories, traits, and progress widgets
- Mobile, desktop, and fullscreen preview support with stabilized viewport switching

## Project Structure

- `src/client`: Phaser scenes, UI layout, splash view, and API client helpers
- `src/server`: Hono routes, gameplay loop orchestration, seed content, and Redis-backed state helpers
- `src/shared`: Shared domain models and API transport types
- `Pettit Docs`: Product, systems, and roadmap documentation used to guide development

## Stack

- [Devvit](https://developers.reddit.com/)
- [Vite](https://vite.dev/)
- [Phaser](https://phaser.io/)
- [Hono](https://hono.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Commands

- `npm run dev`: Starts a live Devvit playtest session
- `npm run build`: Builds the client and server bundles
- `npm run type-check`: Type checks the workspace
- `npm run lint`: Runs ESLint across the source tree
- `npm run deploy`: Type-checks, lints, and uploads a new app version
- `npm run launch`: Deploys and publishes the app
- `npm run login`: Logs the Devvit CLI into Reddit
- `npm run prettier`: Formats the workspace with Prettier

## Development Notes

- The app uses the existing Hono REST API for state, vote, and resolve flows.
- Persistent game state is stored in Redis and scoped to a subreddit.
- Expanded-view UI work should preserve the current Phaser resize and platform-switch stability behavior.
- Gameplay and persistence rules are documented in the files under `Pettit Docs`.
- `npm run build` currently surfaces Devvit/Vite warnings around `sourcemapFileNames` and `inlineDynamicImports`; they are upstream packaging warnings and are non-blocking for local build, playtest, and upload flows.
