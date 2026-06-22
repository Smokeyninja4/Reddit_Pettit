import type {
  ActiveQuest,
  PendingNamingTarget,
  PettitInventoryItem,
  PettitJournalEntry,
  PettitMemory,
  PettitMood,
  PettitNameSubmission,
  PettitState,
  PettitStats,
  PettitTraits,
  PettitViewModel,
  QuestOption,
  QuestOptionOutcome,
  QuestTemplate,
  TraitKey,
} from '../../shared/pettit';
import { getGiftById, buildGiftQuestTemplate, selectGiftRoundGiftIds } from './pettit-gifts';
import {
  applyCanonName,
  clearNamingTargetSubmissions,
  discoverLandmark,
  getCanonNames,
  getPendingNamingTargets,
  personalizeQuestText,
  selectReadyNamingQuestTemplate,
  submitNameForTarget,
} from './pettit-naming';
import {
  createQuestInstanceFromTemplate,
  getTopTraits,
  getQuestTemplateById,
  getStarterQuestByIndex,
} from './pettit-seed';
import {
  appendJournal,
  appendMemory,
  getJournals,
  getMemories,
  getOrCreateActiveQuest,
  getOrCreateState,
  getOrCreateStats,
  getVoterMap,
  getNameSubmissions,
  resetVoterMap,
  saveActiveQuest,
  saveNameSubmissions,
  saveState,
  saveStats,
  saveVoterMap,
} from './pettit-store';

type WorldSnapshot = {
  state: PettitState;
  stats: PettitStats;
  activeQuest: ActiveQuest;
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

const clampTraitValue = (value: number): number => Math.max(0, Math.min(100, value));

type AppliedTraitChange = {
  trait: TraitKey;
  before: number;
  after: number;
  delta: number;
};

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
  outcome: QuestOptionOutcome,
  sequenceNumber: number
): PettitMemory => ({
  id: `memory-${sequenceNumber}`,
  timestamp: new Date().toISOString(),
  title: outcome.memoryTitle,
  description: outcome.memoryDescription,
  type: outcome.memoryType,
  importance: outcome.importance,
});

const createJournalEntry = (
  state: PettitState,
  quest: ActiveQuest,
  outcome: QuestOptionOutcome,
  memory: PettitMemory,
  previousMemory: PettitMemory | null,
  sequenceNumber: number
): PettitJournalEntry => {
  const topTraits = getTopTraits(state.traits, 2);
  const openingByMood: Record<PettitMood, string> = {
    curious: 'Today felt full of questions in the best possible way.',
    excited: 'Today moved quickly, and I liked it that way.',
    thoughtful: 'Today felt quieter, but not empty.',
    nervous: 'Today required a little more bravery than usual.',
  };

  const reflectionByTrait: Record<TraitKey, string> = {
    curiosity: 'I keep learning that the world gets bigger every time I look a little closer.',
    chaos: 'Sometimes the strangest decisions are the ones that turn into stories worth keeping.',
    trust: 'It is easier to be brave when it feels like the community is walking beside me.',
    courage: 'I am starting to believe that uncertainty can still lead somewhere good.',
  };

  const leadingTrait = topTraits[0] ?? 'curiosity';
  const trailingTrait = topTraits[1] ?? leadingTrait;
  const memoryCallback = previousMemory
    ? `I also kept thinking about ${previousMemory.title.toLowerCase()}, which made today feel connected to everything that came before it.`
    : 'It feels nice knowing that today will be one of the first stories I get to keep.';

  const content = [
    openingByMood[outcome.mood],
    outcome.resultText,
    reflectionByTrait[leadingTrait],
    leadingTrait !== trailingTrait ? reflectionByTrait[trailingTrait] : memoryCallback,
    leadingTrait === trailingTrait ? memoryCallback : 'I think I am becoming a little more myself every day.',
  ].join(' ');

  return {
    id: `journal-${sequenceNumber}`,
    date: new Date().toISOString(),
    title: quest.title,
    content,
    relatedMemoryIds: [memory.id],
    relatedQuestId: quest.id,
  };
};

const selectWinningOption = (quest: ActiveQuest): QuestOption => {
  const template = getQuestTemplateById(quest.templateId);
  let winningOption: QuestOption | null = null;

  for (const templateOption of template.options) {
    const activeOption = quest.options.find((option) => option.id === templateOption.id);

    if (!activeOption) {
      continue;
    }

    if (!winningOption || activeOption.votes > winningOption.votes) {
      winningOption = activeOption;
    }
  }

  if (!winningOption) {
    throw new Error('Active quest has no vote options');
  }

  return winningOption;
};

const getOutcomeForOption = (template: QuestTemplate, optionId: string): QuestOptionOutcome => {
  const outcome = template.outcomes.find((candidate) => candidate.optionId === optionId);

  if (!outcome) {
    throw new Error(`Missing outcome for option ${optionId}`);
  }

  return outcome;
};

const buildViewModel = (snapshot: WorldSnapshot): PettitViewModel => {
  const latestJournal = snapshot.journals.length > 0 ? snapshot.journals[snapshot.journals.length - 1] ?? null : null;
  const recentMemories = snapshot.memories.slice(-3).reverse();
  const totalVotes = snapshot.activeQuest.options.reduce((sum, option) => sum + option.votes, 0);

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
      questsCompleted: snapshot.stats.resolvedQuestCount,
      memoriesCreated: snapshot.stats.memoryCount,
    },
    inventory: snapshot.state.inventory,
    knownNames: getCanonNames(snapshot.state),
    pendingNamingTargets: snapshot.pendingNamingTargets,
    activeQuest: {
      ...snapshot.activeQuest,
      totalVotes,
      hasVoted: snapshot.selectedOptionId !== null,
      selectedOptionId: snapshot.selectedOptionId,
    },
    latestJournal,
    recentMemories,
  };
};

const loadWorldSnapshot = async (subredditName: string, username: string | null): Promise<WorldSnapshot> => {
  const [state, stats, activeQuest, memories, journals, voterMap, nameSubmissions] = await Promise.all([
    getOrCreateState(subredditName),
    getOrCreateStats(subredditName),
    getOrCreateActiveQuest(subredditName),
    getMemories(subredditName),
    getJournals(subredditName),
    getVoterMap(subredditName),
    getNameSubmissions(subredditName),
  ]);

  return {
    state,
    stats,
    activeQuest,
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
    source: 'Community Gift Vote',
    obtainedAt: new Date().toISOString(),
    canonName: existingCanonName,
  };
};

const selectNextQuestTemplate = (
  state: PettitState,
  resolvedQuestCount: number,
  nameSubmissions: Record<string, PettitNameSubmission[]>
): QuestTemplate => {
  const namingQuestTemplate = selectReadyNamingQuestTemplate(state, nameSubmissions);

  if (namingQuestTemplate) {
    return namingQuestTemplate;
  }

  if (resolvedQuestCount > 0 && resolvedQuestCount % 3 === 0) {
    const giftIds = selectGiftRoundGiftIds(state.inventory, 3);
    return buildGiftQuestTemplate(giftIds);
  }

  return getStarterQuestByIndex(resolvedQuestCount % 3);
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
  const [activeQuest, voterMap, stats, state, memories, journals, nameSubmissions] = await Promise.all([
    getOrCreateActiveQuest(subredditName),
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

  const nextOptions = activeQuest.options.map((option) =>
    option.id === optionId ? { ...option, votes: option.votes + 1 } : option
  );
  const optionExists = nextOptions.some((option) => option.id === optionId);

  if (!optionExists) {
    throw new Error('INVALID_OPTION');
  }

  const nextQuest: ActiveQuest = {
    ...activeQuest,
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
    saveActiveQuest(subredditName, nextQuest),
    saveVoterMap(subredditName, nextVoterMap),
    saveStats(subredditName, nextStats),
  ]);

  return buildViewModel({
    state,
    stats: nextStats,
    activeQuest: nextQuest,
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
        ? `${target.baseName} is ready for a naming vote.`
        : 'Name submitted. The community is one step closer to making it canon.',
  };
};

export const resolveVote = async (subredditName: string, username: string | null): Promise<ResolveResult> => {
  const [state, activeQuest, memories, stats, nameSubmissions] = await Promise.all([
    getOrCreateState(subredditName),
    getOrCreateActiveQuest(subredditName),
    getMemories(subredditName),
    getOrCreateStats(subredditName),
    getNameSubmissions(subredditName),
  ]);

  const winningOption = selectWinningOption(activeQuest);
  const template = getQuestTemplateById(activeQuest.templateId);
  const outcome = getOutcomeForOption(template, winningOption.id);
  const { nextTraits, appliedChanges } = applyTraitEffects(state.traits, outcome.traitEffects);
  const topTraits = getTopTraits(nextTraits, 2);
  const nextStats: PettitStats = {
    ...stats,
    resolvedQuestCount: stats.resolvedQuestCount + 1,
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

  const personalizedOutcome: QuestOptionOutcome = {
    ...outcome,
    resultText: personalizeQuestText(nextStateBeforeJournal, activeQuest.templateId, outcome.resultText),
    memoryTitle: outcome.memoryTitle,
    memoryDescription: personalizeQuestText(nextStateBeforeJournal, activeQuest.templateId, outcome.memoryDescription),
  };
  const memory = createMemoryRecord(personalizedOutcome, nextStats.memoryCount);
  const previousMemory = memories.length > 0 ? memories[memories.length - 1] ?? null : null;
  const journal = createJournalEntry(
    nextStateBeforeJournal,
    activeQuest,
    personalizedOutcome,
    memory,
    previousMemory,
    nextStats.journalCount
  );
  const nextQuestTemplate = selectNextQuestTemplate(
    nextStateBeforeJournal,
    nextStats.resolvedQuestCount,
    nextNameSubmissions
  );
  const nextQuest = createQuestInstanceFromTemplate(nextQuestTemplate, nextStats.resolvedQuestCount + 1);
  const nextState: PettitState = {
    ...nextStateBeforeJournal,
    activeQuestId: nextQuest.id,
    latestJournalId: journal.id,
  };

  const [nextMemories, nextJournals] = await Promise.all([
    appendMemory(subredditName, memory),
    appendJournal(subredditName, journal),
  ]);

  await Promise.all([
    saveState(subredditName, nextState),
    saveActiveQuest(subredditName, nextQuest),
    saveStats(subredditName, nextStats),
    saveNameSubmissions(subredditName, nextNameSubmissions),
    resetVoterMap(subredditName),
  ]);

  return {
    state: buildViewModel({
      state: nextState,
      stats: nextStats,
      activeQuest: nextQuest,
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
