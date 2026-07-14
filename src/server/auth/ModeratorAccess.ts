import { reddit } from '@devvit/web/server';

export const MODERATOR_ACCESS_DENIED = 'MODERATOR_ACCESS_DENIED';
export const MODERATOR_ACCESS_DENIED_MESSAGE = 'Only moderators of this subreddit can use this tool.';

export async function hasSubredditModeratorAccess(
  subredditName: string,
  username: string | null | undefined
): Promise<boolean> {
  if (!username) {
    return false;
  }

  const moderators = await reddit
    .getModerators({
      subredditName,
      username,
      limit: 1,
      pageSize: 1,
    })
    .all();

  return moderators.length > 0;
}

export async function requireSubredditModerator(subredditName: string): Promise<string> {
  const username = await reddit.getCurrentUsername();

  if (!(await hasSubredditModeratorAccess(subredditName, username))) {
    throw new Error(MODERATOR_ACCESS_DENIED);
  }

  return username!;
}
