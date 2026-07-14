import { reddit } from '@devvit/web/server';

export const MODERATOR_ACCESS_DENIED = 'MODERATOR_ACCESS_DENIED';
export const MODERATOR_ACCESS_DENIED_MESSAGE = 'Only moderators of this subreddit can use this tool.';

export async function requireSubredditModerator(subredditName: string): Promise<string> {
  const username = await reddit.getCurrentUsername();

  if (!username) {
    throw new Error(MODERATOR_ACCESS_DENIED);
  }

  const moderators = await reddit
    .getModerators({
      subredditName,
      username,
      limit: 1,
      pageSize: 1,
    })
    .all();

  if (moderators.length === 0) {
    throw new Error(MODERATOR_ACCESS_DENIED);
  }

  return username;
}
