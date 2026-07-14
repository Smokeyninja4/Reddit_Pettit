# SystemDepthPass.md

# System Depth Audit And Expansion Plan

This document defines the next major Pettit improvement cycle after the minor events, rare encounter pacing, and memory recall passes.

The goal is not to add a new mechanic layer.

The goal is to deepen the systems already in V1 so Pettit feels richer, more replayable, and more lovable inside the existing loop.

---

# Audit Summary

# What Already Feels Strong

The current build already has good structural coverage for:

* one active encounter loop
* trait-shaped encounter selection
* rare encounters
* seasonal encounter influence
* curated gift rounds
* community gift contributions
* naming flow
* milestone unlocks
* journal voice variation
* memory recall

The project no longer needs broad new systems to feel more playable.

It now benefits more from content depth, catalog alignment, and better coverage across existing systems.

---

# Main Gaps Found

## 1. Encounter Content Has Good Breadth But Needs More Story Density

The live encounter system has a healthy base:

* 4 standard trait families
* 15 generated titles per family
* 10 rare encounters
* seasonal encounter content

What still feels thin:

* social/community-flavored standard encounters are underrepresented compared with exploration/mystery energy
* the docs catalogs lag behind the live library
* rare encounters are better paced now, but the rare library itself is still small enough to become familiar
* some handcrafted story beats are still concentrated in a smaller set of memorable encounters

---

## 2. Gift Coverage Is Broader In Code Than In Docs, But Still Has Expansion Headroom

The live gift library is much larger than the docs imply.

The current library includes:

* books
* clothing
* tools
* toys
* funny gifts
* community gifts
* seasonal-only gifts

What still feels thin:

* docs catalog is now behind the live catalog
* some categories could use more identity-rich or story-specific gifts
* stronger encounter-to-gift thematic pairing would make gifts feel less generic
* community/naming surfaces benefit from having more memorable candidate items

---

## 3. Journal And Memory Systems Are Mechanically Stronger Than Their Content References

Recent work improved:

* minor event flavor
* rare contextual pacing
* memory callback selection

What still feels thin:

* docs examples underrepresent the current expressive range
* milestone celebration lines are still narrow
* journal content expansion can better reflect festivals, gifts, recalls, and notable funny moments
* more specific memory phrasing would help repeated play stay fresh longer

---

## 4. Achievements And Seasonal Systems Work, But Their Content Layer Is Lighter Than The Core Loop

The current achievement list covers:

* growth
* votes
* discoveries
* memory milestones
* a few funny outcomes

What still feels thin:

* community celebrations are only lightly represented
* funny achievement coverage is narrow compared with the encounter library
* seasonal content is structurally rich but can still use more supporting copy, payoff, and milestone tie-ins

---

# Recommendation

The next major expansion should be a three-pass system depth cycle:

1. Encounter and rare content expansion
2. Gift, keepsake, and naming content expansion
3. Journal, memory, achievement, and seasonal polish

This stays inside V1 scope and strengthens the systems already promised in [v1_features.md](C:/Users/mitch/PycharmProjects/Reddit_Pettit/pettit-together/v1_features.md).

---

# Pass 1 - Encounter And Rare Content Expansion

# Goal

Increase daily story variety by expanding the encounter library and improving content coverage inside the existing encounter loop.

---

# Scope

Add:

* more standard encounter titles across all four trait families
* stronger social/community-style encounter coverage
* more rare encounters
* better alignment between the live encounter library and docs catalogs

Recommended emphasis:

* trust and curiosity should get the strongest handcrafted additions
* rare encounters should expand enough to reduce familiarity
* community-feeling beats should appear more often in the ordinary loop

---

# Non-Goals

Do not:

* add a second active encounter
* add a new voting cadence
* add combat, failure states, or resource systems

---

# Validation

Confirm:

* standard encounter selection still works across all affinities
* rare encounter pacing still behaves correctly with the expanded rare library
* docs catalogs are updated to match live content direction

---

# Pass 2 - Gift, Keepsake, And Naming Content Expansion

# Goal

Make gifts and community ownership feel deeper by improving keepsake breadth and giving naming more memorable targets.

---

# Scope

Add:

* more curated gifts across underused themes
* stronger category identity for gifts
* more encounter-appropriate gift flavor
* improved docs catalog coverage
* more naming-worthy items and landmark opportunities where appropriate

Recommended emphasis:

* expand community and funny categories
* add more adventure-useful and story-specific tools
* add more emotionally memorable keepsakes instead of pure utility items

---

# Non-Goals

Do not:

* add economies, trading, or item power
* add long-form item biographies

---

# Validation

Confirm:

* gift encounter selection still works with the expanded library
* seasonal-only gifts remain gated correctly
* naming targets still form and resolve cleanly
* docs catalog reflects the new library direction

---

# Pass 3 - Journal, Memory, Achievement, And Seasonal Polish

# Goal

Make the expanded content land emotionally by improving the payoff surfaces that players actually read and remember.

---

# Scope

Add or improve:

* journal example coverage
* journal lines for broader content situations
* memory phrasing variety
* milestone celebration coverage
* additional achievements tied to community, funny, and seasonal moments
* seasonal supporting copy and story payoff where current coverage feels light

Recommended emphasis:

* keep journals charming and readable
* let achievements recognize naturally occurring stories
* make seasonal moments feel more commemorative, not just different

---

# Non-Goals

Do not:

* rebuild the journal architecture
* add player power rewards
* turn achievements into the main objective

---

# Validation

Confirm:

* journal generation remains stable across normal, rare, gift, and seasonal resolves
* milestone celebration text still appears cleanly
* seasonal behavior remains valid on active and inactive days
* achievements unlock without duplication

---

# Delivery Order

Work sequence:

1. audit and docs plan
2. Pass 1 implementation
3. stop for user review and commit/push
4. Pass 2 implementation
5. stop for user review and commit/push
6. Pass 3 implementation
7. stop for user review and commit/push

---

# Recommended Commit Descriptions

Pass 1:

`feat: expand encounter and rare story content`

Pass 2:

`feat: expand gift, keepsake, and naming content`

Pass 3:

`feat: polish journal, memory, achievement, and seasonal content`
