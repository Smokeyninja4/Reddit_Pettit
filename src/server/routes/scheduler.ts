import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import type { TriggerResponse } from '@devvit/web/shared';
import { processScheduledDailyResolve } from '../core/pettit-loop';

export const scheduler = new Hono();

scheduler.post('/daily-resolve', async (c) => {
  const subredditName = context.subredditName;

  try {
    if (!subredditName) {
      return c.json<TriggerResponse>(
        {
          status: 'error',
          message: 'subredditName is required but missing from scheduler context',
        },
        400
      );
    }

    await processScheduledDailyResolve(subredditName);

    return c.json<TriggerResponse>({
      status: 'success',
      message: `Daily resolve processed for r/${subredditName}`,
    });
  } catch (error) {
    console.error('Scheduler daily resolve error:', error);

    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process daily resolve',
      },
      500
    );
  }
});
