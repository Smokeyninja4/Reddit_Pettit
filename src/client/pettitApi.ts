import type {
  ErrorResponse,
  GetMemoriesResponse,
  GetPettitStateResponse,
  ResolveVoteResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
} from '../shared/api';

const readJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T | ErrorResponse;

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new Error(error.message);
  }

  return data as T;
};

export const fetchPettitState = async (): Promise<GetPettitStateResponse> => {
  const response = await fetch('/api/state');
  return readJson<GetPettitStateResponse>(response);
};

export const fetchPettitMemories = async (): Promise<GetMemoriesResponse> => {
  const response = await fetch('/api/memories');
  return readJson<GetMemoriesResponse>(response);
};

export const submitPettitVote = async (
  payload: SubmitVoteRequest
): Promise<SubmitVoteResponse> => {
  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJson<SubmitVoteResponse>(response);
};

export const resolvePettitVote = async (): Promise<ResolveVoteResponse> => {
  const response = await fetch('/api/resolve', {
    method: 'POST',
  });

  return readJson<ResolveVoteResponse>(response);
};
