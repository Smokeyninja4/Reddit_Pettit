import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
import { createPost } from '../core/post';
import {
  getGiftIdeaSubmissions,
  getNameSubmissions,
  getOrCreateState,
  getOrCreateStats,
  resetPettitWorld,
} from '../core/pettit-store';
import { buildPendingCommunityGiftBallot } from '../core/pettit-contributions';
import { getPendingNamingTargetOptions } from '../core/pettit-naming';
import { resolveVote } from '../core/pettit-loop';

export const menu = new Hono();

const DEV_SUBMISSION_USERNAME = 'Smokeyninja04';

const isDevSubmissionUser = (username: string | null | undefined): boolean =>
  username?.trim().toLowerCase() === DEV_SUBMISSION_USERNAME.toLowerCase();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});

menu.post('/name-form', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<UiResponse>(
        {
          showToast: 'No subreddit context was available',
        },
        400
      );
    }

    const [state, stats, submissions] = await Promise.all([
      getOrCreateState(subredditName),
      getOrCreateStats(subredditName),
      getNameSubmissions(subredditName),
    ]);

    const targetOptions = getPendingNamingTargetOptions(state, submissions, stats.resolvedEncounterCount);

    if (targetOptions.length === 0) {
      return c.json<UiResponse>(
        {
          showToast: 'Nothing is ready for naming yet. Resolve more encounters or gifts first.',
        },
        200
      );
    }

    return c.json<UiResponse>(
      {
        showForm: {
          name: 'submitNameForm',
          form: {
            title: 'Submit a Community Name',
            description: "Help turn one of Pettit's keepsakes or places into canon.",
            acceptLabel: 'Submit Name',
            fields: [
              {
                type: 'select',
                name: 'targetKey',
                label: 'What should be named?',
                required: true,
                options: targetOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                })),
                defaultValue: targetOptions[0] ? [targetOptions[0].value] : [],
                multiSelect: false,
              },
              {
                type: 'string',
                name: 'proposedName',
                label: 'Proposed name',
                required: true,
                helpText: 'Keep it short and memorable. 32 characters max.',
              },
            ],
          },
          data: {
            targetKey: targetOptions[0] ? [targetOptions[0].value] : [],
            proposedName: '',
          },
        },
      },
      200
    );
  } catch (error) {
    console.error(`Error opening name form: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to open the naming form',
      },
      400
    );
  }
});

menu.post('/gift-form', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<UiResponse>(
        {
          showToast: 'No subreddit context was available',
        },
        400
      );
    }

    const submissions = await getGiftIdeaSubmissions(subredditName);
    const pendingBallot = buildPendingCommunityGiftBallot(submissions);

    if (pendingBallot?.isReady) {
      return c.json<UiResponse>(
        {
          showToast: 'A community gift ballot is already ready. Resolve it first so new ideas can come in.',
        },
        200
      );
    }

    return c.json<UiResponse>(
      {
        showForm: {
          name: 'submitGiftIdeaForm',
          form: {
            title: 'Submit a Community Gift',
            description:
              pendingBallot && pendingBallot.submissionCount > 0
                ? `There are already ${pendingBallot.submissionCount}/3 gift ideas waiting.`
                : "Help the community dream up Pettit's next keepsake.",
            acceptLabel: 'Submit Gift Idea',
            fields: [
              {
                type: 'string',
                name: 'giftName',
                label: 'Gift name',
                required: true,
                helpText: 'Keep it short and memorable. 32 characters max.',
              },
              {
                type: 'select',
                name: 'giftCategory',
                label: 'Gift category',
                required: true,
                options: [
                  { label: 'Books', value: 'books' },
                  { label: 'Clothing', value: 'clothing' },
                  { label: 'Tools', value: 'tools' },
                  { label: 'Toys', value: 'toys' },
                  { label: 'Community', value: 'community' },
                  { label: 'Funny', value: 'funny' },
                ],
                defaultValue: ['community'],
                multiSelect: false,
              },
              {
                type: 'string',
                name: 'giftDescription',
                label: 'Short description',
                required: true,
                helpText: 'Describe the keepsake in one wholesome sentence. 120 characters max.',
              },
            ],
          },
          data: {
            giftName: '',
            giftCategory: ['community'],
            giftDescription: '',
          },
        },
      },
      200
    );
  } catch (error) {
    console.error(`Error opening gift form: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to open the community gift form',
      },
      400
    );
  }
});

menu.post('/reset-world', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<UiResponse>(
        {
          showToast: 'No subreddit context was available',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();

    // TODO: Remove this submission-testing helper before a real public launch.
    if (!isDevSubmissionUser(username)) {
      return c.json<UiResponse>(
        {
          showToast: 'That reset tool is reserved for submission playtesting.',
        },
        403
      );
    }

    await resetPettitWorld(subredditName);

    return c.json<UiResponse>(
      {
        showToast: {
          text: 'Pettit was reset for this subreddit. Refresh the post to start from a fresh world.',
          appearance: 'success',
        },
      },
      200
    );
  } catch (error) {
    console.error(`Error resetting Pettit world: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to reset Pettit for this subreddit',
      },
      400
    );
  }
});

menu.post('/resolve-encounter', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<UiResponse>(
        {
          showToast: 'No subreddit context was available',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();

    // TODO: Remove this submission-testing helper before a real public launch.
    if (!isDevSubmissionUser(username)) {
      return c.json<UiResponse>(
        {
          showToast: 'That resolve tool is reserved for submission playtesting.',
        },
        403
      );
    }

    const result = await resolveVote(subredditName, username ?? null);

    return c.json<UiResponse>(
      {
        showToast: {
          text:
            result.outcome === 'advanced'
              ? 'No votes came in, so Pettit moved on to a fresh encounter. Refresh the post to see it.'
              : 'Pettit resolved the current encounter. Refresh the post to see the next story.',
          appearance: 'success',
        },
      },
      200
    );
  } catch (error) {
    console.error(`Error resolving current encounter: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to resolve the current encounter',
      },
      400
    );
  }
});
