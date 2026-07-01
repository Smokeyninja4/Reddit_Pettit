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

export type NamingTargetType = 'gift' | 'landmark';

export type AchievementCategory = 'growth' | 'community' | 'exploration' | 'memory' | 'funny';

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
  createdAt: string;
  ageDays: number;
  mood: PettitMood;
  traits: PettitTraits;
  inventory: PettitInventoryItem[];
  landmarks: PettitLandmark[];
  activeEncounterId: string;
  latestJournalId: string | null;
  dailyCycle: PettitDailyCycle;
};

export type PettitStats = {
  totalVotes: number;
  journalCount: number;
  memoryCount: number;
  resolvedEncounterCount: number;
  achievements: PettitAchievement[];
};

export type PettitViewModel = {
  pettit: {
    name: string;
    ageDays: number;
    mood: PettitMood;
    traits: PettitTraits;
    topTraits: TraitKey[];
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
};
