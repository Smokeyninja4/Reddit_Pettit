\# Architecture.md



\# System Architecture



Pettit is designed as a state-driven community simulation.



The application should remain simple, modular, and easy to extend.



\---



\# Core Layers



```text

UI Layer

&#x20;   ↓

Application Layer

&#x20;   ↓

Game State Layer

&#x20;   ↓

Storage Layer

```



\---



\# UI Layer



Responsible for:



\* Displaying Pettit

\* Showing votes

\* Showing journals

\* Showing quests

\* Showing memories



The UI should not contain business logic.



\---



\# Application Layer



Responsible for:



\* Vote processing

\* Quest processing

\* Trait updates

\* Journal creation

\* Event generation

\* Authorization for moderator-only operational actions



This layer contains the majority of Pettit's logic.



\---



\# Authorization Boundary



Moderator-only tooling must be enforced on the server.



Menu visibility is helpful UX.



It is not sufficient security.



If an action can change or reset Pettit's state, the server must verify the caller is allowed to do it.



Recommended rule:



\* community actions remain open to normal users

\* operational actions require subreddit moderator access

\* authorization logic should live in a shared helper rather than being duplicated across routes



\---



\# Game State Layer



Represents the current state of Pettit.



Examples:



\* Traits

\* Mood

\* Memories

\* Inventory

\* Active quest



The game state should be considered the source of truth.



\---



\# Storage Layer



Responsible for:



\* Saving state

\* Loading state

\* Historical records



Storage should never contain business logic.



\---



\# Design Rule



All systems should operate by reading and modifying Pettit's state.



No system should bypass the central state model.



