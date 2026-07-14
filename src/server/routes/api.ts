import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import {
  MODERATOR_ACCESS_DENIED,
  MODERATOR_ACCESS_DENIED_MESSAGE,
  hasSubredditModeratorAccess,
  requireSubredditModerator,
} from '../auth/ModeratorAccess';
import type {
  ErrorResponse,
  GetMemoriesResponse,
  GetPettitStateResponse,
  ResolveVoteResponse,
  SubmitNameRequest,
  SubmitNameResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
} from '../../shared/api';
import {
  getHallOfMemoriesDetail,
  getPettitViewModel,
  resolveVote,
  submitName,
  submitVote,
} from '../core/pettit-loop';

export const api = new Hono();

api.get('/state', async (c) => {
  const subredditName = context.subredditName;
  try {
    if (!subredditName) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'subredditName is required but missing from context',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();
    const isModerator = await hasSubredditModeratorAccess(subredditName, username ?? null);
    const state = await getPettitViewModel(subredditName, username ?? null, isModerator);

    return c.json<GetPettitStateResponse>({
      type: 'state',
      state,
    });
  } catch (error) {
    console.error('API State Error:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load Pettit state',
      },
      500
    );
  }
});

api.get('/memories', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'subredditName is required but missing from context',
        },
        400
      );
    }

    const hallOfMemories = await getHallOfMemoriesDetail(subredditName);

    return c.json<GetMemoriesResponse>({
      type: 'memories',
      hallOfMemories,
    });
  } catch (error) {
    console.error('API Memories Error:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load Hall of Memories',
      },
      500
    );
  }
});

api.post('/vote', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'subredditName is required but missing from context',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();
    const isModerator = await hasSubredditModeratorAccess(subredditName, username);

    if (!username) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'A Reddit username is required to vote',
        },
        400
      );
    }

    const body = await c.req.json<SubmitVoteRequest>();

    if (!body.optionId) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'optionId is required',
        },
        400
      );
    }

    const state = await submitVote(subredditName, username, body.optionId, isModerator);
    return c.json<SubmitVoteResponse>({
      type: 'vote-recorded',
      state,
    });
  } catch (error) {
    console.error('API Vote Error:', error);

    if (error instanceof Error && error.message === 'DUPLICATE_VOTE') {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'You have already voted on this encounter',
        },
        409
      );
    }

    if (error instanceof Error && error.message === 'INVALID_OPTION') {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'The selected option is no longer valid',
        },
        400
      );
    }

    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to record vote',
      },
      500
    );
  }
});

api.post('/name', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'subredditName is required but missing from context',
        },
        400
      );
    }

    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'A Reddit username is required to submit a name',
        },
        400
      );
    }

    const body = await c.req.json<SubmitNameRequest>();

    if (!body.targetKey || !body.proposedName) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'targetKey and proposedName are required',
        },
        400
      );
    }

    const result = await submitName(subredditName, username, body.targetKey, body.proposedName);

    return c.json<SubmitNameResponse>({
      type: 'name-submitted',
      pendingNamingTargets: result.pendingNamingTargets,
      message: result.message,
    });
  } catch (error) {
    console.error('API Name Error:', error);

    if (
      error instanceof Error &&
      ['INVALID_NAMING_TARGET', 'INVALID_NAME', 'NAME_TOO_LONG'].includes(error.message)
    ) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message:
            error.message === 'NAME_TOO_LONG'
              ? 'Names must be 32 characters or fewer'
              : 'That naming target is not available right now',
        },
        400
      );
    }

    if (error instanceof Error && error.message === 'DUPLICATE_NAME_SUBMISSION') {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'You have already submitted a name for this target',
        },
        409
      );
    }

    if (error instanceof Error && error.message === 'DUPLICATE_NAME') {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'That name has already been submitted for this target',
        },
        409
      );
    }

    if (error instanceof Error && error.message === 'NAME_BALLOT_FULL') {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'That naming ballot is already full',
        },
        409
      );
    }

    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit name',
      },
      500
    );
  }
});

api.post('/resolve', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'subredditName is required but missing from context',
        },
        400
      );
    }

    await requireSubredditModerator(subredditName);
    const result = await resolveVote(subredditName, true);

    return c.json<ResolveVoteResponse>({
      type: 'vote-resolved',
      state: result.state,
      outcome: result.outcome,
      resolution: result.resolution,
      traitFeedback: result.traitFeedback,
      unlockedAchievements: result.unlockedAchievements,
    });
  } catch (error) {
    if (error instanceof Error && error.message === MODERATOR_ACCESS_DENIED) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: MODERATOR_ACCESS_DENIED_MESSAGE,
        },
        403
      );
    }

    console.error('API Resolve Error:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to resolve vote',
      },
      500
    );
  }
});
