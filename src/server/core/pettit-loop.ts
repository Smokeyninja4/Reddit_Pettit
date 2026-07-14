import type {
  ActiveEncounter,
  ActiveSeasonalEventView,
  EncounterOption,
  EncounterOptionOutcome,
  EncounterTemplate,
  PettitGiftIdeaSubmission,
  PendingNamingTarget,
  PettitAchievement,
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
import {
  buildPendingCommunityGiftBallot,
  clearGiftIdeaSubmissions,
  getRecentCommunityGiftSummaries,
  isCommunityGiftEncounterTemplateId,
  selectReadyCommunityGiftEncounterTemplate,
  submitGiftIdea as submitCommunityGiftIdea,
} from './pettit-contributions';
import {
  getGiftById,
  buildGiftEncounterTemplate,
  isCommunityGiftId,
  selectGiftEncounterIds,
  selectPreferredGiftEncounterIds,
} from './pettit-gifts';
import { buildHallOfMemoriesDetail, buildHallOfMemoriesView } from './pettit-hall';
import { createJournalEntry } from './pettit-journal';
import {
  evaluateResolvedAchievements,
  getAchievementCelebrationLine,
  syncAgeAchievements,
} from './pettit-achievements';
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
  canReceiveCommunityName,
  getPettitBirthdaySummary,
  personalizePettitText,
} from './pettit-identity';
import { selectMinorEvent } from './pettit-minor-events';
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
  getSeasonalEncounterModifier,
  getSeasonalEncounterTemplates as getActiveSeasonalEncounterTemplates,
  getSeasonalJournalContext,
  getSeasonalProgressView,
  syncSeasonalState,
} from './pettit-seasonal';
import {
  appendJournal,
  appendMemory,
  getGiftIdeaSubmissions,
  getJournals,
  getMemories,
  getNameSubmissions,
  getOrCreateActiveEncounter,
  getOrCreateState,
  getOrCreateStats,
  getVoterMap,
  resetVoterMap,
  saveActiveEncounter,
  saveGiftIdeaSubmissions,
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
  giftIdeaSubmissions: PettitGiftIdeaSubmission[];
};

type SeasonalSnapshot = {
  state: PettitState;
  activeEvent: ActiveSeasonalEventView | null;
};

type ResolveResult = {
  state: PettitViewModel;
  outcome: 'resolved' | 'advanced';
  resolution: {
    winningOptionId: string | null;
    memoryId: string | null;
    journalId: string | null;
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
  unlockedAchievements: PettitAchievement[];
};

type TransitionMode = 'boundary' | 'manual';

type AppliedTraitChange = {
  trait: TraitKey;
  before: number;
  after: number;
  delta: number;
};

const clampTraitValue = (value: number): number => Math.max(0, Math.min(100, value));

const getUtcDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const getNextUtcMidnight = (date: Date): string => {
  const next = new Date(date);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
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
  const recentAchievements = snapshot.stats.achievements.slice(-3).reverse();
  const totalVotes = snapshot.activeEncounter.options.reduce((sum, option) => sum + option.votes, 0);

  return {
    pettit: {
      name: snapshot.state.name,
      nameOrigin: snapshot.state.nameOrigin,
      ageDays: snapshot.state.ageDays,
      birthdaySummary: getPettitBirthdaySummary(snapshot.state.createdAt),
      mood: snapshot.state.mood,
      traits: snapshot.state.traits,
      topTraits: getTopTraits(snapshot.state.traits, 2),
      appearanceDna: snapshot.state.appearanceDna,
      canReceiveCommunityName: canReceiveCommunityName(snapshot.state, snapshot.stats.resolvedEncounterCount),
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
    recentAchievements,
    achievementCount: snapshot.stats.achievements.length,
    hallOfMemories: buildHallOfMemoriesView(snapshot.memories),
    seasonal: getSeasonalProgressView(snapshot.state),
    communityContributions: {
      pendingGiftBallot: buildPendingCommunityGiftBallot(snapshot.giftIdeaSubmissions),
      recentCommunityGifts: getRecentCommunityGiftSummaries(snapshot.state.inventory),
    },
  };
};

const loadWorldSnapshot = async (subredditName: string, username: string | null): Promise<WorldSnapshot> => {
  const [state, stats, activeEncounter, memories, journals, voterMap, nameSubmissions, giftIdeaSubmissions] = await Promise.all([
    getOrCreateState(subredditName),
    getOrCreateStats(subredditName),
    getOrCreateActiveEncounter(subredditName),
    getMemories(subredditName),
    getJournals(subredditName),
    getVoterMap(subredditName),
    getNameSubmissions(subredditName),
    getGiftIdeaSubmissions(subredditName),
  ]);

  return {
    state,
    stats,
    activeEncounter,
    memories,
    journals,
    selectedOptionId: username ? voterMap[username] ?? null : null,
    pendingNamingTargets: getPendingNamingTargets(state, nameSubmissions, stats.resolvedEncounterCount),
    giftIdeaSubmissions,
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
    source: isCommunityGiftId(giftId) ? 'Community Contribution' : 'Community Gift Encounter',
    obtainedAt: new Date().toISOString(),
    canonName: existingCanonName,
  };
};

const isRareEncounterTurn = (resolvedEncounterCount: number): boolean => {
  return resolvedEncounterCount > 0 && resolvedEncounterCount % 20 === 0;
};

const SEASONAL_ENCOUNTER_CHANCE = 0.14;
const ENCOUNTER_WEIGHT_FLOOR = 5;

const filterRepeatedEncounter = (
  candidates: readonly EncounterTemplate[],
  currentTemplateId: string
): EncounterTemplate[] => {
  const canonicalCurrentId = canonicalizeEncounterTemplateId(currentTemplateId);
  const filteredCandidates = candidates.filter((template) => template.id !== canonicalCurrentId);
  return filteredCandidates.length > 0 ? filteredCandidates : [...candidates];
};

const pickRandomEncounter = (
  candidates: readonly EncounterTemplate[],
  currentTemplateId: string
): EncounterTemplate => {
  const safeCandidates = filterRepeatedEncounter(candidates, currentTemplateId);

  if (safeCandidates.length === 0) {
    throw new Error('Encounter library is empty');
  }

  const index = Math.floor(Math.random() * safeCandidates.length);
  return safeCandidates[index] ?? safeCandidates[0]!;
};

const getTraitAffinityWeight = (
  state: PettitState,
  affinity: TraitKey,
  seasonalBoost = 0
): number => {
  const traitValue = state.traits[affinity];
  return ENCOUNTER_WEIGHT_FLOOR + seasonalBoost * 10 + Math.round((traitValue * traitValue) / 25);
};

const pickWeightedStandardEncounter = (
  candidates: readonly EncounterTemplate[],
  state: PettitState,
  currentTemplateId: string
): EncounterTemplate => {
  const safeCandidates = filterRepeatedEncounter(candidates, currentTemplateId);

  if (safeCandidates.length === 0) {
    throw new Error('Encounter library is empty');
  }

  const groupedByAffinity: Record<TraitKey, EncounterTemplate[]> = {
    curiosity: [],
    courage: [],
    trust: [],
    chaos: [],
  };

  safeCandidates.forEach((template) => {
    if (
      template.affinity === 'curiosity' ||
      template.affinity === 'courage' ||
      template.affinity === 'trust' ||
      template.affinity === 'chaos'
    ) {
      groupedByAffinity[template.affinity].push(template);
    }
  });

  const availableFamilies = (Object.keys(groupedByAffinity) as TraitKey[]).filter(
    (family) => groupedByAffinity[family].length > 0
  );

  if (availableFamilies.length === 0) {
    throw new Error('No standard encounter families are available');
  }

  const chosenFamily = (() => {
    const seasonalModifier = getSeasonalEncounterModifier(state);
    const familyWeights = availableFamilies.map((family) => ({
      family,
      weight: getTraitAffinityWeight(state, family, seasonalModifier.affinityBoosts[family] ?? 0),
    }));
    const totalWeight = familyWeights.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of familyWeights) {
      roll -= entry.weight;

      if (roll <= 0) {
        return entry.family;
      }
    }

    return familyWeights[familyWeights.length - 1]?.family ?? availableFamilies[0]!;
  })();

  const familyCandidates = groupedByAffinity[chosenFamily];
  return pickRandomEncounter(familyCandidates, currentTemplateId);
};

const selectNextEncounterTemplate = (
  state: PettitState,
  resolvedEncounterCount: number,
  nameSubmissions: Record<string, PettitNameSubmission[]>,
  giftIdeaSubmissions: PettitGiftIdeaSubmission[],
  currentTemplateId: string
): EncounterTemplate => {
  const seasonalModifier = getSeasonalEncounterModifier(state);
  const resolvedCount = resolvedEncounterCount;

  const namingEncounterTemplateWithIdentity = selectReadyNamingEncounterTemplate(state, nameSubmissions, resolvedCount);

  if (namingEncounterTemplateWithIdentity) {
    return namingEncounterTemplateWithIdentity;
  }

  const communityGiftEncounterTemplate = selectReadyCommunityGiftEncounterTemplate(giftIdeaSubmissions);

  if (communityGiftEncounterTemplate) {
    return communityGiftEncounterTemplate;
  }

  if (resolvedEncounterCount > 0 && resolvedEncounterCount % 3 === 0) {
    const giftIds =
      seasonalModifier.preferredGiftIds.length > 0
        ? selectPreferredGiftEncounterIds(state.inventory, 3, seasonalModifier.preferredGiftIds)
        : selectGiftEncounterIds(state.inventory, 3);
    return buildGiftEncounterTemplate(giftIds);
  }

  if (
    isRareEncounterTurn(resolvedEncounterCount) ||
    (seasonalModifier.rareChanceBonus > 0 && Math.random() < seasonalModifier.rareChanceBonus)
  ) {
    return pickRandomEncounter(getRareEncounterTemplates(), currentTemplateId);
  }

  const activeSeasonalCandidates = getActiveSeasonalEncounterTemplates(state);

  if (activeSeasonalCandidates.length > 0 && Math.random() < seasonalModifier.seasonalEncounterChance) {
    return pickRandomEncounter(activeSeasonalCandidates, currentTemplateId);
  }

  const seasonalCandidates = getSeasonalEncounterTemplates();

  if (seasonalCandidates.length > 0 && Math.random() < SEASONAL_ENCOUNTER_CHANCE) {
    return pickRandomEncounter(seasonalCandidates, currentTemplateId);
  }

  const standardCandidates = getStandardEncounterTemplates();

  return pickWeightedStandardEncounter(standardCandidates, state, currentTemplateId);
};

const syncSeasonalWorldState = async (subredditName: string): Promise<SeasonalSnapshot> => {
  const state = await getOrCreateState(subredditName);
  const result = syncSeasonalState(state);

  if (result.changed) {
    await saveState(subredditName, result.state);
  }

  return {
    state: result.state,
    activeEvent: result.activeEvent,
  };
};

const pickJournalCallbackMemory = (
  memories: PettitMemory[],
  state: PettitState
): PettitMemory | null => {
  const seasonalContext = getSeasonalJournalContext(state);

  if (seasonalContext?.preferOldMemories) {
    const olderImportantMemory =
      [...memories]
        .reverse()
        .find((memory) => memory.importance >= 4) ??
      memories[0] ??
      null;

    if (olderImportantMemory) {
      return olderImportantMemory;
    }
  }

  return memories.length > 0 ? memories[memories.length - 1] ?? null : null;
};

const getEncounterVoteTotal = (encounter: ActiveEncounter): number =>
  encounter.options.reduce((sum, option) => sum + option.votes, 0);

const updateDailyCycle = (
  state: PettitState,
  mode: TransitionMode
): PettitState['dailyCycle'] => {
  if (mode === 'manual') {
    return state.dailyCycle;
  }

  const nextDayDate = new Date(state.dailyCycle.nextResolveAt);
  return {
    currentDayKey: getUtcDayKey(nextDayDate),
    nextResolveAt: getNextUtcMidnight(nextDayDate),
    lastProcessedDayKey: getUtcDayKey(nextDayDate),
  };
};

const buildEmptyAdvanceFeedback = (state: PettitState) => {
  const topTraits = getTopTraits(state.traits, 2);

  return {
    appliedChanges: [] as AppliedTraitChange[],
    topTraits,
    summary: 'No votes came in, so Pettit simply moved on to a fresh encounter.',
  };
};

const processEncounterTransition = async (
  subredditName: string,
  mode: TransitionMode
): Promise<ResolveResult> => {
  const [state, activeEncounter, memories, journals, stats, nameSubmissions, giftIdeaSubmissions] = await Promise.all([
    syncSeasonalWorldState(subredditName).then((result) => result.state),
    getOrCreateActiveEncounter(subredditName),
    getMemories(subredditName),
    getJournals(subredditName),
    getOrCreateStats(subredditName),
    getNameSubmissions(subredditName),
    getGiftIdeaSubmissions(subredditName),
  ]);

  const totalVotes = getEncounterVoteTotal(activeEncounter);

  if (totalVotes === 0) {
    const nextEncounterTemplate = selectNextEncounterTemplate(
      state,
      stats.resolvedEncounterCount,
      nameSubmissions,
      giftIdeaSubmissions,
      activeEncounter.templateId
    );
    const nextEncounter = createEncounterInstanceFromTemplate(
      nextEncounterTemplate,
      stats.resolvedEncounterCount + 1
    );
    const nextState: PettitState = {
      ...state,
      activeEncounterId: nextEncounter.id,
      dailyCycle: updateDailyCycle(state, mode),
    };

    await Promise.all([
      saveState(subredditName, nextState),
      saveActiveEncounter(subredditName, nextEncounter),
      resetVoterMap(subredditName),
    ]);

    return {
      state: buildViewModel({
        state: nextState,
        stats,
        activeEncounter: nextEncounter,
        memories,
        journals,
        selectedOptionId: null,
        pendingNamingTargets: getPendingNamingTargets(nextState, nameSubmissions, stats.resolvedEncounterCount),
        giftIdeaSubmissions,
      }),
      outcome: 'advanced',
      resolution: {
        winningOptionId: null,
        memoryId: null,
        journalId: null,
      },
      traitFeedback: buildEmptyAdvanceFeedback(nextState),
      unlockedAchievements: [],
    };
  }

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
  let nextGiftIdeaSubmissions = giftIdeaSubmissions;

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

  if (isCommunityGiftEncounterTemplateId(activeEncounter.templateId)) {
    nextGiftIdeaSubmissions = clearGiftIdeaSubmissions();
  }

  const personalizedOutcome: EncounterOptionOutcome = {
    ...outcome,
    resultText: personalizePettitText(
      nextStateBeforeJournal,
      personalizeEncounterText(nextStateBeforeJournal, activeEncounter.templateId, outcome.resultText)
    ),
    memoryDescription: personalizePettitText(
      nextStateBeforeJournal,
      personalizeEncounterText(nextStateBeforeJournal, activeEncounter.templateId, outcome.memoryDescription)
    ),
  };
  const achievementResult = evaluateResolvedAchievements(
    nextStateBeforeJournal,
    nextStats,
    activeEncounter.templateId,
    personalizedOutcome
  );
  const memory = createMemoryRecord(personalizedOutcome, achievementResult.stats.memoryCount);
  const previousMemory = pickJournalCallbackMemory(memories, nextStateBeforeJournal);
  const minorEvent = selectMinorEvent(
    nextStateBeforeJournal,
    activeEncounter,
    personalizedOutcome,
    achievementResult.stats.journalCount
  );
  const journal = createJournalEntry(
    nextStateBeforeJournal,
    activeEncounter,
    personalizedOutcome,
    memory,
    previousMemory,
    minorEvent,
    achievementResult.stats.journalCount,
    getAchievementCelebrationLine(achievementResult.unlockedAchievements[0] ?? null),
    getSeasonalJournalContext(nextStateBeforeJournal)
  );
  const nextEncounterTemplate = selectNextEncounterTemplate(
    nextStateBeforeJournal,
    achievementResult.stats.resolvedEncounterCount,
    nextNameSubmissions,
    nextGiftIdeaSubmissions,
    activeEncounter.templateId
  );
  const nextEncounter = createEncounterInstanceFromTemplate(
    nextEncounterTemplate,
    achievementResult.stats.resolvedEncounterCount + 1
  );
  const nextState: PettitState = {
    ...nextStateBeforeJournal,
    activeEncounterId: nextEncounter.id,
    latestJournalId: journal.id,
    dailyCycle: updateDailyCycle(nextStateBeforeJournal, mode),
  };

  const [nextMemories, nextJournals] = await Promise.all([
    appendMemory(subredditName, memory),
    appendJournal(subredditName, journal),
  ]);

  await Promise.all([
    saveState(subredditName, nextState),
    saveActiveEncounter(subredditName, nextEncounter),
    saveStats(subredditName, achievementResult.stats),
    saveGiftIdeaSubmissions(subredditName, nextGiftIdeaSubmissions),
    saveNameSubmissions(subredditName, nextNameSubmissions),
    resetVoterMap(subredditName),
  ]);

  return {
    state: buildViewModel({
      state: nextState,
      stats: achievementResult.stats,
      activeEncounter: nextEncounter,
      memories: nextMemories,
      journals: nextJournals,
      selectedOptionId: null,
      pendingNamingTargets: getPendingNamingTargets(
        nextState,
        nextNameSubmissions,
        achievementResult.stats.resolvedEncounterCount
      ),
      giftIdeaSubmissions: nextGiftIdeaSubmissions,
    }),
    outcome: 'resolved',
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
    unlockedAchievements: achievementResult.unlockedAchievements,
  };
};

const advanceWorldToCurrentDay = async (subredditName: string): Promise<void> => {
  let state = await getOrCreateState(subredditName);
  let safetyCounter = 0;

  while (new Date(state.dailyCycle.nextResolveAt).getTime() <= Date.now()) {
    await processEncounterTransition(subredditName, 'boundary');
    state = await getOrCreateState(subredditName);
    safetyCounter += 1;

    if (safetyCounter > 366) {
      throw new Error('DAILY_CATCHUP_LIMIT_EXCEEDED');
    }
  }
};

const syncPassiveAchievements = async (subredditName: string): Promise<void> => {
  const [state, stats] = await Promise.all([
    syncSeasonalWorldState(subredditName).then((result) => result.state),
    getOrCreateStats(subredditName),
  ]);
  const result = syncAgeAchievements(state, stats);

  if (result.unlockedAchievements.length > 0) {
    await saveStats(subredditName, result.stats);
  }
};

export const getPettitViewModel = async (
  subredditName: string,
  username: string | null
): Promise<PettitViewModel> => {
  await advanceWorldToCurrentDay(subredditName);
  await syncSeasonalWorldState(subredditName);
  await syncPassiveAchievements(subredditName);
  const snapshot = await loadWorldSnapshot(subredditName, username);
  return buildViewModel(snapshot);
};

export const submitVote = async (
  subredditName: string,
  username: string,
  optionId: string
): Promise<PettitViewModel> => {
  await advanceWorldToCurrentDay(subredditName);
  const seasonalState = await syncSeasonalWorldState(subredditName);
  await syncPassiveAchievements(subredditName);
  const [activeEncounter, voterMap, stats, memories, journals, nameSubmissions, giftIdeaSubmissions] = await Promise.all([
    getOrCreateActiveEncounter(subredditName),
    getVoterMap(subredditName),
    getOrCreateStats(subredditName),
    getMemories(subredditName),
    getJournals(subredditName),
    getNameSubmissions(subredditName),
    getGiftIdeaSubmissions(subredditName),
  ]);
  const state = seasonalState.state;

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
    pendingNamingTargets: getPendingNamingTargets(state, nameSubmissions, nextStats.resolvedEncounterCount),
    giftIdeaSubmissions,
  });
};

export const submitName = async (
  subredditName: string,
  username: string,
  targetKey: string,
  proposedName: string
): Promise<{ pendingNamingTargets: PendingNamingTarget[]; message: string }> => {
  await advanceWorldToCurrentDay(subredditName);
  await syncSeasonalWorldState(subredditName);
  await syncPassiveAchievements(subredditName);
  const [state, submissionMap] = await Promise.all([
    syncSeasonalWorldState(subredditName).then((result) => result.state),
    getNameSubmissions(subredditName),
  ]);

  const stats = await getOrCreateStats(subredditName);
  const nextSubmissionMap = submitNameForTarget(state, stats, submissionMap, username, targetKey, proposedName);
  await saveNameSubmissions(subredditName, nextSubmissionMap);

  const { targetType, targetId } = (() => {
    const [targetTypeValue, ...targetIdParts] = targetKey.split(':');

    if ((targetTypeValue !== 'gift' && targetTypeValue !== 'landmark' && targetTypeValue !== 'pettit') || targetIdParts.length === 0) {
      throw new Error('INVALID_NAMING_TARGET');
    }

    return {
      targetType: targetTypeValue,
      targetId: targetIdParts.join(':'),
    };
  })();

  const pendingTargets = getPendingNamingTargets(state, nextSubmissionMap, stats.resolvedEncounterCount);
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

export const submitGiftIdea = async (
  subredditName: string,
  username: string,
  name: string,
  description: string,
  category: PettitGiftIdeaSubmission['category']
): Promise<{ pendingGiftBallot: ReturnType<typeof buildPendingCommunityGiftBallot>; message: string }> => {
  await advanceWorldToCurrentDay(subredditName);
  await syncSeasonalWorldState(subredditName);
  await syncPassiveAchievements(subredditName);
  const [state, submissions] = await Promise.all([
    syncSeasonalWorldState(subredditName).then((result) => result.state),
    getGiftIdeaSubmissions(subredditName),
  ]);

  const nextSubmissions = submitCommunityGiftIdea(state, submissions, username, name, description, category);
  await saveGiftIdeaSubmissions(subredditName, nextSubmissions);

  const pendingGiftBallot = buildPendingCommunityGiftBallot(nextSubmissions);

  return {
    pendingGiftBallot,
    message:
      nextSubmissions.length >= 3
        ? 'That community gift ballot is ready for an encounter vote.'
        : 'Gift idea submitted. The community is shaping Pettit together.',
  };
};

export const resolveVote = async (subredditName: string, _username: string | null): Promise<ResolveResult> => {
  await advanceWorldToCurrentDay(subredditName);
  await syncSeasonalWorldState(subredditName);
  await syncPassiveAchievements(subredditName);
  return processEncounterTransition(subredditName, 'manual');
};

export const processScheduledDailyResolve = async (subredditName: string): Promise<void> => {
  await advanceWorldToCurrentDay(subredditName);
  await syncPassiveAchievements(subredditName);
};

export const getHallOfMemoriesDetail = async (subredditName: string) => {
  await advanceWorldToCurrentDay(subredditName);
  await syncPassiveAchievements(subredditName);
  const memories = await getMemories(subredditName);
  return buildHallOfMemoriesDetail(memories);
};
