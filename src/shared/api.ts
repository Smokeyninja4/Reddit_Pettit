import type {
  HallOfMemoriesDetailView,
  PendingNamingTarget,
  PettitAchievement,
  PettitViewModel,
  TraitKey,
} from './pettit';

export type GetPettitStateResponse = {
  type: 'state';
  state: PettitViewModel;
};

export type GetMemoriesResponse = {
  type: 'memories';
  hallOfMemories: HallOfMemoriesDetailView;
};

export type SubmitVoteRequest = {
  optionId: string;
};

export type SubmitVoteResponse = {
  type: 'vote-recorded';
  state: PettitViewModel;
};

export type SubmitNameRequest = {
  targetKey: string;
  proposedName: string;
};

export type SubmitNameResponse = {
  type: 'name-submitted';
  pendingNamingTargets: PendingNamingTarget[];
  message: string;
};

export type ResolveVoteResponse = {
  type: 'vote-resolved';
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

export type ErrorResponse = {
  status: 'error';
  message: string;
};
