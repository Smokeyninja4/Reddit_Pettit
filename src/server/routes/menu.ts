import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
import { getNameSubmissions, getOrCreateState } from '../core/pettit-store';
import { getPendingNamingTargetOptions } from '../core/pettit-naming';

export const menu = new Hono();

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

    const [state, submissions] = await Promise.all([
      getOrCreateState(subredditName),
      getNameSubmissions(subredditName),
    ]);

    const targetOptions = getPendingNamingTargetOptions(state, submissions);

    if (targetOptions.length === 0) {
      return c.json<UiResponse>(
        {
          showToast: 'Nothing is ready for naming yet. Resolve more quests or gifts first.',
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
