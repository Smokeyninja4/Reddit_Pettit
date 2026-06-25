import type {
  ActiveEncounter,
  EncounterOption,
  EncounterOptionOutcome,
  EncounterTemplate,
  PendingNamingTarget,
  PettitInventoryItem,
  PettitJournalEntry,
  PettitMemory,
  PettitNameSubmission,
  PettitState,
  PettitStats,
  PettitTraits,
  PettitViewModel,
  TraitKey,
} from '../../shared/pettit';
import { getGiftById, buildGiftEncounterTemplate, selectGiftEncounterIds } from './pettit-gifts';
import { createJournalEntry } from './pettit-journal';
import {
  applyCanonName,
  clearNamingTargetSubmissions,
  discoverLandmark,
  getCanonNames,
  getPendingNamingTargets,
  personalizeEncounterText,
  selectReadyNamingEncounterTemplate,
  submitNameForTarget,
} from './pettit-naming';
import {
  canonicalizeEncounterTemplateId,
  createEncounterInstanceFromTemplate,
  getEncounterTemplateById,
  getRareEncounterTemplates,
  getSeasonalEncounterTemplates,
  getStandardEncounterTemplates,
  getTopTraits,
} from './pettit-seed';
import {
  appendJournal,
  appendMemory,
  getJournals,
  getMemories,
  getNameSubmissions,
  getOrCreateActiveEncounter,
  getOrCreateState,
  getOrCreateStats,
  getVoterMap,
  resetVoterMap,
  saveActiveEncounter,
  saveNameSubmissions,
  saveState,
  saveStats,
  saveVoterMap,
} from './pettit-store';

type WorldSnapshot = {
  state: PettitState;
  stats: PettitStats;
  activeEncounter: ActiveEncounter;
  memories: PettitMemory[];
  journals: PettitJournalEntry[];
  selectedOptionId: string | null;
  pendingNamingTargets: PendingNamingTarget[];
};

type ResolveResult = {
  state: PettitViewModel;
  resolution: {
    winningOptionId: string;
    memoryId: string;
    journalId: string;
  };
  traitFeedback: {
    appliedChanges: Array<{
      trait: TraitKey;
      before: number;
      after: number;
      delta: number;
    }>;
    topTraits: TraitKey[];
    summary: string;
  };
};

type AppliedTraitChange = {
  trait: TraitKey;
  before: number;
  after: number;
  delta: number;
};

const clampTraitValue = (value: number): number => Math.max(0, Math.min(100, value));

const applyTraitEffects = (
  currentTraits: PettitTraits,
  traitEffects: Partial<Record<TraitKey, number>>
): { nextTraits: PettitTraits; appliedChanges: AppliedTraitChange[] } => {
  const nextTraits: PettitTraits = { ...currentTraits };
  const appliedChanges: AppliedTraitChange[] = [];

  for (const [traitKey, delta] of Object.entries(traitEffects) as [TraitKey, number][]) {
    const currentValue = nextTraits[traitKey];
    const dampener = currentValue >= 80 ? 0.5 : currentValue >= 60 ? 0.75 : 1;
    const adjustedDelta = delta * dampener;
    const nextValue = clampTraitValue(Math.round(currentValue + adjustedDelta));
    nextTraits[traitKey] = nextValue;

    if (nextValue !== currentValue) {
      appliedChanges.push({
        trait: traitKey,
        before: currentValue,
        after: nextValue,
        delta: nextValue - currentValue,
      });
    }
  }

  appliedChanges.sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));

  return { nextTraits, appliedChanges };
};

const joinTraitLabels = (traits: TraitKey[]): string => {
  const labels = traits.map((trait) => trait.charAt(0).toUpperCase() + trait.slice(1).toLowerCase());

  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0] ?? '';
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  const leading = labels.slice(0, -1).join(', ');
  const trailing = labels[labels.length - 1] ?? '';
  return `${leading}, and ${trailing}`;
};

const createTraitFeedbackSummary = (
  appliedChanges: AppliedTraitChange[],
  topTraits: TraitKey[]
): string => {
  if (appliedChanges.length === 0) {
    return 'Pettit stayed much the same this time.';
  }

  const increasedTraits = appliedChanges.filter((change) => change.delta > 0).map((change) => change.trait);

  if (increasedTraits.length > 0) {
    return `Pettit grew more ${joinTraitLabels(increasedTraits).toLowerCase()}.`;
  }

  return `Pettit shifted toward ${joinTraitLabels(topTraits).toLowerCase()}.`;
};

const createMemoryRecord = (
  outcome: EncounterOptionOutcome,
  sequenceNumber: number
): PettitMemory => ({
  id: `memory-${sequenceNumber}`,
  timestamp: new Date().toISOString(),
  title: outcome.memoryTitle,
  description: outcome.memoryDescription,
  type: outcome.memoryType,
  importance: outcome.importance,
});

const selectWinningOption = (encounter: ActiveEncounter): EncounterOption => {
  const template = getEncounterTemplateById(encounter.templateId);
  let winningOption: EncounterOption | null = null;

  for (const templateOption of template.options) {
    const activeOption = encounter.options.find((option) => option.id === templateOption.id);

    if (!activeOption) {
      continue;
    }

    if (!winningOption || activeOption.votes > winningOption.votes) {
      winningOption = activeOption;
    }
  }

  if (!winningOption) {
    throw new Error('Active encounter has no vote options');
  }

  return winningOption;
};

const getOutcomeForOption = (template: EncounterTemplate, optionId: string): EncounterOptionOutcome => {
  const outcome = template.outcomes.find((candidate) => candidate.optionId === optionId);

  if (!outcome) {
    throw new Error(`Missing outcome for option ${optionId}`);
  }

  return outcome;
};

const buildViewModel = (snapshot: WorldSnapshot): PettitViewModel => {
  const latestJournal = snapshot.journals.length > 0 ? snapshot.journals[snapshot.journals.length - 1] ?? null : null;
  const recentMemories = snapshot.memories.slice(-3).reverse();
  const totalVotes = snapshot.activeEncounter.options.reduce((sum, option) => sum + option.votes, 0);

  return {
    pettit: {
      name: snapshot.state.name,
      ageDays: snapshot.state.ageDays,
      mood: snapshot.state.mood,
      traits: snapshot.state.traits,
      topTraits: getTopTraits(snapshot.state.traits, 2),
    },
    communityStats: {
      ageDays: snapshot.state.ageDays,
      totalVotes: snapshot.stats.totalVotes,
      encountersCompleted: snapshot.stats.resolvedEncounterCount,
      memoriesCreated: snapshot.stats.memoryCount,
    },
    inventory: snapshot.state.inventory,
    knownNames: getCanonNames(snapshot.state),
    pendingNamingTargets: snapshot.pendingNamingTargets,
    activeEncounter: {
      ...snapshot.activeEncounter,
      totalVotes,
      hasVoted: snapshot.selectedOptionId !== null,
      selectedOptionId: snapshot.selectedOptionId,
    },
    latestJournal,
    recentMemories,
  };
};

const loadWorldSnapshot = async (subredditName: string, username: string | null): Promise<WorldSnapshot> => {
  const [state, stats, activeEncounter, memories, journals, voterMap, nameSubmissions] = await Promise.all([
    getOrCreateState(subredditName),
    getOrCreateStats(subredditName),
    getOrCreateActiveEncounter(subredditName),
    getMemories(subredditName),
    getJournals(subredditName),
    getVoterMap(subredditName),
    getNameSubmissions(subredditName),
  ]);

  return {
    state,
    stats,
    activeEncounter,
    memories,
    journals,
    selectedOptionId: username ? voterMap[username] ?? null : null,
    pendingNamingTargets: getPendingNamingTargets(state, nameSubmissions),
  };
};

const createInventoryItem = (
  inventory: PettitInventoryItem[],
  giftId: string
): PettitInventoryItem => {
  const gift = getGiftById(giftId);
  const existingCanonName = inventory.find((item) => item.giftId === giftId && item.canonName)?.canonName;

  return {
    id: `inventory-${inventory.length + 1}`,
    giftId,
    name: gift.name,
    description: gift.description,
    category: gift.category,
    source: 'Community Gift Encounter',
    obtainedAt: new Date().toISOString(),
    canonName: existingCanonName,
  };
};

const isRareEncounterTurn = (resolvedEncounterCount: number): boolean => {
  return resolvedEncounterCount > 0 && resolvedEncounterCount % 20 === 0;
};

const buildWeightedPool = (
  candidates: readonly EncounterTemplate[],
  state: PettitState,
  currentTemplateId: string
): EncounterTemplate[] => {
  const topTraits = getTopTraits(state.traits, 2);
  const currentTemplate = getEncounterTemplateById(currentTemplateId);

  return candidates.flatMap((template) => {
    const isCurrentAffinity = template.affinity === currentTemplate.affinity;
    let weight =
      template.affinity === topTraits[0]
        ? 7
        : template.affinity === topTraits[1]
          ? 5
          : template.affinity === 'seasonal'
            ? 3
            : 2;

    if (isCurrentAffinity) {
      weight = Math.max(1, weight - 2);
    }

    return Array.from({ length: weight }, () => template);
  });
};

const pickWeightedEncounter = (
  candidates: readonly EncounterTemplate[],
  state: PettitState,
  resolvedEncounterCount: number,
  currentTemplateId: string
): EncounterTemplate => {
  const canonicalCurrentId = canonicalizeEncounterTemplateId(currentTemplateId);
  const filteredCandidates = candidates.filter((template) => template.id !== canonicalCurrentId);
  const safeCandidates = filteredCandidates.length > 0 ? filteredCandidates : [...candidates];
  const weightedPool = buildWeightedPool(safeCandidates, state, currentTemplateId);

  if (weightedPool.length === 0) {
    throw new Error('Encounter library is empty');
  }

  const traitSeed = Object.values(state.traits).reduce((sum, value) => sum + value, 0);
  const seed = traitSeed + resolvedEncounterCount * 7 + state.ageDays * 3;
  return weightedPool[seed % weightedPool.length] ?? weightedPool[0]!;
};

const selectNextEncounterTemplate = (
  state: PettitState,
  resolvedEncounterCount: number,
  nameSubmissions: Record<string, PettitNameSubmission[]>,
  currentTemplateId: string
): EncounterTemplate => {
  const namingEncounterTemplate = selectReadyNamingEncounterTemplate(state, nameSubmissions);

  if (namingEncounterTemplate) {
    return namingEncounterTemplate;
  }

  if (resolvedEncounterCount > 0 && resolvedEncounterCount % 3 === 0) {
    const giftIds = selectGiftEncounterIds(state.inventory, 3);
    return buildGiftEncounterTemplate(giftIds);
  }

  if (isRareEncounterTurn(resolvedEncounterCount)) {
    return pickWeightedEncounter(getRareEncounterTemplates(), state, resolvedEncounterCount, currentTemplateId);
  }

  const standardCandidates = [
    ...getStandardEncounterTemplates(),
    ...getSeasonalEncounterTemplates(),
  ];

  return pickWeightedEncounter(standardCandidates, state, resolvedEncounterCount, currentTemplateId);
};

export const getPettitViewModel = async (
  subredditName: string,
  username: string | null
): Promise<PettitViewModel> => {
  const snapshot = await loadWorldSnapshot(subredditName, username);
  return buildViewModel(snapshot);
};

export const submitVote = async (
  subredditName: string,
  username: string,
  optionId: string
): Promise<PettitViewModel> => {
  const [activeEncounter, voterMap, stats, state, memories, journals, nameSubmissions] = await Promise.all([
    getOrCreateActiveEncounter(subredditName),
    getVoterMap(subredditName),
    getOrCreateStats(subredditName),
    getOrCreateState(subredditName),
    getMemories(subredditName),
    getJournals(subredditName),
    getNameSubmissions(subredditName),
  ]);

  if (voterMap[username]) {
    throw new Error('DUPLICATE_VOTE');
  }

  const nextOptions = activeEncounter.options.map((option) =>
    option.id === optionId ? { ...option, votes: option.votes + 1 } : option
  );
  const optionExists = nextOptions.some((option) => option.id === optionId);

  if (!optionExists) {
    throw new Error('INVALID_OPTION');
  }

  const nextEncounter: ActiveEncounter = {
    ...activeEncounter,
    options: nextOptions,
  };
  const nextVoterMap = {
    ...voterMap,
    [username]: optionId,
  };
  const nextStats: PettitStats = {
    ...stats,
    totalVotes: stats.totalVotes + 1,
  };

  await Promise.all([
    saveActiveEncounter(subredditName, nextEncounter),
    saveVoterMap(subredditName, nextVoterMap),
    saveStats(subredditName, nextStats),
  ]);

  return buildViewModel({
    state,
    stats: nextStats,
    activeEncounter: nextEncounter,
    memories,
    journals,
    selectedOptionId: optionId,
    pendingNamingTargets: getPendingNamingTargets(state, nameSubmissions),
  });
};

export const submitName = async (
  subredditName: string,
  username: string,
  targetKey: string,
  proposedName: string
): Promise<{ pendingNamingTargets: PendingNamingTarget[]; message: string }> => {
  const [state, submissionMap] = await Promise.all([
    getOrCreateState(subredditName),
    getNameSubmissions(subredditName),
  ]);

  const nextSubmissionMap = submitNameForTarget(state, submissionMap, username, targetKey, proposedName);
  await saveNameSubmissions(subredditName, nextSubmissionMap);

  const { targetType, targetId } = (() => {
    const [targetTypeValue, ...targetIdParts] = targetKey.split(':');

    if ((targetTypeValue !== 'gift' && targetTypeValue !== 'landmark') || targetIdParts.length === 0) {
      throw new Error('INVALID_NAMING_TARGET');
    }

    return {
      targetType: targetTypeValue,
      targetId: targetIdParts.join(':'),
    };
  })();

  const pendingTargets = getPendingNamingTargets(state, nextSubmissionMap);
  const target = pendingTargets.find(
    (candidate) => candidate.targetType === targetType && candidate.targetId === targetId
  );

  return {
    pendingNamingTargets: pendingTargets,
    message:
      target && target.submissionCount >= 3
        ? `${target.baseName} is ready for an encounter vote.`
        : 'Name submitted. The community is one step closer to making it canon.',
  };
};

export const resolveVote = async (subredditName: string, username: string | null): Promise<ResolveResult> => {
  const [state, activeEncounter, memories, stats, nameSubmissions] = await Promise.all([
    getOrCreateState(subredditName),
    getOrCreateActiveEncounter(subredditName),
    getMemories(subredditName),
    getOrCreateStats(subredditName),
    getNameSubmissions(subredditName),
  ]);

  const winningOption = selectWinningOption(activeEncounter);
  const template = getEncounterTemplateById(activeEncounter.templateId);
  const outcome = getOutcomeForOption(template, winningOption.id);
  const { nextTraits, appliedChanges } = applyTraitEffects(state.traits, outcome.traitEffects);
  const topTraits = getTopTraits(nextTraits, 2);
  const nextStats: PettitStats = {
    ...stats,
    resolvedEncounterCount: stats.resolvedEncounterCount + 1,
    memoryCount: stats.memoryCount + 1,
    journalCount: stats.journalCount + 1,
  };
  const nextInventory =
    outcome.awardedGiftId ? [...state.inventory, createInventoryItem(state.inventory, outcome.awardedGiftId)] : state.inventory;
  let nextStateBeforeJournal: PettitState = {
    ...state,
    mood: outcome.mood,
    traits: nextTraits,
    inventory: nextInventory,
    landmarks: state.landmarks,
    ageDays: state.ageDays,
  };
  nextStateBeforeJournal = discoverLandmark(nextStateBeforeJournal, outcome.discoveredLandmarkId);

  let nextNameSubmissions = nameSubmissions;

  if (outcome.namingTarget) {
    nextStateBeforeJournal = applyCanonName(
      nextStateBeforeJournal,
      outcome.namingTarget.type,
      outcome.namingTarget.targetId,
      outcome.namingTarget.canonName
    );
    nextNameSubmissions = clearNamingTargetSubmissions(
      nextNameSubmissions,
      outcome.namingTarget.type,
      outcome.namingTarget.targetId
    );
  }

  const personalizedOutcome: EncounterOptionOutcome = {
    ...outcome,
    resultText: personalizeEncounterText(nextStateBeforeJournal, activeEncounter.templateId, outcome.resultText),
    memoryDescription: personalizeEncounterText(nextStateBeforeJournal, activeEncounter.templateId, outcome.memoryDescription),
  };
  const memory = createMemoryRecord(personalizedOutcome, nextStats.memoryCount);
  const previousMemory = memories.length > 0 ? memories[memories.length - 1] ?? null : null;
  const journal = createJournalEntry(
    nextStateBeforeJournal,
    activeEncounter,
    personalizedOutcome,
    memory,
    previousMemory,
    nextStats.journalCount
  );
  const nextEncounterTemplate = selectNextEncounterTemplate(
    nextStateBeforeJournal,
    nextStats.resolvedEncounterCount,
    nextNameSubmissions,
    activeEncounter.templateId
  );
  const nextEncounter = createEncounterInstanceFromTemplate(
    nextEncounterTemplate,
    nextStats.resolvedEncounterCount + 1
  );
  const nextState: PettitState = {
    ...nextStateBeforeJournal,
    activeEncounterId: nextEncounter.id,
    latestJournalId: journal.id,
  };

  const [nextMemories, nextJournals] = await Promise.all([
    appendMemory(subredditName, memory),
    appendJournal(subredditName, journal),
  ]);

  await Promise.all([
    saveState(subredditName, nextState),
    saveActiveEncounter(subredditName, nextEncounter),
    saveStats(subredditName, nextStats),
    saveNameSubmissions(subredditName, nextNameSubmissions),
    resetVoterMap(subredditName),
  ]);

  return {
    state: buildViewModel({
      state: nextState,
      stats: nextStats,
      activeEncounter: nextEncounter,
      memories: nextMemories,
      journals: nextJournals,
      selectedOptionId: username ? null : null,
      pendingNamingTargets: getPendingNamingTargets(nextState, nextNameSubmissions),
    }),
    resolution: {
      winningOptionId: winningOption.id,
      memoryId: memory.id,
      journalId: journal.id,
    },
    traitFeedback: {
      appliedChanges,
      topTraits,
      summary: createTraitFeedbackSummary(appliedChanges, topTraits),
    },
  };
};
