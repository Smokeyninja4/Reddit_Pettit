# ProjectStructure.md

# Current Project Structure

```text
/src
  /client
    /scenes
    game.ts
    splash.ts
    pettitApi.ts
    pettitPortrait.ts
  /server
    /auth
      ModeratorAccess.ts
    /core
      pettit-loop.ts
      pettit-store.ts
      pettit-seed.ts
      pettit-gifts.ts
      pettit-naming.ts
      pettit-seasonal.ts
      pettit-minor-events.ts
      pettit-story-arcs.ts
    /routes
      api.ts
      menu.ts
      forms.ts
      scheduler.ts
      triggers.ts
    index.ts
  /shared
    api.ts
    pettit.ts
```

---

# Responsibility Rules

Client

Owns Phaser scenes, layout, rendering, platform handling, and API calls for the live game experience.

---

Server Core

Owns Pettit's gameplay rules, encounter selection, persistence orchestration, traits, memories, naming, gifts, seasonal behavior, and progression.

---

Server Routes

Own the public and internal HTTP endpoints used by Devvit menu actions, forms, scheduler tasks, triggers, and client API requests.

---

Shared

Owns domain models and transport types shared between the client and server.

---

# Design Rule

Keep gameplay state and decision logic on the server.

Keep the client focused on presentation and interaction.

Use shared types as the contract between those layers.
