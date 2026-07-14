# HardeningPass.md

# Hardening And Descaffolding Pass

This pass improves reliability and removes submission-era shortcuts without expanding Pettit's feature scope.

The goal is to make the current systems safer, clearer, and more public-ready.

---

# Pass Goals

* keep moderator-only actions protected on the server
* stop advertising moderator-only controls to non-moderators in the client
* remove personal-user testing overrides that no longer belong in the live rules
* recover more safely from stale or malformed stored encounter state
* align docs and validation notes with the current behavior

---

# Scope

## 1. Moderator Tooling Hardening

Add moderator-aware viewer state so the client can hide or disable moderator-only controls for non-moderators.

Server enforcement remains the real security boundary.

Client visibility is only a usability improvement.

This pass should cover:

* manual resolve visibility in the client
* moderator-only operational actions already present in the build
* clear denial messaging if a protected route is still called directly

---

## 2. Submission-Era Descaffolding

Remove old testing shortcuts that were useful during submission playtesting but should not stay in the live rules.

This includes:

* personal-username naming overrides
* stale "authorized testing username" references in docs and checklists
* outdated developer-specific behavior descriptions where the code no longer works that way

---

## 3. Stored-State Resilience

Pettit should not crash just because an older subreddit world contains an encounter template ID that is no longer valid.

This pass should make the stored encounter load path recover cleanly when it sees:

* malformed encounter IDs
* stale encounter IDs
* removed or unsupported encounter template references

Recommended fallback:

* log the recovery
* rebuild a safe default encounter using the current sequence number when possible
* continue loading the rest of the subreddit world

---

# Non-Goals

Do not add:

* a full moderator dashboard
* advanced audit logs
* rate-limiting infrastructure beyond lightweight route hardening
* new gameplay systems

---

# Validation

Confirm:

* non-moderators do not see or use moderator-only resolve controls in the client
* moderator-only routes still enforce subreddit moderator access on the server
* naming submissions follow one-user-per-target rules with no hidden testing bypass
* stale encounter state falls back cleanly instead of crashing the API state load
* docs and checklists reflect the new public-facing behavior
