# V1 Checklist

Use this as the final manual sign-off sheet for the V1 submission candidate.

## Build And Startup

- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run dev` starts a working Reddit playtest session.
- [ ] The known Devvit/Vite warnings still appear only as non-blocking build warnings.

## Fresh World Boot

- [ ] After a reset or first install, a fresh subreddit world loads without crashing.
- [ ] The subreddit gets one shared Pettit with a starter name, birthday summary, and generated portrait.
- [ ] The splash screen loads correctly and opens expanded mode.
- [ ] The first active encounter appears with readable choices.

## Vote / Resolve Loop

- [ ] Each visible encounter option can be voted on successfully.
- [ ] Duplicate voting is blocked for the same user on the active encounter.
- [ ] Vote totals update after a successful vote.
- [ ] Manual resolve still advances the story correctly.
- [ ] A resolved encounter updates traits, journal, memories, and the next encounter.
- [ ] Trait feedback appears after a resolved encounter.

## Daily Automation And Catch-Up

- [ ] A voted day resolves through the normal outcome pipeline.
- [ ] A zero-vote day advances to a fresh encounter without creating a memory or journal.
- [ ] Reload after a missed day catches the world up correctly.
- [ ] Catch-up does not duplicate journals, memories, gifts, or naming outcomes.

## Naming

- [ ] The naming form opens from the subreddit menu when a target is eligible.
- [ ] A normal user can submit one name per target.
- [ ] Duplicate candidate names are rejected.
- [ ] After three valid submissions, the naming ballot becomes eligible in the main encounter loop.
- [ ] Resolving a naming encounter writes the canon name into the world and persists it after refresh.
- [ ] Naming submissions allow one submission per user per target.

## Community Gift Contributions

- [ ] The community gift form opens from the subreddit menu.
- [ ] Gift name, category, and description validation works.
- [ ] Duplicate gift ideas are rejected cleanly.
- [ ] A user can submit only one gift idea per filling ballot.
- [ ] After three valid submissions, the community gift ballot becomes eligible in the main encounter loop.
- [ ] Resolving that encounter creates a persistent keepsake and normal memory/journal output.

## Seasonal, Milestones, And Memory Book

- [ ] Seasonal status appears correctly when an event is active.
- [ ] No active seasonal event falls back to ordinary-day copy without errors.
- [ ] Milestones unlock and persist without duplicating.
- [ ] The Memory Book preview renders without crashing.
- [ ] The Memory Book overlay opens, paginates, and closes correctly.

## Identity And Continuity

- [ ] The splash and expanded view show the same Pettit portrait source.
- [ ] The current Pettit name is consistent across splash, dashboard, journal, and naming surfaces.
- [ ] Keepsakes, canon names, memories, and milestones persist after refresh.

## Platform Stability

- [ ] Mobile loads correctly.
- [ ] Desktop loads correctly.
- [ ] Fullscreen loads correctly.
- [ ] Mobile -> desktop -> fullscreen works without a black or blank canvas.
- [ ] Fullscreen -> desktop -> mobile works without a black or blank canvas.

## Dev-Only Helper Verification

- [ ] Reset Pettit works for subreddit moderators.
- [ ] Reset Pettit is safely blocked for other users.
- [ ] The client does not show moderator-only resolve controls to non-moderators.

## Known Harmless Warnings

- [ ] `npm run build` may still show:
  - `sourcemapFileNames` invalid output option warning
  - `inlineDynamicImports` deprecation warning
- [ ] Confirm these remain non-blocking for local build, playtest, and upload flows.
