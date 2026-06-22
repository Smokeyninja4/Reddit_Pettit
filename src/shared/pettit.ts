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

export type QuestCategory = 'explore' | 'learn' | 'social' | 'community';

export type GiftCategory = 'clothing' | 'tools' | 'toys' | 'books' | 'community' | 'funny';

export type NamingTargetType = 'gift' | 'landmark';

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
  sourceQuestTemplateId: string;
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

export type QuestOption = {
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
  relatedQuestId: string;
};

export type QuestOptionOutcome = {
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

export type QuestTemplate = {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  options: ReadonlyArray<{
    id: string;
    label: string;
  }>;
  outcomes: ReadonlyArray<QuestOptionOutcome>;
};

export type ActiveQuest = {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: QuestCategory;
  createdAt: string;
  options: QuestOption[];
};

export type QuestVoteSummary = {
  totalVotes: number;
  winningOptionId: string | null;
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
  activeQuestId: string;
  latestJournalId: string | null;
};

export type PettitStats = {
  totalVotes: number;
  journalCount: number;
  memoryCount: number;
  resolvedQuestCount: number;
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
    questsCompleted: number;
    memoriesCreated: number;
  };
  inventory: PettitInventoryItem[];
  knownNames: CanonNameRecord[];
  pendingNamingTargets: PendingNamingTarget[];
  activeQuest: ActiveQuest & {
    totalVotes: number;
    hasVoted: boolean;
    selectedOptionId: string | null;
  };
  latestJournal: PettitJournalEntry | null;
  recentMemories: PettitMemory[];
};
