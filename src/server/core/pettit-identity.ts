import type {
  PettitAppearanceDna,
  PettitNameOrigin,
  PettitState,
} from '../../shared/pettit';

export const PETTIT_NAMING_TARGET_ID = 'pettit-self';

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
});

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const stringToSeed = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const pickFromList = <T>(items: readonly T[], seed: number): T => {
  const index = Math.abs(seed) % items.length;
  return items[index] ?? items[0]!;
};

const normalizeSubredditTokens = (subredditName: string): string[] => {
  return subredditName
    .split(/[_-]+/)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 2);
};

export const deriveStarterPettitName = (subredditName: string): string => {
  const tokens = normalizeSubredditTokens(subredditName).map((part) => titleCase(part));

  if (tokens.length === 0) {
    return 'Pettit';
  }

  return `${tokens.join(' ')} Pettit`;
};

export const inferPettitNameOrigin = (name: string, subredditName: string): PettitNameOrigin => {
  return name === deriveStarterPettitName(subredditName) || name === 'Pettit' ? 'subreddit' : 'community';
};

export const createAppearanceDna = (subredditName: string): PettitAppearanceDna => {
  const seed = stringToSeed(subredditName);
  const palettes = ['sunrise', 'meadow', 'berry', 'twilight', 'moss'] as const;
  const earStyles = ['round', 'leaf', 'tilt'] as const;
  const eyeStyles = ['dot', 'oval', 'sleepy'] as const;
  const blushStyles = ['round', 'soft', 'none'] as const;
  const sparkStyles = ['orb', 'leaf', 'star'] as const;
  const accentPatterns = ['plain', 'patch', 'speck', 'band'] as const;

  return {
    seedVersion: 1,
    paletteKey: pickFromList(palettes, seed),
    bodyWidthScale: 0.88 + ((seed >> 3) % 25) / 100,
    bodyHeightScale: 0.9 + ((seed >> 7) % 22) / 100,
    earStyle: pickFromList(earStyles, seed >> 5),
    eyeStyle: pickFromList(eyeStyles, seed >> 9),
    eyeSpacing: 0.88 + ((seed >> 11) % 20) / 100,
    blushStyle: pickFromList(blushStyles, seed >> 13),
    sparkStyle: pickFromList(sparkStyles, seed >> 17),
    accentPattern: pickFromList(accentPatterns, seed >> 19),
  };
};

export const getPettitBirthdayMonthDay = (createdAt: string): { month: number; day: number } => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return { month: 7, day: 1 };
  }

  return {
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

export const getPettitBirthdaySummary = (createdAt: string): string => {
  const { month, day } = getPettitBirthdayMonthDay(createdAt);
  const date = new Date(Date.UTC(2000, month - 1, day));
  return `Born ${MONTH_FORMATTER.format(date)} ${day}`;
};

export const canReceiveCommunityName = (
  state: Pick<PettitState, 'pettitNamingFinalizedAt'>,
  resolvedEncounterCount: number
): boolean => {
  return state.pettitNamingFinalizedAt === null && resolvedEncounterCount >= 1;
};

export const getPossessiveName = (name: string): string => {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
};

export const personalizePettitText = (state: Pick<PettitState, 'name'>, value: string): string => {
  if (state.name === 'Pettit') {
    return value;
  }

  return value
    .replace(/\bPettit's\b(?! Day)/g, getPossessiveName(state.name))
    .replace(/\bPettit\b(?! Day)/g, state.name);
};
