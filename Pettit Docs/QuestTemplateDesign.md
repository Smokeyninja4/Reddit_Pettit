\# QuestTemplateDesign.md



\# Quest Template Design



Quests should be data-driven.



Avoid hardcoding quest logic.



\---



\# Example Template



```json

{

&#x20; "id": "cave\_001",

&#x20; "category": "explore",

&#x20; "title": "A Strange Cave",

&#x20; "description": "I discovered a cave hidden behind a waterfall.",

&#x20; "options": \[

&#x20;   "Enter",

&#x20;   "Observe",

&#x20;   "Leave",

&#x20;   "Ask For Help"

&#x20; ]

}

```



\---



\# Outcome Templates



Enter



```text

Found Lantern

```



Observe



```text

Discovered Tracks

```



Leave



```text

Returned Home

```



Ask For Help



```text

Community Investigation

```



\---



\# Benefits



Adding content requires:



\* New template



Not:



\* New code



\---



\# Design Rule



Content should scale faster than code.



