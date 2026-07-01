import { redis } from '@devvit/web/server';
import type {
  ActiveEncounter,
  EncounterAffinity,
  PettitDailyCycle,
  PettitJournalEntry,
  PettitInventoryItem,
  PettitLandmark,
  PettitMemory,
  PettitNameSubmission,
  PettitState,
  PettitStats,
} from '../../shared/pettit';
import {
  canonicalizeEncounterTemplateId,
  createDefaultDailyCycle,
  createDefaultPettitState,
  createDefaultStats,
  createEncounterInstanceFromTemplate,
  getEncounterTemplateById,
} from './pettit-seed';
import { getGiftById, resolveInventoryGiftId } from './pettit-gifts';

type VoterMap = Record<string, string>;
type NamingSubmissionMap = Record<string, PettitNameSubmission[]>;

type LegacyState = PettitState & {
  activeQuestId?: string;
  activeEncounterId?: string;
  dailyCycle?: PettitDailyCycle;
};

type LegacyStats = PettitStats & {
  resolvedQuestCount?: number;
  resolvedEncounterCount?: number;
};

type LegacyActiveEncounter = ActiveEncounter & {
  category?: string;
  affinity?: EncounterAffinity;
};

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
    activeEncounter: `${prefix}:quest:active`,
    voters: `${prefix}:quest:voters`,
    memories: `${prefix}:memories`,
    journals: `${prefix}:journals`,
    stats: `${prefix}:stats`,
    namingSubmissions: `${prefix}:naming:submissions`,
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

const normalizeDailyCycle = (dailyCycle?: Partial<PettitDailyCycle>): PettitDailyCycle => {
  const fallback = createDefaultDailyCycle();

  if (!dailyCycle?.currentDayKey || !dailyCycle?.nextResolveAt || !dailyCycle?.lastProcessedDayKey) {
    return fallback;
  }

  return {
    currentDayKey: dailyCycle.currentDayKey,
    nextResolveAt: dailyCycle.nextResolveAt,
    lastProcessedDayKey: dailyCycle.lastProcessedDayKey,
  };
};

const normalizeLandmark = (landmark: PettitLandmark & { sourceQuestTemplateId?: string }): PettitLandmark => {
  return {
    ...landmark,
    sourceEncounterTemplateId: canonicalizeEncounterTemplateId(
      landmark.sourceEncounterTemplateId ?? landmark.sourceQuestTemplateId ?? 'encounter-cave'
    ),
  };
};

const normalizeInventoryItem = (item: Partial<PettitInventoryItem>, index: number): PettitInventoryItem | null => {
  const resolvedGiftId = resolveInventoryGiftId(item);

  if (!resolvedGiftId) {
    return null;
  }

  const gift = getGiftById(resolvedGiftId);

  return {
    id: item.id ?? `inventory-legacy-${index + 1}`,
    giftId: gift.id,
    name: item.name ?? gift.name,
    description: item.description ?? gift.description,
    category: item.category ?? gift.category,
    source: item.source ?? 'Community Gift Encounter',
    obtainedAt: item.obtainedAt ?? new Date().toISOString(),
    canonName: item.canonName,
  };
};

const normalizeState = (storedState: LegacyState): PettitState => {
  const activeEncounterId = storedState.activeEncounterId ?? storedState.activeQuestId ?? 'encounter-cave-1';

  return {
    ...storedState,
    ageDays: calculateAgeDays(storedState.createdAt),
    inventory: (storedState.inventory ?? [])
      .map((item, index) => normalizeInventoryItem(item as Partial<PettitInventoryItem>, index))
      .filter((item): item is PettitInventoryItem => item !== null),
    landmarks: (storedState.landmarks ?? []).map((landmark) =>
      normalizeLandmark(landmark as PettitLandmark & { sourceQuestTemplateId?: string })
    ),
    activeEncounterId: activeEncounterId.replace(/^quest-/, 'encounter-'),
    latestJournalId: storedState.latestJournalId ?? null,
    dailyCycle: normalizeDailyCycle(storedState.dailyCycle),
  };
};

const normalizeStats = (storedStats: LegacyStats): PettitStats => ({
  totalVotes: storedStats.totalVotes ?? 0,
  journalCount: storedStats.journalCount ?? 0,
  memoryCount: storedStats.memoryCount ?? 0,
  resolvedEncounterCount: storedStats.resolvedEncounterCount ?? storedStats.resolvedQuestCount ?? 0,
});

const normalizeActiveEncounter = (storedEncounter: LegacyActiveEncounter): ActiveEncounter => {
  const template = getEncounterTemplateById(storedEncounter.templateId);

  return {
    ...storedEncounter,
    templateId: template.id,
    title: storedEncounter.title ?? template.title,
    description: storedEncounter.description ?? template.description,
    affinity: storedEncounter.affinity ?? template.affinity,
    season: storedEncounter.season ?? template.season,
    isRare: storedEncounter.isRare ?? template.isRare,
    options:
      storedEncounter.options?.map((option) => ({
        id: option.id,
        label: option.label,
        votes: option.votes ?? 0,
      })) ?? template.options.map((option) => ({ id: option.id, label: option.label, votes: 0 })),
  };
};

export const createEncounterInstance = (templateId: string, sequenceNumber: number): ActiveEncounter => {
  const template = getEncounterTemplateById(templateId);
  return createEncounterInstanceFromTemplate(template, sequenceNumber);
};

export const getOrCreateState = async (subredditName: string): Promise<PettitState> => {
  const keys = buildPettitKeys(subredditName);
  const storedState = parseJson<LegacyState | null>(await redis.get(keys.state), null);

  if (storedState) {
    const refreshedState = normalizeState(storedState);
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

export const getOrCreateActiveEncounter = async (subredditName: string): Promise<ActiveEncounter> => {
  const keys = buildPettitKeys(subredditName);
  const storedEncounter = parseJson<LegacyActiveEncounter | null>(await redis.get(keys.activeEncounter), null);

  if (storedEncounter) {
    const normalizedEncounter = normalizeActiveEncounter(storedEncounter);
    await redis.set(keys.activeEncounter, JSON.stringify(normalizedEncounter));
    return normalizedEncounter;
  }

  const defaultEncounter = createEncounterInstance('encounter-cave', 1);
  await redis.set(keys.activeEncounter, JSON.stringify(defaultEncounter));
  return defaultEncounter;
};

export const saveActiveEncounter = async (subredditName: string, encounter: ActiveEncounter): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.activeEncounter, JSON.stringify(encounter));
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
  const storedStats = parseJson<LegacyStats | null>(await redis.get(keys.stats), null);

  if (storedStats) {
    const normalizedStats = normalizeStats(storedStats);
    await redis.set(keys.stats, JSON.stringify(normalizedStats));
    return normalizedStats;
  }

  const defaultStats = createDefaultStats();
  await redis.set(keys.stats, JSON.stringify(defaultStats));
  return defaultStats;
};

export const saveStats = async (subredditName: string, stats: PettitStats): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.stats, JSON.stringify(stats));
};

export const getNameSubmissions = async (subredditName: string): Promise<NamingSubmissionMap> => {
  const keys = buildPettitKeys(subredditName);
  return parseJson<NamingSubmissionMap>(await redis.get(keys.namingSubmissions), {});
};

export const saveNameSubmissions = async (
  subredditName: string,
  submissionMap: NamingSubmissionMap
): Promise<void> => {
  const keys = buildPettitKeys(subredditName);
  await redis.set(keys.namingSubmissions, JSON.stringify(submissionMap));
};
