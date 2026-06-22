import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type {
  ErrorResponse,
  GetPettitStateResponse,
  ResolveVoteResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
} from '../../shared/api';
import {
  getPettitViewModel,
  resolveVote,
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
    const state = await getPettitViewModel(subredditName, username ?? null);

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

    const state = await submitVote(subredditName, username, body.optionId);
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
          message: 'You have already voted on this quest',
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

    const username = await reddit.getCurrentUsername();
    const result = await resolveVote(subredditName, username ?? null);

    return c.json<ResolveVoteResponse>({
      type: 'vote-resolved',
      state: result.state,
      resolution: result.resolution,
    });
  } catch (error) {
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
