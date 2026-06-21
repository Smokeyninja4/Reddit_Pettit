\# RedisStorage.md



\# Storage Design



Pettit stores all persistent information using Redis.



\---



\# Core Keys



\## Pettit State



```text

pettit:state

```



Stores:



\* Traits

\* Mood

\* Age

\* Inventory



\---



\## Memories



```text

pettit:memories

```



Stores:



\* Memory records

\* Categories

\* Importance



\---



\## Journal Entries



```text

pettit:journals

```



Stores:



\* Historical journals



\---



\## Active Quest



```text

pettit:quest

```



Stores:



\* Current quest

\* Available choices



\---



\## Votes



```text

pettit:votes

```



Stores:



\* Daily votes

\* Results



\---



\## Statistics



```text

pettit:stats

```



Stores:



\* Vote totals

\* Journal count

\* Memory count

\* Community milestones



\---



\# Design Rule



Everything should be serializable to JSON.



Complexity belongs in logic, not storage.



