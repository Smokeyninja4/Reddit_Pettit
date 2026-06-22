import type { PettitViewModel, TraitKey } from './pettit';

export type GetPettitStateResponse = {
  type: 'state';
  state: PettitViewModel;
};

export type SubmitVoteRequest = {
  optionId: string;
};

export type SubmitVoteResponse = {
  type: 'vote-recorded';
  state: PettitViewModel;
};

export type ResolveVoteResponse = {
  type: 'vote-resolved';
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

export type ErrorResponse = {
  status: 'error';
  message: string;
};
