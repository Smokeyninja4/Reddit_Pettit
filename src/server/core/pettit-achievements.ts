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
  makeAchievement('ten-known-places', '10 Known Places', 'Pettit has started building a world with many familiar landmarks.', 'exploration', ({ state }) => state.landmarks.length >= 10),
  makeAchievement('first-rare-encounter', 'Rare Wonder', 'Pettit has lived through its first truly unusual shared encounter.', 'exploration', ({ resolvedTemplateId }) => resolvedTemplateId?.startsWith('encounter-rare-') ?? false),
  makeAchievement('first-seasonal-story', 'First Festival', 'The community has carried Pettit through its first seasonal story moment.', 'community', ({ resolvedTemplateId }) => resolvedTemplateId?.startsWith('encounter-seasonal-') ?? false),
  makeAchievement('first-memory', 'First Memory', 'Pettit has created its first lasting memory.', 'memory', ({ stats }) => stats.memoryCount >= 1),
  makeAchievement('ten-memories', '10 Memories', 'Pettit now carries a growing bundle of shared memories.', 'memory', ({ stats }) => stats.memoryCount >= 10),
  makeAchievement('hundred-memories', '100 Memories', 'Pettit has built a deep history of shared memories.', 'memory', ({ stats }) => stats.memoryCount >= 100),
  makeAchievement('first-keepsake', 'First Keepsake', 'Pettit has received its first shared keepsake from the community.', 'community', ({ state }) => state.inventory.length >= 1),
  makeAchievement('ten-keepsakes', '10 Keepsakes', 'Pettit now carries a little collection of community-chosen keepsakes.', 'community', ({ state }) => state.inventory.length >= 10),
  makeAchievement('first-canon-name', 'A Name That Stuck', 'The community has made its first permanent naming choice in Pettit\'s world.', 'community', ({ resolvedOutcome }) => Boolean(resolvedOutcome?.namingTarget)),
  makeAchievement('ate-weird-mushroom', 'Ate Weird Mushroom', 'Pettit followed a gloriously questionable mushroom decision.', 'funny', ({ resolvedTemplateId }) => resolvedTemplateId === 'encounter-chaos-eat-weird-mushroom'),
  makeAchievement('pressed-glowing-rune', 'Pressed Glowing Rune', 'Pettit pressed something luminous that probably should have stayed unpressed.', 'funny', ({ resolvedTemplateId }) => resolvedTemplateId === 'encounter-chaos-press-glowing-rune'),
  makeAchievement('accidentally-became-wizard', 'Accidentally Became Wizard', 'Pettit put on the wizard hat and immediately felt a little too powerful.', 'funny', ({ resolvedOutcome }) => resolvedOutcome?.awardedGiftId === 'wizard-hat'),
  makeAchievement('found-suspicious-hat', 'Found Suspicious Hat', 'Pettit accepted a truly questionable hat with admirable commitment.', 'funny', ({ resolvedOutcome }) => resolvedOutcome?.awardedGiftId === 'suspicious-hat'),
  makeAchievement('claimed-giant-spoon', 'Claimed Giant Spoon', 'Pettit welcomed a giant spoon into its life without asking nearly enough follow-up questions.', 'funny', ({ resolvedOutcome }) => resolvedOutcome?.awardedGiftId === 'giant-spoon'),
  makeAchievement('opened-mystery-box', 'Opened Mystery Box', 'Pettit received a mystery box and immediately made that everybody\'s business.', 'funny', ({ resolvedOutcome }) => resolvedOutcome?.awardedGiftId === 'mystery-box'),
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

  if (achievement.category === 'growth') {
    return `The community marked a milestone today: ${achievement.title}. Growing feels easier to notice when everyone seems proud at once.`;
  }

  if (achievement.category === 'community') {
    return `The community marked a milestone today: ${achievement.title}. It made the whole day feel warmer, like belonging had become something visible.`;
  }

  if (achievement.category === 'exploration') {
    return `The community marked a milestone today: ${achievement.title}. I think discoveries feel bigger when everyone leans in together.`;
  }

  if (achievement.category === 'memory') {
    return `The community marked a milestone today: ${achievement.title}. I could almost feel my story getting heavier in the gentlest possible way.`;
  }

  return `The community marked a milestone today: ${achievement.title}. I am not sure whether I should be proud or slightly embarrassed, which usually means it was a very good day.`;
};
