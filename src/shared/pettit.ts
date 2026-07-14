export type TraitKey = 'curiosity' | 'chaos' | 'trust' | 'courage';

export type PettitMood = 'curious' | 'excited' | 'thoughtful' | 'nervous';

export type PettitTraits = Record<TraitKey, number>;

export type MemoryType =
  | 'learning'
  | 'adventure'
  | 'friendship'
  | 'community'
  | 'funny'
  | 'special'
  | 'gift';

export type EncounterAffinity = TraitKey | 'community' | 'rare' | 'seasonal';

export type EncounterSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export type GiftCategory = 'clothing' | 'tools' | 'toys' | 'books' | 'community' | 'funny';

export type NamingTargetType = 'gift' | 'landmark' | 'pettit';

export type PettitNameOrigin = 'subreddit' | 'community';

export type PettitPaletteKey = 'sunrise' | 'meadow' | 'berry' | 'twilight' | 'moss';

export type PettitEarStyle = 'round' | 'leaf' | 'tilt';

export type PettitEyeStyle = 'dot' | 'oval' | 'sleepy';

export type PettitBlushStyle = 'round' | 'soft' | 'none';

export type PettitSparkStyle = 'orb' | 'leaf' | 'star';

export type PettitAccentPattern = 'plain' | 'patch' | 'speck' | 'band';

export type AchievementCategory = 'growth' | 'community' | 'exploration' | 'memory' | 'funny';

export type SeasonalEventKey =
  | 'pettit-day'
  | 'longest-night'
  | 'bloom-day'
  | 'campfire-night'
  | 'storykeepers-day'
  | 'lost-toy-day'
  | 'rain-appreciation-day'
  | 'paint-everything-day'
  | 'silly-socks-day'
  | 'great-planting-day'
  | 'day-of-little-things'
  | 'gift-exchange'
  | 'mushroom-festival'
  | 'honey-harvest'
  | 'wind-festival'
  | 'pie-festival'
  | 'mask-festival'
  | 'wanderers-week'
  | 'library-week'
  | 'surprise-day'
  | 'shooting-star-night'
  | 'blue-moon-feast'
  | 'rainbow-bloom'
  | 'butterfly-migration'
  | 'crystal-frost'
  | 'ancient-forest-awakening'
  | 'comet-night'
  | 'festival-of-forgotten-names'
  | 'night-of-a-thousand-lanterns'
  | 'whispering-woods'
  | 'constellation-festival';

export type SeasonalEventKind = 'holiday' | 'festival' | 'week' | 'special' | 'legendary';

export type ActiveSeasonalEventView = {
  key: SeasonalEventKey;
  title: string;
  kind: SeasonalEventKind;
  timingLabel: string;
  flavorText: string;
  accentColor: string;
};

export type SeasonalProgressView = {
  activeEvent: ActiveSeasonalEventView | null;
  recentEventKeys: SeasonalEventKey[];
};

export type PettitSeasonalProgress = {
  lastSeenEventKeys: SeasonalEventKey[];
  activeEventKey: SeasonalEventKey | null;
  surpriseDayYear: Record<string, string>;
  shootingStarYear: Record<string, string>;
  legendaryEventYear: Record<string, string | null>;
  pettitDayGiftGrantedYears: string[];
};

export type PettitRareProgress = {
  lastEncounterResolvedCount: number | null;
  recentTemplateIds: string[];
};

export type PettitStoryArcProgress = {
  lastArcResolvedCount: number | null;
  recentArcKeys: string[];
};

export type PettitAppearanceDna = {
  seedVersion: 1;
  paletteKey: PettitPaletteKey;
  bodyWidthScale: number;
  bodyHeightScale: number;
  earStyle: PettitEarStyle;
  eyeStyle: PettitEyeStyle;
  eyeSpacing: number;
  blushStyle: PettitBlushStyle;
  sparkStyle: PettitSparkStyle;
  accentPattern: PettitAccentPattern;
};

export type PettitInventoryItem = {
  id: string;
  giftId: string;
  name: string;
  description: string;
  category: GiftCategory;
  source: string;
  obtainedAt: string;
  canonName?: string;
};

export type PettitLandmark = {
  id: string;
  baseName: string;
  description: string;
  sourceEncounterTemplateId: string;
  discoveredAt: string;
  canonName?: string;
};

export type PettitNameSubmission = {
  username: string;
  proposedName: string;
  submittedAt: string;
};

export type PettitGiftIdeaSubmission = {
  username: string;
  name: string;
  description: string;
  category: GiftCategory;
  submittedAt: string;
};

export type PendingCommunityGiftBallot = {
  submissionCount: number;
  isReady: boolean;
  submissions: Array<{
    name: string;
    category: GiftCategory;
  }>;
};

export type RecentCommunityGiftSummary = {
  name: string;
  category: GiftCategory;
  obtainedAt: string;
};

export type CanonNameRecord = {
  targetType: NamingTargetType;
  targetId: string;
  baseName: string;
  canonName: string;
  description: string;
};

export type PendingNamingTarget = {
  targetType: NamingTargetType;
  targetId: string;
  baseName: string;
  description: string;
  submissionCount: number;
};

export type EncounterOption = {
  id: string;
  label: string;
  votes: number;
};

export type PettitMemory = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: MemoryType;
  importance: number;
};

export type PettitJournalEntry = {
  id: string;
  date: string;
  title: string;
  content: string;
  relatedMemoryIds: string[];
  relatedEncounterId: string;
};

export type PettitAchievement = {
  id: string;
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  unlockedAt: string;
};

export type HallOfMemoriesView = {
  highlighted: PettitMemory[];
  recentArchive: PettitMemory[];
  highlightedCount: number;
};

export type HallOfMemoriesDetailView = {
  highlighted: PettitMemory[];
  archive: PettitMemory[];
  highlightedCount: number;
};

export type EncounterOptionOutcome = {
  optionId: string;
  resultText: string;
  memoryTitle: string;
  memoryDescription: string;
  memoryType: MemoryType;
  importance: number;
  mood: PettitMood;
  traitEffects: Partial<Record<TraitKey, number>>;
  awardedGiftId?: string;
  discoveredLandmarkId?: string;
  namingTarget?: {
    type: NamingTargetType;
    targetId: string;
    canonName: string;
  };
};

export type EncounterTemplate = {
  id: string;
  title: string;
  description: string;
  affinity: EncounterAffinity;
  season?: EncounterSeason;
  isRare?: boolean;
  options: ReadonlyArray<{
    id: string;
    label: string;
  }>;
  outcomes: ReadonlyArray<EncounterOptionOutcome>;
};

export type ActiveEncounter = {
  id: string;
  templateId: string;
  title: string;
  description: string;
  affinity: EncounterAffinity;
  season?: EncounterSeason;
  isRare?: boolean;
  createdAt: string;
  options: EncounterOption[];
};

export type EncounterVoteSummary = {
  totalVotes: number;
  winningOptionId: string | null;
};

export type PettitDailyCycle = {
  currentDayKey: string;
  nextResolveAt: string;
  lastProcessedDayKey: string;
};

export type PettitState = {
  id: string;
  name: string;
  nameOrigin: PettitNameOrigin;
  pettitNamingFinalizedAt: string | null;
  createdAt: string;
  ageDays: number;
  mood: PettitMood;
  traits: PettitTraits;
  appearanceDna: PettitAppearanceDna;
  inventory: PettitInventoryItem[];
  landmarks: PettitLandmark[];
  activeEncounterId: string;
  latestJournalId: string | null;
  dailyCycle: PettitDailyCycle;
  seasonalProgress: PettitSeasonalProgress;
  rareProgress: PettitRareProgress;
  storyArcProgress: PettitStoryArcProgress;
};

export type PettitStats = {
  totalVotes: number;
  journalCount: number;
  memoryCount: number;
  resolvedEncounterCount: number;
  achievements: PettitAchievement[];
};

export type PettitViewerPermissions = {
  isModerator: boolean;
  canCreatePost: boolean;
  canResetWorld: boolean;
  canResolveCurrentEncounter: boolean;
};

export type PettitViewModel = {
  pettit: {
    name: string;
    nameOrigin: PettitNameOrigin;
    ageDays: number;
    birthdaySummary: string;
    mood: PettitMood;
    traits: PettitTraits;
    topTraits: TraitKey[];
    appearanceDna: PettitAppearanceDna;
    canReceiveCommunityName: boolean;
  };
  communityStats: {
    ageDays: number;
    totalVotes: number;
    encountersCompleted: number;
    memoriesCreated: number;
  };
  inventory: PettitInventoryItem[];
  knownNames: CanonNameRecord[];
  pendingNamingTargets: PendingNamingTarget[];
  activeEncounter: ActiveEncounter & {
    totalVotes: number;
    hasVoted: boolean;
    selectedOptionId: string | null;
  };
  latestJournal: PettitJournalEntry | null;
  recentMemories: PettitMemory[];
  recentAchievements: PettitAchievement[];
  achievementCount: number;
  hallOfMemories: HallOfMemoriesView;
  seasonal: SeasonalProgressView;
  communityContributions: {
    pendingGiftBallot: PendingCommunityGiftBallot | null;
    recentCommunityGifts: RecentCommunityGiftSummary[];
  };
  viewer: PettitViewerPermissions;
};
