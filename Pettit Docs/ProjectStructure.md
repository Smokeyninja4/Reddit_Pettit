\# ProjectStructure.md



\# Recommended Project Structure



```text

/src



&#x20; /components



&#x20;   PettitCard.tsx

&#x20;   VoteCard.tsx

&#x20;   QuestCard.tsx

&#x20;   JournalCard.tsx

&#x20;   MemoryCard.tsx



&#x20; /models



&#x20;   Pettit.ts

&#x20;   Trait.ts

&#x20;   Memory.ts

&#x20;   Quest.ts

&#x20;   Vote.ts



&#x20; /services



&#x20;   VoteService.ts

&#x20;   TraitService.ts

&#x20;   MemoryService.ts

&#x20;   JournalService.ts

&#x20;   QuestService.ts



&#x20; /storage



&#x20;   RedisStorage.ts



&#x20; /events



&#x20;   EventGenerator.ts



&#x20; /data



&#x20;   QuestTemplates.ts

&#x20;   EventTemplates.ts

&#x20;   MemoryTemplates.ts



&#x20; /utils



&#x20;   Random.ts

&#x20;   DateUtils.ts

&#x20;   TraitUtils.ts



&#x20; /auth

&#x20;   ModeratorAccess.ts

```



\---



\# Responsibility Rules



Components



Display data.



\---



Services



Contain logic.



\---



Models



Represent state.



\---



Storage



Persistence only.



\---



Templates



Static content.



\---



\# Design Rule



One responsibility per file.



Avoid giant files.



