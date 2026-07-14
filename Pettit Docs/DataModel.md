\# DataModel.md



\# Core Data Structures



This document defines the primary data models used throughout Pettit.



The structures described here represent logical models and are not tied to any specific database implementation.



\---



\# Pettit



Represents the community-raised creature.



\## Fields



```text

id

name

created\_at

age\_days

mood

traits

inventory

memories

current\_quest

journal\_count

story\_arc\_progress

```



\## Example



```json

{

&#x20; "id": "pettit\_001",

&#x20; "name": "Pettit",

&#x20; "age\_days": 47,

&#x20; "mood": "curious",

&#x20; "journal\_count": 46

}

```



\---



\# Traits



Traits influence journal tone, event selection, and quest generation.



\## Fields



```text

curiosity

creativity

wisdom

chaos

trust

courage

belonging

```



\## Example



```json

{

&#x20; "curiosity": 62,

&#x20; "creativity": 34,

&#x20; "wisdom": 28,

&#x20; "chaos": 71,

&#x20; "trust": 50,

&#x20; "courage": 43,

&#x20; "belonging": 56

}

```



\---



\# Memory



Represents an important event remembered by Pettit.



\## Fields



```text

id

timestamp

title

description

type

importance

```



\## Types



```text

learning

adventure

friendship

gift

quest

community

funny

special

```



\---



\# Inventory Item



Represents an item Pettit owns.



\## Fields



```text

id

name

description

source

obtained\_at

```



\## Example



```json

{

&#x20; "name": "Blue Backpack",

&#x20; "source": "Community Gift Vote"

}

```



\---



\# Journal Entry



Represents a daily journal post.



\## Fields



```text

id

date

title

content

related\_memories

related\_quest

```



\---



\# Quest



Represents an active event or challenge.



\## Fields



```text

id

title

description

category

options

status

result

```



\## Status



```text

pending

active

completed

failed

```



\---



\# Story Arc Progress



Represents lightweight continuity tracking for short follow-up encounter chains.



\## Fields



```text

last\_arc\_resolved\_count

recent\_arc\_keys

```



This exists to:



\* avoid repeating the same arc too quickly

\* keep story arcs feeling uncommon

\* support continuation encounters without a heavy quest-log system



\---



\# Vote



Represents a daily community vote.



\## Fields



```text

id

question

options

winner

total\_votes

created\_at

closed\_at

```



\---



\# Community Profile



Represents long-term community identity.



\## Fields



```text

community\_name

pettit\_name

created\_at

total\_votes

total\_memories

total\_journals

dominant\_traits

```



