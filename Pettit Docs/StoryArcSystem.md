\# StoryArcSystem.md



\# Story Arc System



Story arcs let Pettit occasionally continue a previous day instead of always starting from a completely fresh prompt.



The goal is not to replace the normal encounter loop.



The goal is to make some stories feel like they have a "what happened next?".



\---



\# Purpose



Story arcs exist to:



\* increase return-rate through continuity

\* reward attention to earlier choices

\* make memories feel causally connected

\* give the journal stronger chapter-like moments



\---



\# Design Shape



Story arcs are:



\* still normal voted encounters

\* triggered by specific earlier outcomes

\* selected inside the existing next-encounter pipeline

\* uncommon enough to stay special



Story arcs are not:



\* a second daily vote system

\* a separate quest log

\* mandatory branching progression

\* a replacement for ordinary encounters



\---



\# Trigger Rules



A story arc may become the next encounter when:



\* Pettit resolves a qualifying encounter outcome

\* the follow-up is not too repetitive

\* no higher-priority system must run first



Examples:



\* entering the cave may lead to a lantern follow-up

\* studying cave tracks may lead to a deeper mystery

\* helping a traveller may lead to a return visit

\* watching the stars may lead to a constellation clue



\---



\# Priority



Story arcs should feel important, but they should not block all other systems forever.



Recommended selection order:



1. Naming encounters that are already ready

2. Community gift ballot encounters that are already ready

3. Story arc follow-ups

4. Existing cadence-based encounter selection



This preserves contribution systems while still giving arcs real visibility.



\---



\# Arc Rules



Story arcs should:



\* be readable even if a player missed the previous day

\* reward players who do remember the previous day

\* create one or two follow-up beats, not long quest trees

\* produce normal memories and journals

\* feel handcrafted rather than procedural



Story arcs should not:



\* appear too frequently

\* become the default content type

\* require UI tabs, maps, or backlog screens

\* punish communities for missing a day



\---



\# First Pass Scope



This pass should implement:



\* a lightweight story-arc template library

\* trigger logic from selected encounter outcomes

\* repeat protection through recent-arc tracking

\* support for short chains where appropriate



Suggested first arc families:



\* cave follow-ups

\* traveller return stories

\* star observation follow-ups



\---



\# Validation



Confirm:



\* qualifying encounter outcomes can produce a story arc as the next encounter

\* ordinary encounters still appear normally when no arc is triggered

\* story arc encounters resolve through the normal memory and journal flow

\* repeated arcs are softened by recent-history tracking
