# Moderator Tooling

Moderator tooling exists to help a subreddit operate Pettit safely.

It is not part of the core player loop.

It is an operational layer around that loop.

---

# Current State

The current build uses subreddit-moderator authorization for operational tools rather than a personal developer username.

Moderator-only actions belong to the subreddit that owns the Pettit world.

Those actions are therefore available to moderators of the active subreddit and unavailable to ordinary players.

---

# Current Operational Tools

The current build includes moderator-scoped operational actions for:

* create post
* resolve current encounter
* reset Pettit world

These actions should remain moderator-scoped unless the game design changes significantly.

---

# Rules

Moderator tooling should:

* allow any moderator of the active subreddit to use moderator-only tools
* enforce permissions server-side
* keep normal community participation open to non-moderators
* return clear "not allowed" responses when access is denied
* avoid hidden developer exceptions in production paths

Moderator tooling should not:

* rely only on menu visibility
* trust the client to determine authorization
* hardcode one Reddit username as an admin model
* block ordinary players from voting, reading, naming, or gift submissions

---

# Security Model

Authorization should be checked in one shared server helper.

That helper should:

* read the current subreddit context
* read the current Reddit user
* verify the user is a moderator of that subreddit
* return a consistent denial message when the user is not allowed

This avoids permission drift across routes.

---

# Operational Tiers

Moderator tools should be thought of in two tiers.

## Safe Operational Tools

Examples:

* manually resolve the current encounter
* refresh or regenerate operational state
* open moderator management views

## Destructive Tools

Examples:

* reset Pettit world
* wipe state
* clear submissions or memories

Destructive tools should be more explicit in copy and confirmation behavior.

---

# UX Rules

If a moderator-only action is denied, the message should be plain and specific.

Recommended copy:

* Only moderators of this subreddit can use this tool.

Menu labels should describe the real role of the action.

Examples:

* Reset Pettit World
* Resolve Current Encounter

Avoid labels like "Dev Only" now that the access model is no longer developer-specific.

---

# Out Of Scope

This operational layer does not currently include:

* a full moderator dashboard
* analytics tooling
* moderation queues
* audit logs
* role hierarchies beyond subreddit moderator access

Those may come later if the operational surface grows.

---

# Validation

Confirm:

* a subreddit moderator can use moderator-only tools
* a non-moderator cannot use those same tools
* community contribution flows remain available to ordinary users
* server-side API routes are protected even if a client route is called directly
