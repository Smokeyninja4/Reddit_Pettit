\# ModeratorTooling.md



\# Moderator Tooling



Moderator tooling exists to help a subreddit operate Pettit safely.



It is not part of the core player loop.



It is an operational layer around that loop.



\---



\# Current Problem



The current build still contains submission-era moderator checks tied to a personal Reddit username.



That is not the correct production model.



Pettit worlds belong to subreddits.



Moderator-only tools must therefore be usable by moderators of the current subreddit, not by one specific developer account.



\---



\# Goal



Replace personal-user gating with real subreddit-moderator authorization for all moderator-only operational tools.



\---



\# Rules



Moderator tooling should:



\* allow any moderator of the active subreddit to use moderator-only tools

\* enforce permissions server-side

\* keep normal community participation open to non-moderators

\* return clear "not allowed" responses when access is denied

\* avoid hidden developer exceptions in production paths



Moderator tooling should not:



\* rely only on menu visibility

\* trust the client to determine authorization

\* hardcode one Reddit username as an admin model

\* block ordinary players from voting, reading, naming, or gift submissions



\---



\# Scope For First Pass



This pass should cover authorization for the current operational tools:



\* Create post

\* Resolve current encounter

\* Reset Pettit world



Recommendation:



\* keep "create post" moderator-scoped as it already is

\* convert resolve/reset checks from personal username to subreddit moderator status

\* apply the same guard to any parallel API endpoint, not just the menu route



\---



\# Security Model



Authorization should be checked in one shared server helper.



That helper should:



\* read the current subreddit context

\* read the current Reddit user

\* verify the user is a moderator of that subreddit

\* return a consistent denial message when the user is not allowed



This avoids permission drift across routes.



\---



\# Operational Tiers



Moderator tools should be thought of in two tiers.



\## Safe Operational Tools



Examples:



\* manually resolve the current encounter

\* refresh or regenerate operational state

\* open moderator management views



\## Destructive Tools



Examples:



\* reset Pettit world

\* wipe state

\* clear submissions or memories



Destructive tools should be more explicit in copy and confirmation behavior.



\---



\# UX Rules



If a moderator-only action is denied, the message should be plain and specific.



Recommended copy:



\* Only moderators of this subreddit can use this tool.



Menu labels should describe the real role of the action.



Examples:



\* Reset Pettit World

\* Resolve Current Encounter



Avoid labels like "Dev Only" once the access model is no longer developer-specific.



\---



\# Out Of Scope



This pass should not introduce:



\* a full moderator dashboard

\* analytics tooling

\* moderation queues

\* audit logs

\* role hierarchies beyond subreddit moderator access



Those may come later if the operational surface grows.



\---



\# Validation



Confirm:



\* a subreddit moderator can use moderator-only tools

\* a non-moderator cannot use those same tools

\* community contribution flows remain available to ordinary users

\* server-side API routes are protected even if a client route is called directly
