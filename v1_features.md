# V1 Features

This file defines the intended V1 scope for Pettit.

## Included In V1

- One shared Pettit per subreddit.
- Deterministic subreddit identity for Pettit:
  - starter name
  - birthday summary
  - procedural/shared portrait source
- Encounter-based core loop:
  - one active encounter
  - community voting
  - outcome resolution
  - next encounter generation
- Trait system:
  - curiosity
  - chaos
  - trust
  - courage
  - persistent trait changes
  - derived mood updates
- Journal system:
  - persistent journal entries
  - multi-style journal voice selection
  - trait- and mood-influenced narration
- Memory system:
  - persistent memories
  - highlighted Memory Book view
  - archive browsing in the expanded experience
- Daily automation:
  - UTC daily advancement
  - automatic resolve when votes exist
  - no-vote day skip/advance behavior
  - self-healing catch-up on next load or interaction
- Trait feedback after resolved encounters.
- Community stats and long-term progress tracking.
- Community keepsakes:
  - curated gift rounds
  - persistent inventory
  - expanded gift catalog
- Community naming:
  - Pettit naming
  - gift naming
  - landmark naming
  - canon names stored in world state
- Community gift contributions:
  - subreddit menu submission flow
  - form-based gift idea collection
  - ballot formation through the main encounter loop
- Seasonal progression:
  - fixed UTC holiday calendar
  - themed encounter and journal influence
  - seasonal status in the dashboard
- Milestones / achievements:
  - shared subreddit achievements
  - milestone dashboard summary
- Stable splash + expanded mode flow with platform-switch handling for mobile, desktop, and fullscreen.

## Included For Playtest / Admin Support

- Manual resolve endpoint and button for playtesting.
- Dev reset menu action for the authorized submission-testing user only.
- Temporary naming multi-submit override for the authorized submission-testing user only.
- Release notes and README notes for current submission-candidate behavior.

## Not Included In V1

- 12-hour encounter cadence.
- Autonomous “Pettit chose for itself after a long absence” story flow.
- Audio, music, ambient sound, or sound effects.
- Advanced creature evolution systems beyond the current identity and trait-influenced portrait.
- Idle animation systems, weather effects, footprints, sleep cycles, or seasonal motion layers.
- Cross-community systems:
  - migration
  - multiple Pettits per subreddit
  - family trees
  - travel between communities
  - global directories or world maps
- Trading, breeding, diplomacy, guilds, politics, or other meta systems.
- Gift-history timeline or long-form item biography system.
- Moderator tooling beyond the current menu/form flows.
- User profile systems, contribution history pages, or reward economies.
- Any further mechanics not already shipped in the current encounter, journal, memory, gift, naming, milestone, and seasonal loop.
