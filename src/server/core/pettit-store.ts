import { redis } from '@devvit/web/server';
import type {
  ActiveQuest,
  PettitJournalEntry,
  PettitMemory,
  PettitState,
  PettitStats,
} from '../../shared/pettit';
import { createDefaultPettitState, createDefaultStats, getQuestTemplateById } from './pettit-seed';

type VoterMap = Record<string, string>;

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const buildKeyPrefix = (subredditName: string): string => `pettit:${subredditName}`;

export const buildPettitKeys = (subredditName: string) => {
  const prefix = buildKeyPrefix(subredditName);
  return {
    state: `${prefix}:state`,
    activeQuest: `${prefix}:quest:active`,
    voters: `${prefix}:quest:voters`,
    memories: `${prefix}:memories`,
    journals: `${prefix}:journals`,
    stats: `${prefix}:stats`,
  };
};

const calculateAgeDays = (createdAt: string): number => {
  const createdTime = Date.parse(createdAt);

  if (Number.isNaN(createdTime)) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((Date.now() - createdTime) / millisecondsPerDay));
};

export const createQuestInstance = (templateId: string, sequenceNumber: number): ActiveQuest => {
  const template = getQuestTemplateById(templateId);

  return {
    id: `${template.id}-${sequenceNumber}`,
    templateId: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    createdAt: new Date().toISOString(),
    options: template.options.map((option) => ({
      id: option.id,
      label: option.label,
      votes: 0,
    })),
  };
};

export const getOrCreateState = async (subredditName: string): Promise<PettitState> => {
  const keys = buildPettitKeys(subredditName);
  const storedState = parseJson<PettitState | null>(await redis.get(keys.state), null);

  if (storedState) {
    const refreshedState: PettitState = {
      ...storedState,
      ageDays: calculateAgeDays(storedState.createdAt),
    };

    await redis.set(keys.state, JSON.stringify(refreshedState));
    return refreshedState;
  }

  const defaultState = createDefaultPettitState(subredditName);
  await redis.set(keys.state, JSON.stringify(defaultState));
  return defaultState;
};

export const saveState = async (subredditName: string, state: PettitState): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.state, JSON.stringify(state));
};

export const getOrCreateActiveQuest = async (subredditName: string): Promise<ActiveQuest> => {
  const keys = buildPettitKeys(subredditName);
  const storedQuest = parseJson<ActiveQuest | null>(await redis.get(keys.activeQuest), null);

  if (storedQuest) {
    return storedQuest;
  }

  const defaultQuest = createQuestInstance('quest-cave', 1);
  await redis.set(keys.activeQuest, JSON.stringify(defaultQuest));
  return defaultQuest;
};

export const saveActiveQuest = async (subredditName: string, quest: ActiveQuest): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.activeQuest, JSON.stringify(quest));
};

export const getVoterMap = async (subredditName: string): Promise<VoterMap> => {
  const keys = buildPettitKeys(subredditName);
  return parseJson<VoterMap>(await redis.get(keys.voters), {});
};

export const saveVoterMap = async (subredditName: string, voterMap: VoterMap): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.voters, JSON.stringify(voterMap));
};

export const resetVoterMap = async (subredditName: string): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.voters, JSON.stringify({}));
};

export const getMemories = async (subredditName: string): Promise<PettitMemory[]> => {
  const keys = buildPettitKeys(subredditName);
  return parseJson<PettitMemory[]>(await redis.get(keys.memories), []);
};

export const appendMemory = async (subredditName: string, memory: PettitMemory): Promise<PettitMemory[]> => {
  const keys = buildPettitKeys(subredditName);
  const memories = parseJson<PettitMemory[]>(await redis.get(keys.memories), []);
  const nextMemories = [...memories, memory];
  await redis.set(keys.memories, JSON.stringify(nextMemories));
  return nextMemories;
};

export const getJournals = async (subredditName: string): Promise<PettitJournalEntry[]> => {
  const keys = buildPettitKeys(subredditName);
  return parseJson<PettitJournalEntry[]>(await redis.get(keys.journals), []);
};

export const appendJournal = async (
  subredditName: string,
  journal: PettitJournalEntry
): Promise<PettitJournalEntry[]> => {
  const keys = buildPettitKeys(subredditName);
  const journals = parseJson<PettitJournalEntry[]>(await redis.get(keys.journals), []);
  const nextJournals = [...journals, journal];
  await redis.set(keys.journals, JSON.stringify(nextJournals));
  return nextJournals;
};

export const getOrCreateStats = async (subredditName: string): Promise<PettitStats> => {
  const keys = buildPettitKeys(subredditName);
  const storedStats = parseJson<PettitStats | null>(await redis.get(keys.stats), null);

  if (storedStats) {
    return storedStats;
  }

  const defaultStats = createDefaultStats();
  await redis.set(keys.stats, JSON.stringify(defaultStats));
  return defaultStats;
};

export const saveStats = async (subredditName: string, stats: PettitStats): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.stats, JSON.stringify(stats));
};
