import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
import { submitGiftIdea, submitName } from '../core/pettit-loop';
import type { GiftCategory } from '../../shared/pettit';

type NameFormValues = {
  targetKey?: string | string[];
  proposedName?: string;
};

type GiftIdeaFormValues = {
  giftName?: string;
  giftDescription?: string;
  giftCategory?: GiftCategory | GiftCategory[];
};

export const forms = new Hono();

forms.post('/name-submit', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<UiResponse>(
        {
          showToast: 'This form requires subreddit context',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<UiResponse>(
        {
          showToast: 'You need a Reddit username to submit a name',
        },
        400
      );
    }

    const { targetKey, proposedName } = await c.req.json<NameFormValues>();
    const selectedTargetKey = Array.isArray(targetKey) ? targetKey[0] ?? '' : targetKey ?? '';
    const result = await submitName(subredditName, username, selectedTargetKey, proposedName ?? '');

    return c.json<UiResponse>(
      {
        showToast: {
          text: result.message,
          appearance: 'success',
        },
      },
      200
    );
  } catch (error) {
    console.error('Name submit form error:', error);

    const message =
      error instanceof Error && error.message === 'DUPLICATE_NAME_SUBMISSION'
        ? 'You already submitted a name for that target'
        : error instanceof Error && error.message === 'DUPLICATE_NAME'
          ? 'That name is already on the ballot'
          : error instanceof Error && error.message === 'NAME_TOO_LONG'
            ? 'Names must be 32 characters or fewer'
            : error instanceof Error && error.message === 'NAME_BALLOT_FULL'
              ? 'That naming ballot is already full'
              : 'Unable to submit that name right now';

    return c.json<UiResponse>(
      {
        showToast: message,
      },
      400
    );
  }
});

forms.post('/gift-submit', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<UiResponse>(
        {
          showToast: 'This form requires subreddit context',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<UiResponse>(
        {
          showToast: 'You need a Reddit username to submit a gift idea',
        },
        400
      );
    }

    const { giftName, giftDescription, giftCategory } = await c.req.json<GiftIdeaFormValues>();
    const selectedCategory = Array.isArray(giftCategory) ? giftCategory[0] : giftCategory;

    if (
      selectedCategory !== 'books' &&
      selectedCategory !== 'clothing' &&
      selectedCategory !== 'tools' &&
      selectedCategory !== 'toys' &&
      selectedCategory !== 'community' &&
      selectedCategory !== 'funny'
    ) {
      throw new Error('INVALID_GIFT_CATEGORY');
    }

    const result = await submitGiftIdea(
      subredditName,
      username,
      giftName ?? '',
      giftDescription ?? '',
      selectedCategory
    );

    return c.json<UiResponse>(
      {
        showToast: {
          text: result.message,
          appearance: 'success',
        },
      },
      200
    );
  } catch (error) {
    console.error('Gift submit form error:', error);

    const message =
      error instanceof Error && error.message === 'DUPLICATE_GIFT_SUBMISSION'
        ? 'You already submitted a gift idea for this ballot'
        : error instanceof Error && error.message === 'DUPLICATE_GIFT_NAME'
          ? 'That gift idea is already on the ballot'
          : error instanceof Error && error.message === 'KNOWN_GIFT_NAME'
            ? 'That gift already exists in Pettit’s world'
            : error instanceof Error && error.message === 'GIFT_NAME_TOO_LONG'
              ? 'Gift names must be 32 characters or fewer'
              : error instanceof Error && error.message === 'GIFT_DESCRIPTION_TOO_LONG'
                ? 'Gift descriptions must be 120 characters or fewer'
                : error instanceof Error && error.message === 'GIFT_BALLOT_FULL'
                  ? 'That community gift ballot is already full'
                  : 'Unable to submit that gift idea right now';

    return c.json<UiResponse>(
      {
        showToast: message,
      },
      400
    );
  }
});
