import type {
  EncounterTemplate,
  GiftCategory,
  PettitGiftIdeaSubmission,
  PettitInventoryItem,
  PettitState,
  PendingCommunityGiftBallot,
  RecentCommunityGiftSummary,
  TraitKey,
} from '../../shared/pettit';
import {
  buildCommunityGiftDefinition,
  buildGiftEncounterTemplate,
  canonicalizeGiftId,
  getGiftById,
  inferGiftId,
  isCommunityGiftId,
} from './pettit-gifts';

export type GiftIdeaSubmissionList = PettitGiftIdeaSubmission[];

const COMMUNITY_GIFT_ENCOUNTER_PREFIX = 'encounter-community-gift:';
const MAX_GIFT_NAME_LENGTH = 32;
const MAX_GIFT_DESCRIPTION_LENGTH = 120;
const MAX_BALLOT_SIZE = 3;

const normalizeValue = (value: string): string => value.trim().replace(/\s+/g, ' ');

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'gift';

const encodePayload = (value: string): string =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const decodePayload = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

const getCategoryTraitEffects = (category: GiftCategory): Partial<Record<TraitKey, number>> => {
  switch (category) {
    case 'books':
      return { curiosity: 1, trust: 1 };
    case 'clothing':
      return { trust: 1 };
    case 'tools':
      return { courage: 1, curiosity: 1 };
    case 'toys':
      return { curiosity: 1, chaos: 1 };
    case 'community':
      return { trust: 1, courage: 1 };
    case 'funny':
      return { chaos: 1 };
    default:
      return {};
  }
};

const getCategoryMoodLine = (name: string, category: GiftCategory): string => {
  switch (category) {
    case 'books':
      return `Pettit opened ${name.toLowerCase()} with the careful excitement it usually saves for new questions.`;
    case 'clothing':
      return `Pettit tried on ${name.toLowerCase()} right away and somehow looked even more delighted once it fit.`;
    case 'tools':
      return `Pettit turned ${name.toLowerCase()} over in its paws like it was already imagining where it might be useful.`;
    case 'toys':
      return `Pettit lit up at the sight of ${name.toLowerCase()} and immediately started inventing reasons to play with it.`;
    case 'community':
      return `Pettit held ${name.toLowerCase()} very gently, as though it could already feel the care that made it.`;
    case 'funny':
      return `Pettit stared at ${name.toLowerCase()} for one beat, then gave in to the silliness of it completely.`;
    default:
      return `Pettit welcomed ${name.toLowerCase()} with a bright little burst of curiosity.`;
  }
};

const getCommunityGiftNameSet = (state: PettitState, submissions: GiftIdeaSubmissionList): Set<string> => {
  const names = new Set<string>();

  state.inventory.forEach((item) => {
    names.add(item.name.trim().toLowerCase());

    if (item.canonName) {
      names.add(item.canonName.trim().toLowerCase());
    }
  });

  submissions.forEach((submission) => {
    names.add(submission.name.trim().toLowerCase());
  });

  return names;
};

export const isCommunityGiftEncounterTemplateId = (templateId: string): boolean =>
  templateId.startsWith(COMMUNITY_GIFT_ENCOUNTER_PREFIX);

export const buildCommunityGiftEncounterTemplate = (
  submissions: readonly PettitGiftIdeaSubmission[]
): EncounterTemplate => {
  const communityGiftIds = submissions.map((submission) => createCommunityGiftDefinition(submission).id);
  const encodedIds = communityGiftIds.map((giftId) => encodePayload(giftId)).join('~');

  return {
    ...buildGiftEncounterTemplate(communityGiftIds),
    id: `${COMMUNITY_GIFT_ENCOUNTER_PREFIX}${encodedIds}`,
    title: 'Choose A Community Gift Idea',
    description: 'The community has proposed new keepsakes for Pettit. Which one should become real next?',
  };
};

export const getCommunityGiftEncounterTemplateById = (templateId: string): EncounterTemplate => {
  if (!isCommunityGiftEncounterTemplateId(templateId)) {
    throw new Error(`Unknown community gift encounter template: ${templateId}`);
  }

  const encoded = templateId.slice(COMMUNITY_GIFT_ENCOUNTER_PREFIX.length);
  const giftIds = encoded.split('~').filter(Boolean).map((giftId) => decodePayload(giftId));

  if (giftIds.length === 0) {
    throw new Error(`Malformed community gift encounter template: ${templateId}`);
  }

  return {
    ...buildGiftEncounterTemplate(giftIds),
    id: templateId,
    title: 'Choose A Community Gift Idea',
    description: 'The community has proposed new keepsakes for Pettit. Which one should become real next?',
  };
};

export const buildPendingCommunityGiftBallot = (
  submissions: GiftIdeaSubmissionList
): PendingCommunityGiftBallot | null => {
  if (submissions.length === 0) {
    return null;
  }

  return {
    submissionCount: submissions.length,
    isReady: submissions.length >= MAX_BALLOT_SIZE,
    submissions: submissions.slice(0, MAX_BALLOT_SIZE).map((submission) => ({
      name: submission.name,
      category: submission.category,
    })),
  };
};

export const getRecentCommunityGiftSummaries = (
  inventory: PettitInventoryItem[]
): RecentCommunityGiftSummary[] =>
  inventory
    .filter((item) => isCommunityGiftId(item.giftId) || item.source === 'Community Contribution')
    .slice(-3)
    .reverse()
    .map((item) => ({
      name: item.canonName ?? item.name,
      category: item.category,
      obtainedAt: item.obtainedAt,
    }));

export const selectReadyCommunityGiftEncounterTemplate = (
  submissions: GiftIdeaSubmissionList
): EncounterTemplate | null => {
  if (submissions.length < MAX_BALLOT_SIZE) {
    return null;
  }

  return buildCommunityGiftEncounterTemplate(submissions.slice(0, MAX_BALLOT_SIZE));
};

export const submitGiftIdea = (
  state: PettitState,
  submissions: GiftIdeaSubmissionList,
  username: string,
  name: string,
  description: string,
  category: GiftCategory
): GiftIdeaSubmissionList => {
  const normalizedName = normalizeValue(name);
  const normalizedDescription = normalizeValue(description);

  if (!normalizedName || !normalizedDescription) {
    throw new Error('INVALID_GIFT_IDEA');
  }

  if (normalizedName.length > MAX_GIFT_NAME_LENGTH) {
    throw new Error('GIFT_NAME_TOO_LONG');
  }

  if (normalizedDescription.length > MAX_GIFT_DESCRIPTION_LENGTH) {
    throw new Error('GIFT_DESCRIPTION_TOO_LONG');
  }

  if (submissions.length >= MAX_BALLOT_SIZE) {
    throw new Error('GIFT_BALLOT_FULL');
  }

  if (submissions.some((submission) => submission.username === username)) {
    throw new Error('DUPLICATE_GIFT_SUBMISSION');
  }

  const normalizedNameKey = normalizedName.toLowerCase();

  if (submissions.some((submission) => submission.name.toLowerCase() === normalizedNameKey)) {
    throw new Error('DUPLICATE_GIFT_NAME');
  }

  if (inferGiftId(normalizedName) !== null) {
    throw new Error('KNOWN_GIFT_NAME');
  }

  const existingNames = getCommunityGiftNameSet(state, submissions);

  if (existingNames.has(normalizedNameKey)) {
    throw new Error('KNOWN_GIFT_NAME');
  }

  return [
    ...submissions,
    {
      username,
      name: normalizedName,
      description: normalizedDescription,
      category,
      submittedAt: new Date().toISOString(),
    },
  ];
};

export const clearGiftIdeaSubmissions = (): GiftIdeaSubmissionList => [];

export const createCommunityGiftDefinition = (submission: PettitGiftIdeaSubmission) =>
  buildCommunityGiftDefinition({
    name: submission.name,
    description: submission.description,
    category: submission.category,
    moodLine: getCategoryMoodLine(submission.name, submission.category),
    traitEffects: getCategoryTraitEffects(submission.category),
  });

export const getCommunityGiftDisplayLabel = (submission: PettitGiftIdeaSubmission): string =>
  `${submission.name} (${submission.category})`;

export const getCommunityGiftCanonicalId = (item: PettitInventoryItem): string =>
  isCommunityGiftId(item.giftId) ? item.giftId : canonicalizeGiftId(item.giftId);

export const getCommunityGiftDefinitionFromInventory = (item: PettitInventoryItem) =>
  isCommunityGiftId(item.giftId)
    ? getGiftById(item.giftId)
    : buildCommunityGiftDefinition({
        name: item.name,
        description: item.description,
        category: item.category,
        moodLine: getCategoryMoodLine(item.name, item.category),
        traitEffects: getCategoryTraitEffects(item.category),
      });

export const slugifyCommunityGiftName = (value: string): string => slugify(value);
