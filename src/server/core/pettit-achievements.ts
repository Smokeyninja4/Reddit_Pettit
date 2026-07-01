import type {
  AchievementCategory,
  EncounterOptionOutcome,
  PettitAchievement,
  PettitState,
  PettitStats,
} from '../../shared/pettit';
import { canonicalizeEncounterTemplateId } from './pettit-seed';

type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  matches: (context: AchievementContext) => boolean;
};

type AchievementContext = {
  state: PettitState;
  stats: PettitStats;
  resolvedTemplateId?: string;
  resolvedOutcome?: EncounterOptionOutcome;
};

type UnlockResult = {
  stats: PettitStats;
  unlockedAchievements: PettitAchievement[];
};

const makeAchievement = (
  key: string,
  title: string,
  description: string,
  category: AchievementCategory,
  matches: AchievementDefinition['matches']
): AchievementDefinition => ({
  key,
  title,
  description,
  category,
  matches,
});

const AGE_ACHIEVEMENTS: readonly AchievementDefinition[] = [
  makeAchievement('first-day', 'First Day', 'Pettit has made it through the first shared day.', 'growth', ({ state }) => state.ageDays >= 1),
  makeAchievement('thirty-days-old', '30 Days Old', 'Pettit has been raised by the community for 30 days.', 'growth', ({ state }) => state.ageDays >= 30),
  makeAchievement('hundred-days-old', '100 Days Old', 'Pettit has grown with the community for 100 days.', 'growth', ({ state }) => state.ageDays >= 100),
];

const RESOLVE_ACHIEVEMENTS: readonly AchievementDefinition[] = [
  ...AGE_ACHIEVEMENTS,
  makeAchievement('hundred-votes-cast', '100 Votes Cast', 'The community has cast 100 votes together.', 'community', ({ stats }) => stats.totalVotes >= 100),
  makeAchievement('thousand-votes-cast', '1,000 Votes Cast', 'The community has cast 1,000 votes together.', 'community', ({ stats }) => stats.totalVotes >= 1000),
  makeAchievement('first-adventure', 'First Adventure', 'Pettit has completed its first shared encounter.', 'exploration', ({ stats }) => stats.resolvedEncounterCount >= 1),
  makeAchievement('first-discovery', 'First Discovery', 'Pettit has discovered its first meaningful place.', 'exploration', ({ state }) => state.landmarks.length >= 1),
  makeAchievement('all-starter-landmarks', 'Three Known Places', 'Pettit has discovered the first set of shared landmarks.', 'exploration', ({ state }) => state.landmarks.length >= 3),
  makeAchievement('first-memory', 'First Memory', 'Pettit has created its first lasting memory.', 'memory', ({ stats }) => stats.memoryCount >= 1),
  makeAchievement('ten-memories', '10 Memories', 'Pettit now carries a growing bundle of shared memories.', 'memory', ({ stats }) => stats.memoryCount >= 10),
  makeAchievement('hundred-memories', '100 Memories', 'Pettit has built a deep history of shared memories.', 'memory', ({ stats }) => stats.memoryCount >= 100),
  makeAchievement('ate-weird-mushroom', 'Ate Weird Mushroom', 'Pettit followed a gloriously questionable mushroom decision.', 'funny', ({ resolvedTemplateId }) => resolvedTemplateId === 'encounter-chaos-eat-weird-mushroom'),
  makeAchievement('pressed-glowing-rune', 'Pressed Glowing Rune', 'Pettit pressed something luminous that probably should have stayed unpressed.', 'funny', ({ resolvedTemplateId }) => resolvedTemplateId === 'encounter-chaos-press-glowing-rune'),
  makeAchievement('accidentally-became-wizard', 'Accidentally Became Wizard', 'Pettit put on the wizard hat and immediately felt a little too powerful.', 'funny', ({ resolvedOutcome }) => resolvedOutcome?.awardedGiftId === 'wizard-hat'),
];

const buildAchievementRecord = (
  definition: AchievementDefinition,
  unlockedAt: string,
  sequenceNumber: number
): PettitAchievement => ({
  id: `achievement-${sequenceNumber}`,
  key: definition.key,
  title: definition.title,
  description: definition.description,
  category: definition.category,
  unlockedAt,
});

const unlockFromDefinitions = (
  definitions: readonly AchievementDefinition[],
  stats: PettitStats,
  context: AchievementContext
): UnlockResult => {
  const existingKeys = new Set(stats.achievements.map((achievement) => achievement.key));
  const unlockedAt = new Date().toISOString();
  const unlockedAchievements = definitions
    .filter((definition) => !existingKeys.has(definition.key) && definition.matches(context))
    .map((definition, index) =>
      buildAchievementRecord(definition, unlockedAt, stats.achievements.length + index + 1)
    );

  if (unlockedAchievements.length === 0) {
    return {
      stats,
      unlockedAchievements: [],
    };
  }

  return {
    stats: {
      ...stats,
      achievements: [...stats.achievements, ...unlockedAchievements],
    },
    unlockedAchievements,
  };
};

export const syncAgeAchievements = (state: PettitState, stats: PettitStats): UnlockResult => {
  return unlockFromDefinitions(AGE_ACHIEVEMENTS, stats, { state, stats });
};

export const evaluateResolvedAchievements = (
  state: PettitState,
  stats: PettitStats,
  resolvedTemplateId: string,
  resolvedOutcome: EncounterOptionOutcome
): UnlockResult => {
  return unlockFromDefinitions(RESOLVE_ACHIEVEMENTS, stats, {
    state,
    stats,
    resolvedTemplateId: canonicalizeEncounterTemplateId(resolvedTemplateId),
    resolvedOutcome,
  });
};

export const getAchievementCelebrationLine = (achievement: PettitAchievement | null): string | null => {
  if (!achievement) {
    return null;
  }

  return `The community marked a milestone today: ${achievement.title}. I think I will remember that feeling for a long time.`;
};
