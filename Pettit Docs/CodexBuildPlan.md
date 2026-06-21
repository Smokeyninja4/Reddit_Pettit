\# CodexBuildPlan.md



\# Pettit Codex Build Plan



\## Codex Instructions



You are helping build Pettit, a community-raised digital pet for Reddit Devvit.



Do not invent new features unless explicitly asked.



Follow the existing docs.



Before each task:



1\. Read the relevant docs.

2\. Explain your plan briefly.

3\. Implement only the requested files.

4\. Mark the task complete when done.

5\. Do not expand scope.



\---



\# Core Rules



\* State is the source of truth.

\* Services contain logic.

\* Components display data.

\* Storage only persists data.

\* Content should be data-driven.

\* Traits are personality, not levels.

\* Journals are the heart of the project.

\* The core loop comes first.



Core loop:



```text

Vote

↓

Trait changes

↓

Memory created

↓

Journal generated

↓

Quest generated

↓

Community responds

↓

Repeat

```



\---



\# Build Tracker



\## Phase 0 — Setup



\* \[ ] Create Devvit project

\* \[ ] Confirm local app runs

\* \[ ] Confirm deploy/test command works

\* \[ ] Create `/docs`

\* \[ ] Create `/src/models`

\* \[ ] Create `/src/services`

\* \[ ] Create `/src/storage`

\* \[ ] Create `/src/components`

\* \[ ] Create `/src/data`

\* \[ ] Create `/src/utils`



\---



\# Prompt 0 — Project Audit



```text

Read all files in /docs.



Task:

Audit the project structure.



Output:

1\. Current files found.

2\. Missing folders.

3\. Suggested implementation order.

4\. Any risks.



Do not write code yet.

```



\---



\# Phase 1 — Model Layer



\## Prompt 1 — Core Types



```text

Read:

\- docs/DataModel.md

\- docs/CoreLoop.md



Task:

Create the core TypeScript model layer.



Files:

\- src/models/Trait.ts

\- src/models/Memory.ts

\- src/models/Quest.ts

\- src/models/Vote.ts

\- src/models/Pettit.ts



Requirements:

\- Strong TypeScript interfaces/types.

\- Trait values are 0-100.

\- Include useful enums/unions where appropriate.

\- No UI.

\- No storage.

\- No business logic except simple type helpers if needed.



Before coding:

Explain the model plan.

```



Mark complete:



\* \[ ] Trait model

\* \[ ] Memory model

\* \[ ] Quest model

\* \[ ] Vote model

\* \[ ] Pettit model



\---



\## Prompt 2 — Model Validation Helpers



```text

Read:

\- docs/DataModel.md

\- docs/TraitRules.md



Task:

Create validation/helper utilities for model values.



Files:

\- src/utils/TraitUtils.ts

\- src/utils/DateUtils.ts

\- src/utils/Random.ts



Requirements:

\- Clamp traits between 0 and 100.

\- Provide trait creation defaults.

\- Provide safe random choice helper.

\- Provide simple date/day helpers.

\- Keep functions small and testable.

```



Mark complete:



\* \[ ] TraitUtils

\* \[ ] DateUtils

\* \[ ] Random utils



\---



\# Phase 2 — Storage Layer



\## Prompt 3 — Redis Storage Wrapper



```text

Read:

\- docs/RedisStorage.md

\- docs/Architecture.md



Task:

Create a Redis storage wrapper.



File:

\- src/storage/RedisStorage.ts



Requirements:

\- Save JSON.

\- Load JSON.

\- Delete keys if needed.

\- Handle missing values safely.

\- No game logic.

\- Keep API simple.

```



Mark complete:



\* \[ ] Redis wrapper



\---



\## Prompt 4 — Pettit Repository



```text

Read:

\- docs/DataModel.md

\- docs/RedisStorage.md



Task:

Create Pettit repository functions.



File:

\- src/storage/PettitRepository.ts



Requirements:

\- loadPettit()

\- savePettit()

\- createDefaultPettit()

\- getOrCreatePettit()

\- Use RedisStorage wrapper.

\- No UI.

```



Mark complete:



\* \[ ] Pettit repository



\---



\## Prompt 5 — History Repositories



```text

Read:

\- docs/DataModel.md

\- docs/MemorySystem.md

\- docs/JournalSystem.md



Task:

Create repositories for memories, journals, quests, and votes.



Files:

\- src/storage/MemoryRepository.ts

\- src/storage/JournalRepository.ts

\- src/storage/QuestRepository.ts

\- src/storage/VoteRepository.ts



Requirements:

\- Append records.

\- Load recent records.

\- Load all if needed.

\- Store as JSON.

\- Keep storage logic separate from game logic.

```



Mark complete:



\* \[ ] Memory repository

\* \[ ] Journal repository

\* \[ ] Quest repository

\* \[ ] Vote repository



\---



\# Phase 3 — Trait \& Memory Services



\## Prompt 6 — Trait Service



```text

Read:

\- docs/TraitRules.md

\- docs/TraitProfiles.md



Task:

Create TraitService.



File:

\- src/services/TraitService.ts



Requirements:

\- Apply trait changes from vote outcomes.

\- Clamp values between 0 and 100.

\- Include diminishing returns.

\- Detect dominant traits.

\- Detect basic personality profile.

\- No UI.

\- No storage.

```



Mark complete:



\* \[ ] Trait update logic

\* \[ ] Diminishing returns

\* \[ ] Dominant trait detection

\* \[ ] Personality profile detection



\---



\## Prompt 7 — Memory Service



```text

Read:

\- docs/MemorySystem.md

\- docs/MemoryExamples.md



Task:

Create MemoryService.



File:

\- src/services/MemoryService.ts



Requirements:

\- Create memory from vote result.

\- Create memory from quest result.

\- Create memory from gift.

\- Assign memory category.

\- Assign importance 1-5.

\- Select memories for journal recall.

```



Mark complete:



\* \[ ] Vote memory creation

\* \[ ] Quest memory creation

\* \[ ] Gift memory creation

\* \[ ] Memory recall selection



\---



\# Phase 4 — Vote System



\## Prompt 8 — Vote Templates



```text

Read:

\- docs/VoteProcessing.md

\- docs/TraitRules.md



Task:

Create vote templates.



File:

\- src/data/VoteTemplates.ts



Requirements:

\- Include daily question templates.

\- Include options.

\- Each option should map to trait effects.

\- Keep as data, not hardcoded service logic.

```



Mark complete:



\* \[ ] Vote templates



\---



\## Prompt 9 — Vote Service



```text

Read:

\- docs/VoteProcessing.md

\- docs/CoreLoop.md



Task:

Create VoteService.



File:

\- src/services/VoteService.ts



Requirements:

\- Create daily vote.

\- Record user vote.

\- Prevent duplicate vote from same user for same vote.

\- Count votes.

\- Determine winner.

\- Return vote summary.

\- No UI.

```



Mark complete:



\* \[ ] Create vote

\* \[ ] Record vote

\* \[ ] Prevent duplicates

\* \[ ] Count votes

\* \[ ] Select winner



\---



\# Phase 5 — Journal System



\## Prompt 10 — Journal Templates



```text

Read:

\- docs/JournalSystem.md

\- docs/JournalExamples.md

\- docs/MoodProfiles.md

\- docs/TraitProfiles.md



Task:

Create journal template data.



File:

\- src/data/JournalTemplates.ts



Requirements:

\- Opening lines by mood.

\- Reflection lines by trait.

\- Closing lines.

\- Funny/chaos lines.

\- Memory callback lines.

\- Keep content data-driven.

```



Mark complete:



\* \[ ] Journal template data



\---



\## Prompt 11 — Journal Service



```text

Read:

\- docs/JournalSystem.md

\- docs/JournalGeneration.md

\- docs/JournalExamples.md



Task:

Create JournalService.



File:

\- src/services/JournalService.ts



Requirements:

\- Generate journal from:

&#x20; - recent vote result

&#x20; - mood

&#x20; - dominant traits

&#x20; - recent memories

&#x20; - quest outcome

\- Output 100-300 words where possible.

\- Avoid system-report tone.

\- Make it sound like Pettit.

\- No external AI required for MVP.

```



Mark complete:



\* \[ ] Journal generation

\* \[ ] Mood influence

\* \[ ] Trait influence

\* \[ ] Memory callbacks



\---



\# Phase 6 — Quest System



\## Prompt 12 — Quest Templates



```text

Read:

\- docs/QuestSystem.md

\- docs/QuestCatalog.md

\- docs/QuestTemplateDesign.md



Task:

Create quest template data.



File:

\- src/data/QuestTemplates.ts



Requirements:

\- Include explore, learn, build, social, mystery, community quests.

\- Each quest has:

&#x20; - id

&#x20; - title

&#x20; - description

&#x20; - category

&#x20; - options

&#x20; - possible outcomes

&#x20; - trait effects if relevant

\- Keep as data.

```



Mark complete:



\* \[ ] Quest templates



\---



\## Prompt 13 — Quest Service



```text

Read:

\- docs/QuestSystem.md

\- docs/QuestCatalog.md

\- docs/EventSystem.md



Task:

Create QuestService.



File:

\- src/services/QuestService.ts



Requirements:

\- Generate quest from Pettit state.

\- Resolve quest from winning option.

\- Create quest outcome.

\- Return memory candidate.

\- Avoid repeating same quest too often.

```



Mark complete:



\* \[ ] Quest generation

\* \[ ] Quest resolving

\* \[ ] Outcome generation

\* \[ ] Repeat prevention



\---



\# Phase 7 — Core Loop Orchestrator



\## Prompt 14 — Daily Loop Service



```text

Read:

\- docs/CoreLoop.md

\- docs/VoteProcessing.md

\- docs/JournalGeneration.md



Task:

Create DailyLoopService.



File:

\- src/services/DailyLoopService.ts



Requirements:

\- Process completed vote.

\- Apply trait effects.

\- Create memory.

\- Generate journal.

\- Generate next quest.

\- Save updated state through repositories.

\- Return updated summary for UI.



This is the main gameplay pipeline.

```



Mark complete:



\* \[ ] Process vote result

\* \[ ] Update Pettit

\* \[ ] Create memory

\* \[ ] Generate journal

\* \[ ] Generate quest

\* \[ ] Save state



\---



\# Phase 8 — UI Components



\## Prompt 15 — Pettit Card



```text

Read:

\- docs/Vision.md

\- docs/DataModel.md



Task:

Create Pettit display component.



File:

\- src/components/PettitCard.tsx



Requirements:

\- Show Pettit name.

\- Show age.

\- Show mood.

\- Show dominant traits.

\- Keep UI simple and viewport-safe.

```



Mark complete:



\* \[ ] Pettit card



\---



\## Prompt 16 — Vote Card



```text

Read:

\- docs/VoteProcessing.md



Task:

Create VoteCard component.



File:

\- src/components/VoteCard.tsx



Requirements:

\- Show active vote question.

\- Show options.

\- Allow selecting one option.

\- Show current totals if available.

\- Avoid clutter.

```



Mark complete:



\* \[ ] Vote card



\---



\## Prompt 17 — Journal Card



```text

Read:

\- docs/JournalSystem.md



Task:

Create JournalCard component.



File:

\- src/components/JournalCard.tsx



Requirements:

\- Show latest journal.

\- Show title/date.

\- Keep readable.

\- No giant wall of text.

```



Mark complete:



\* \[ ] Journal card



\---



\## Prompt 18 — Quest Card



```text

Read:

\- docs/QuestSystem.md



Task:

Create QuestCard component.



File:

\- src/components/QuestCard.tsx



Requirements:

\- Show active quest.

\- Show options.

\- Allow voting/responding.

\- Show status.

```



Mark complete:



\* \[ ] Quest card



\---



\## Prompt 19 — Memory Card



```text

Read:

\- docs/MemorySystem.md



Task:

Create MemoryCard component.



File:

\- src/components/MemoryCard.tsx



Requirements:

\- Show recent memories.

\- Show category.

\- Show importance subtly.

\- Keep compact.

```



Mark complete:



\* \[ ] Memory card



\---



\# Phase 9 — App Integration



\## Prompt 20 — Main App Wiring



```text

Read:

\- docs/Architecture.md

\- docs/ProjectStructure.md

\- docs/CoreLoop.md



Task:

Wire the main app together.



Requirements:

\- Load or create Pettit.

\- Display PettitCard.

\- Display active VoteCard.

\- Display active QuestCard.

\- Display latest JournalCard.

\- Display recent MemoryCard list.

\- Ensure state updates after interaction.

```



Mark complete:



\* \[ ] App loads Pettit

\* \[ ] Vote visible

\* \[ ] Quest visible

\* \[ ] Journal visible

\* \[ ] Memories visible



\---



\# Phase 10 — Gifts \& Contributions



\## Prompt 21 — Gift Templates



```text

Read:

\- docs/UserContributions.md

\- docs/GiftCatalog.md



Task:

Create gift templates.



File:

\- src/data/GiftTemplates.ts



Requirements:

\- Include clothing, tools, toys, books, community items, funny gifts.

\- Gifts should have:

&#x20; - id

&#x20; - name

&#x20; - description

&#x20; - category

&#x20; - possible memory text

```



Mark complete:



\* \[ ] Gift templates



\---



\## Prompt 22 — Gift Service



```text

Read:

\- docs/UserContributions.md

\- docs/GiftCatalog.md



Task:

Create GiftService.



File:

\- src/services/GiftService.ts



Requirements:

\- Generate gift vote.

\- Resolve winning gift.

\- Add gift to Pettit inventory.

\- Create gift memory.

```



Mark complete:



\* \[ ] Gift vote

\* \[ ] Add inventory item

\* \[ ] Gift memory



\---



\# Phase 11 — Achievements \& Events



\## Prompt 23 — Event Service



```text

Read:

\- docs/EventSystem.md

\- docs/EventCatalog.md



Task:

Create EventService.



File:

\- src/services/EventService.ts



Requirements:

\- Select minor events.

\- Select rare events.

\- Use mood/traits where possible.

\- Return event text and possible memory.

```



Mark complete:



\* \[ ] Minor events

\* \[ ] Rare events

\* \[ ] Trait-aware selection



\---



\## Prompt 24 — Achievement Service



```text

Read:

\- docs/AchievementSystem.md



Task:

Create AchievementService.



File:

\- src/services/AchievementService.ts



Requirements:

\- Detect milestones.

\- Create achievement records.

\- Avoid duplicate achievements.

\- Achievements should not grant power.

```



Mark complete:



\* \[ ] Milestone detection

\* \[ ] Duplicate prevention

\* \[ ] Achievement records



\---



\# Phase 12 — Testing



\## Prompt 25 — Core Service Tests



```text

Task:

Create tests for core services.



Cover:

\- TraitService

\- MemoryService

\- VoteService

\- JournalService

\- QuestService

\- DailyLoopService



Requirements:

\- Test happy paths.

\- Test edge cases.

\- Test trait caps.

\- Test duplicate votes.

\- Test journal output exists.

```



Mark complete:



\* \[ ] Trait tests

\* \[ ] Memory tests

\* \[ ] Vote tests

\* \[ ] Journal tests

\* \[ ] Quest tests

\* \[ ] Daily loop tests



\---



\## Prompt 26 — Storage Tests



```text

Task:

Create tests for storage layer.



Cover:

\- save/load Pettit

\- save/load memories

\- save/load journals

\- save/load quests

\- missing data fallback



Use mocks if needed.

```



Mark complete:



\* \[ ] Storage tests



\---



\# Phase 13 — Polish



\## Prompt 27 — UI Polish Pass



```text

Read:

\- docs/CompetitionSubmission.md



Task:

Polish the UI.



Goals:

\- Fit viewport.

\- No AI-slop layout.

\- Clear identity.

\- Easy to understand in 5 seconds.

\- Prioritise:

&#x20; 1. Pettit identity

&#x20; 2. Daily vote

&#x20; 3. Journal

&#x20; 4. Quest

&#x20; 5. Memories



Do not add new systems.

```



Mark complete:



\* \[ ] Viewport-safe UI

\* \[ ] Clear layout

\* \[ ] No clutter



\---



\## Prompt 28 — Content Polish Pass



```text

Read:

\- docs/JournalExamples.md

\- docs/QuestCatalog.md

\- docs/GiftCatalog.md



Task:

Improve starter content.



Goals:

\- Make journals charming.

\- Make quests memorable.

\- Make gifts funny/useful.

\- Avoid generic AI tone.

\- Keep Pettit simple and emotionally readable.

```



Mark complete:



\* \[ ] Better journals

\* \[ ] Better quests

\* \[ ] Better gifts



\---



\# Phase 14 — Submission Prep



\## Prompt 29 — Demo Script



```text

Read:

\- docs/CompetitionSubmission.md

\- docs/Vision.md



Task:

Create a short demo script.



Requirements:

\- Explain Pettit in under 30 seconds.

\- Show the core loop.

\- Highlight retention.

\- Highlight user contributions.

\- Avoid technical jargon.

```



Mark complete:



\* \[ ] Demo script



\---



\## Prompt 30 — README



```text

Read:

\- docs/Vision.md

\- docs/CoreLoop.md

\- docs/CompetitionSubmission.md



Task:

Create README.md.



Include:

\- What Pettit is.

\- How to run.

\- Core loop.

\- Why it fits Reddit.

\- Competition features.

\- Roadmap.

```



Mark complete:



\* \[ ] README



\---



\# Final MVP Checklist



Before adding stretch goals, confirm:



\* \[ ] Pettit loads

\* \[ ] Pettit state saves

\* \[ ] Community can vote

\* \[ ] Vote affects traits

\* \[ ] Memory is created

\* \[ ] Journal is generated

\* \[ ] Quest is generated

\* \[ ] Quest can be resolved

\* \[ ] UI fits viewport

\* \[ ] Demo is understandable in 30 seconds



\---



\# Stretch Goal Rule



Only start stretch goals after all MVP checklist items are complete.



Stretch goals:



\* \[ ] Inventory display

\* \[ ] Community gifts

\* \[ ] Achievements

\* \[ ] Rare events

\* \[ ] Hall of memories

\* \[ ] Community naming



Do not build:



\* Migration

\* Family trees

\* Cross-community travel

\* GhostWire

\* Global world map



until MVP is submitted or explicitly approved.



\---



\# Anti-Goblin Rule



If a new idea appears, add it to:



```text

docs/FutureIdeas.md

```



Do not implement it immediately.



Ask:



> Does this make Pettit more lovable right now?



If no, postpone it.



