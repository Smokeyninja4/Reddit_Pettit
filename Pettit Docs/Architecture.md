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



This layer contains the majority of Pettit's logic.



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



