# NextFeaturePasses.md

# Planned Feature Passes

This document defines the next three implementation passes after the current submission-candidate build.

The order is intentional:

1. Minor events
2. Rare encounters
3. Memory recall

Each pass should ship independently.

After each pass:

* run validation
* let the user review
* stop for commit and push

---

# Guardrails

These passes should improve replayability and return-rate without expanding Pettit into a heavier game loop.

They should:

* reinforce the existing encounter -> memory -> journal cycle
* reuse current persistence and rendering systems where possible
* avoid introducing a second competing vote flow
* avoid requiring major UI restructuring

They should not:

* add currencies
* add combat or failure states
* add moderator-only management overhead
* turn journals into debug reports

---

# Pass 1 - Minor Events

# Goal

Add small story moments that make resolved days feel more alive without replacing the main active encounter.

Minor events are not full community-voted encounters.

They are lightweight flavor moments attached to the normal daily resolution pipeline.

---

# Why This Shape

The current build already has:

* one active encounter
* one vote flow
* one daily journal
* one daily memory created from the resolved encounter

Adding minor events as separate vote objects would create a second story track and add avoidable complexity.

For this pass, minor events should instead be:

* selected during encounter resolution
* influenced by trait, mood, and recent story context
* surfaced inside the journal as an extra beat
* optionally referenced in memory text when appropriate

---

# Pass 1 Scope

Implement:

* a small minor-event library
* weighted minor-event selection tied to current Pettit state
* journal integration for selected minor events
* no-vote-day safe behavior

Minor events should be:

* short
* low stakes
* story-first
* non-blocking

Examples:

* Friendly Dog
* Empty Campfire
* Hidden Waterfall
* Chased Own Tail
* Lost Hat
* Storyteller

---

# Pass 1 Rules

Minor events should:

* happen only alongside a resolved day with votes
* never replace the main encounter result
* not create a second memory record by default
* be able to influence journal wording
* feel like a bonus moment rather than a system chore

Recommended first implementation:

* at most one minor event per resolved day
* modest chance to trigger
* deterministic enough to test

Recommended fallback:

* if no suitable minor event is found, generate the journal normally

---

# Pass 1 Validation

Confirm:

* resolved voted days can include a minor event
* zero-vote advancement does not create a minor event
* journals still generate cleanly with and without a minor event
* minor events do not break encounter progression

---

# Pass 2 - Rare Encounters

# Goal

Make rare encounters feel more special, more contextual, and more visible as standout moments in Pettit's history.

---

# Current State

Rare encounters already exist in the build.

Current behavior is simple:

* a rare library exists
* rare turns appear on a fixed cadence
* seasonal bonuses can increase the chance

This pass should refine the existing system instead of replacing it.

---

# Pass 2 Scope

Implement:

* improved rare encounter eligibility logic
* better spacing so rare moments feel earned
* stronger use of recent history and repeat avoidance
* clearer integration with special-memory feeling

Rare encounters should remain:

* full voted encounters
* special moments in the normal loop
* high-importance story beats

Examples:

* Fallen Star
* Ghost Lantern
* Time Capsule
* Talking Tree
* Whispering Crown

---

# Pass 2 Rules

Rare encounters should:

* stay uncommon
* avoid clustering too tightly
* avoid obvious repeats
* feel more consequential than standard encounters
* continue using the normal voting and memory pipeline

Recommended direction:

* keep the existing cadence as a baseline safety net
* add softer spacing rules and contextual selection on top
* preserve seasonal rare boosts where already supported

---

# Pass 2 Validation

Confirm:

* rare encounters still resolve through the normal flow
* repeat protection still works
* special memories and journals still generate cleanly
* seasonal modifiers do not conflict with rare selection

---

# Pass 3 - Memory Recall

# Goal

Make journals feel more continuous by selecting better callback memories instead of only grabbing the most recent useful memory.

---

# Current State

Memory recall is already partially present.

Current behavior includes:

* journal templates with memory callback lines
* selection of one previous memory before journal generation
* simple seasonal preference for older important memories

This pass should improve selection quality rather than rebuilding journal generation.

---

# Pass 3 Scope

Implement:

* a stronger memory recall selector
* weighting by importance
* weighting by age and recency balance
* weighting by thematic fit where practical
* improved avoidance of repetitive callback use

The selected callback memory should:

* feel relevant to the day
* occasionally pull older important moments back into view
* strengthen Pettit's sense of continuity

---

# Pass 3 Rules

Memory recall should:

* prefer importance over randomness
* not always pick the immediately previous memory
* sometimes surface older community-defining moments
* avoid sounding repetitive across consecutive journals
* remain lightweight enough for deterministic testing

Recommended direction:

* score candidate memories
* bias toward importance 4-5 memories
* allow certain memory types to pair better with certain outcomes
* keep seasonal overrides where they already add useful flavor

---

# Pass 3 Validation

Confirm:

* journals still generate for ordinary resolves
* callback memories vary more naturally over time
* high-importance memories recur more often than low-importance ones
* seasonal memory-recall behavior still works

---

# Implementation Order

Work sequence:

1. Pass 1 - Minor events
2. stop for user review and commit/push
3. Pass 2 - Rare encounters
4. stop for user review and commit/push
5. Pass 3 - Memory recall
6. stop for user review and commit/push

---

# Recommended Decisions

These decisions are set unless implementation reveals a concrete problem:

* Minor events are journal-layer flavor, not a second encounter system.
* Rare encounters remain full active encounters in the main vote flow.
* Memory recall improves the current callback selector rather than replacing journal templates.
