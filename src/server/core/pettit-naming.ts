import type {
  CanonNameRecord,
  EncounterTemplate,
  NamingTargetType,
  PendingNamingTarget,
  PettitInventoryItem,
  PettitLandmark,
  PettitNameSubmission,
  PettitState,
  PettitStats,
} from '../../shared/pettit';
import { canonicalizeGiftId, getGiftById } from './pettit-gifts';
import {
  canReceiveCommunityName,
  deriveStarterPettitName,
  PETTIT_NAMING_TARGET_ID,
} from './pettit-identity';

type LandmarkDefinition = {
  id: string;
  baseName: string;
  description: string;
  sourceEncounterTemplateId: string;
  referenceLabel: string;
};

type NamingTarget = {
  targetType: NamingTargetType;
  targetId: string;
  baseName: string;
  description: string;
  discoveredAt: string;
};

export type NamingSubmissionMap = Record<string, PettitNameSubmission[]>;

const NAMING_ENCOUNTER_PREFIX = 'encounter-name:';
const LEGACY_NAMING_QUEST_PREFIX = 'quest-name:';

const LANDMARKS: readonly LandmarkDefinition[] = [
  {
    id: 'mossy-cave',
    baseName: 'Mossy Cave',
    description: 'The little cave behind the moss curtain.',
    sourceEncounterTemplateId: 'encounter-cave',
    referenceLabel: 'the cave',
  },
  {
    id: 'stargazing-hill',
    baseName: 'Stargazing Hill',
    description: 'The quiet hill where Pettit watches the night sky.',
    sourceEncounterTemplateId: 'encounter-stars',
    referenceLabel: 'the hill',
  },
  {
    id: 'traveller-road',
    baseName: 'Traveller Road',
    description: 'The road where strangers and small acts of kindness keep meeting Pettit.',
    sourceEncounterTemplateId: 'encounter-traveller',
    referenceLabel: 'the road',
  },
  {
    id: 'bee-hollow',
    baseName: 'Bee Hollow',
    description: 'A tucked-away hollow where the air hums softly and every flower seems busy.',
    sourceEncounterTemplateId: 'encounter-curiosity-bee-hollow',
    referenceLabel: 'the hollow',
  },
  {
    id: 'sunken-sundial',
    baseName: 'Sunken Sundial',
    description: 'An old sundial half claimed by the earth, still trying to keep time for anyone patient enough to notice.',
    sourceEncounterTemplateId: 'encounter-curiosity-sunken-sundial',
    referenceLabel: 'the sundial',
  },
  {
    id: 'glass-orchard',
    baseName: 'Glass Orchard',
    description: 'A strange little orchard where light catches every branch like it has somewhere important to be.',
    sourceEncounterTemplateId: 'encounter-curiosity-glass-orchard',
    referenceLabel: 'the orchard',
  },
  {
    id: 'silent-aviary',
    baseName: 'Silent Aviary',
    description: 'A hushed aviary where even stillness seems to be listening back.',
    sourceEncounterTemplateId: 'encounter-curiosity-silent-aviary',
    referenceLabel: 'the aviary',
  },
  {
    id: 'shared-supper',
    baseName: 'Shared Supper',
    description: 'The gathering place where the community keeps proving that food can feel like welcome.',
    sourceEncounterTemplateId: 'encounter-trust-host-supper',
    referenceLabel: 'the supper place',
  },
  {
    id: 'community-garden',
    baseName: 'Community Garden',
    description: 'A garden shaped by many small hands and the decision to keep tending together.',
    sourceEncounterTemplateId: 'encounter-trust-tend-community-garden',
    referenceLabel: 'the garden',
  },
  {
    id: 'beekeeper-yard',
    baseName: 'Beekeeper Yard',
    description: 'A warm little yard full of hives, careful work, and the sort of patience Pettit notices right away.',
    sourceEncounterTemplateId: 'encounter-trust-help-the-beekeeper',
    referenceLabel: 'the yard',
  },
  {
    id: 'lantern-lane',
    baseName: 'Lantern Lane',
    description: 'A path that feels safest when walked together, especially after the light starts thinning out.',
    sourceEncounterTemplateId: 'encounter-trust-walk-a-friend-home',
    referenceLabel: 'the lane',
  },
];

const DEV_MULTI_SUBMIT_USERNAME = 'Smokeyninja04';

const isDevMultiSubmitUser = (username: string): boolean =>
  username.trim().toLowerCase() === DEV_MULTI_SUBMIT_USERNAME.toLowerCase();

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

const sortByDiscovery = (left: NamingTarget, right: NamingTarget): number => {
  return Date.parse(left.discoveredAt) - Date.parse(right.discoveredAt);
};

const buildNamingEncounterId = (
  targetType: NamingTargetType,
  targetId: string,
  candidateNames: readonly string[]
): string => {
  const encodedNames = candidateNames.map((candidate) => encodeURIComponent(candidate)).join('~');
  return `${NAMING_ENCOUNTER_PREFIX}${targetType}:${targetId}:${encodedNames}`;
};

const stripNamingPrefix = (templateId: string): string => {
  if (templateId.startsWith(NAMING_ENCOUNTER_PREFIX)) {
    return templateId.slice(NAMING_ENCOUNTER_PREFIX.length);
  }

  if (templateId.startsWith(LEGACY_NAMING_QUEST_PREFIX)) {
    return templateId.slice(LEGACY_NAMING_QUEST_PREFIX.length);
  }

  throw new Error(`Unknown naming encounter template: ${templateId}`);
};

const canonicalizeEncounterTemplateId = (templateId: string): string => {
  if (templateId === 'quest-cave') {
    return 'encounter-cave';
  }

  if (templateId === 'quest-stars') {
    return 'encounter-stars';
  }

  if (templateId === 'quest-traveller') {
    return 'encounter-traveller';
  }

  return templateId;
};

export const buildNamingTargetKey = (targetType: NamingTargetType, targetId: string): string => {
  return `${targetType}:${targetId}`;
};

const parseNamingTargetKey = (targetKey: string): { targetType: NamingTargetType; targetId: string } => {
  const [targetType, ...targetIdParts] = targetKey.split(':');

  if ((targetType !== 'gift' && targetType !== 'landmark' && targetType !== 'pettit') || targetIdParts.length === 0) {
    throw new Error('INVALID_NAMING_TARGET');
  }

  return {
    targetType,
    targetId: targetIdParts.join(':'),
  };
};

const getPettitTarget = (state: PettitState, resolvedEncounterCount: number): NamingTarget | null => {
  if (!canReceiveCommunityName(state, resolvedEncounterCount)) {
    return null;
  }

  return {
    targetType: 'pettit',
    targetId: PETTIT_NAMING_TARGET_ID,
    baseName: state.name,
    description: 'The shared little creature the whole subreddit has been raising together.',
    discoveredAt: state.createdAt,
  };
};

const getLandmarkDefinition = (landmarkId: string): LandmarkDefinition => {
  const landmark = LANDMARKS.find((candidate) => candidate.id === landmarkId);

  if (!landmark) {
    throw new Error(`Unknown landmark: ${landmarkId}`);
  }

  return landmark;
};

const createLandmarkRecord = (landmarkId: string): PettitLandmark => {
  const definition = getLandmarkDefinition(landmarkId);
  return {
    id: definition.id,
    baseName: definition.baseName,
    description: definition.description,
    sourceEncounterTemplateId: definition.sourceEncounterTemplateId,
    discoveredAt: new Date().toISOString(),
  };
};

const getGiftTarget = (inventoryItem: PettitInventoryItem): NamingTarget | null => {
  if (inventoryItem.canonName) {
    return null;
  }

  const gift = getGiftById(inventoryItem.giftId);

  return {
    targetType: 'gift',
    targetId: canonicalizeGiftId(inventoryItem.giftId),
    baseName: gift.name,
    description: gift.description,
    discoveredAt: inventoryItem.obtainedAt,
  };
};

const getLandmarkTarget = (landmark: PettitLandmark): NamingTarget | null => {
  if (landmark.canonName) {
    return null;
  }

  return {
    targetType: 'landmark',
    targetId: landmark.id,
    baseName: landmark.baseName,
    description: landmark.description,
    discoveredAt: landmark.discoveredAt,
  };
};

const getNamingTarget = (
  state: PettitState,
  targetType: NamingTargetType,
  targetId: string,
  resolvedEncounterCount: number
): NamingTarget | null => {
  if (targetType === 'pettit') {
    return targetId === PETTIT_NAMING_TARGET_ID ? getPettitTarget(state, resolvedEncounterCount) : null;
  }

  if (targetType === 'gift') {
    const canonicalTargetId = canonicalizeGiftId(targetId);
    const item = state.inventory.find(
      (candidate) => canonicalizeGiftId(candidate.giftId) === canonicalTargetId && !candidate.canonName
    );
    return item ? getGiftTarget(item) : null;
  }

  const landmark = state.landmarks.find((candidate) => candidate.id === targetId);
  return landmark ? getLandmarkTarget(landmark) : null;
};

export const getPendingNamingTargets = (
  state: PettitState,
  submissionMap: NamingSubmissionMap,
  resolvedEncounterCount: number
): PendingNamingTarget[] => {
  const targets = [
    getPettitTarget(state, resolvedEncounterCount),
    ...state.inventory.map((item) => getGiftTarget(item)).filter((target): target is NamingTarget => target !== null),
    ...state.landmarks.map((landmark) => getLandmarkTarget(landmark)).filter((target): target is NamingTarget => target !== null),
  ]
    .filter((target): target is NamingTarget => target !== null)
    .sort(sortByDiscovery);

  return targets.map((target) => ({
    targetType: target.targetType,
    targetId: target.targetId,
    baseName: target.baseName,
    description: target.description,
    submissionCount: submissionMap[buildNamingTargetKey(target.targetType, target.targetId)]?.length ?? 0,
  }));
};

export const getCanonNames = (state: PettitState): CanonNameRecord[] => {
  const inventoryNames: CanonNameRecord[] = state.inventory
    .filter((item) => Boolean(item.canonName))
    .map((item) => ({
      targetType: 'gift',
      targetId: canonicalizeGiftId(item.giftId),
      baseName: getGiftById(item.giftId).name,
      canonName: item.canonName ?? item.name,
      description: getGiftById(item.giftId).description,
    }));

  const landmarkNames: CanonNameRecord[] = state.landmarks
    .filter((landmark) => Boolean(landmark.canonName))
    .map((landmark) => ({
      targetType: 'landmark',
      targetId: landmark.id,
      baseName: landmark.baseName,
      canonName: landmark.canonName ?? landmark.baseName,
      description: landmark.description,
    }));

  const pettitName =
    state.nameOrigin === 'community' && state.pettitNamingFinalizedAt
      ? [
          {
            targetType: 'pettit' as const,
            targetId: PETTIT_NAMING_TARGET_ID,
            baseName: deriveStarterPettitName(state.id.replace(/^pettit-/, '')),
            canonName: state.name,
            description: 'The permanent community-chosen name for this subreddit’s Pettit.',
          },
        ]
      : [];

  return [...pettitName, ...landmarkNames, ...inventoryNames];
};

export const discoverLandmark = (state: PettitState, landmarkId: string | undefined): PettitState => {
  if (!landmarkId) {
    return state;
  }

  const exists = state.landmarks.some((landmark) => landmark.id === landmarkId);

  if (exists) {
    return state;
  }

  return {
    ...state,
    landmarks: [...state.landmarks, createLandmarkRecord(landmarkId)],
  };
};

export const isNamingEncounterTemplateId = (templateId: string): boolean => {
  return templateId.startsWith(NAMING_ENCOUNTER_PREFIX) || templateId.startsWith(LEGACY_NAMING_QUEST_PREFIX);
};

export const buildNamingEncounterTemplate = (
  targetType: NamingTargetType,
  targetId: string,
  candidateNames: readonly string[],
  baseNameOverride?: string
): EncounterTemplate => {
  const target =
    targetType === 'gift'
      ? (() => {
          const gift = getGiftById(targetId);
          return {
            targetType: 'gift' as const,
            targetId,
            baseName: gift.name,
            description: gift.description,
            discoveredAt: '',
          };
        })()
      : (() => {
          if (targetType === 'pettit') {
            return {
              targetType: 'pettit' as const,
              targetId,
              baseName: 'Pettit',
              description: 'The shared creature the community is raising together.',
              discoveredAt: '',
            };
          }

          const landmark = getLandmarkDefinition(targetId);
          return {
            targetType: 'landmark' as const,
            targetId,
            baseName: landmark.baseName,
            description: landmark.description,
            discoveredAt: '',
          };
        })();

  const displayBaseName = baseNameOverride ?? target.baseName;
  const title = `Choose A Name For ${displayBaseName}`;
  const description =
    targetType === 'gift'
      ? "The community has adopted this keepsake. Which name should become part of Pettit's world?"
      : targetType === 'pettit'
        ? 'The community has raised this creature together. Which name should become part of its permanent story?'
      : "This place has become part of Pettit's story. Which name should the community make canon?";

  return {
    id: buildNamingEncounterId(targetType, targetId, candidateNames),
    title,
    description,
    affinity: 'community',
    options: candidateNames.map((candidateName, index) => ({
      id: `name-${index + 1}`,
      label: candidateName,
    })),
    outcomes: candidateNames.map((candidateName, index) => ({
      optionId: `name-${index + 1}`,
      resultText:
        targetType === 'gift'
          ? `The community decided that ${target.baseName.toLowerCase()} should be known as "${candidateName}" from now on.`
          : targetType === 'pettit'
            ? `The community chose "${candidateName}" as the name this Pettit will carry from now on.`
          : `The community chose to call this place "${candidateName}", and the name settled into Pettit's world immediately.`,
      memoryTitle:
        targetType === 'gift'
          ? `Named ${target.baseName} "${candidateName}"`
          : targetType === 'pettit'
            ? `Named Pettit "${candidateName}"`
            : `Named ${candidateName}`,
      memoryDescription:
        targetType === 'gift'
          ? `The community gave Pettit's ${target.baseName.toLowerCase()} a permanent name: "${candidateName}".`
          : targetType === 'pettit'
            ? `The community chose "${candidateName}" as Pettit's permanent canon name.`
          : `The community turned ${target.baseName.toLowerCase()} into a remembered place called "${candidateName}".`,
      memoryType: 'community',
      importance: 4,
      mood: 'excited',
      traitEffects: {},
      namingTarget: {
        type: targetType,
        targetId,
        canonName: candidateName,
      },
    })),
  };
};

export const getNamingEncounterTemplateById = (templateId: string): EncounterTemplate => {
  if (!isNamingEncounterTemplateId(templateId)) {
    throw new Error(`Unknown naming encounter template: ${templateId}`);
  }

  const encoded = stripNamingPrefix(templateId);
  const [targetTypeValue, targetId, encodedNames] = encoded.split(':');

  if ((targetTypeValue !== 'gift' && targetTypeValue !== 'landmark' && targetTypeValue !== 'pettit') || !targetId || !encodedNames) {
    throw new Error(`Malformed naming encounter template: ${templateId}`);
  }

  const candidateNames = encodedNames
    .split('~')
    .filter(Boolean)
    .map((candidate) => decodeURIComponent(candidate));

  return buildNamingEncounterTemplate(targetTypeValue, targetId, candidateNames);
};

export const selectReadyNamingEncounterTemplate = (
  state: PettitState,
  submissionMap: NamingSubmissionMap,
  resolvedEncounterCount: number
): EncounterTemplate | null => {
  const pendingTargets = getPendingNamingTargets(state, submissionMap, resolvedEncounterCount)
    .filter((target) => target.submissionCount >= 3)
    .sort((left, right) => {
      const leftTarget = getNamingTarget(state, left.targetType, left.targetId, resolvedEncounterCount);
      const rightTarget = getNamingTarget(state, right.targetType, right.targetId, resolvedEncounterCount);

      if (!leftTarget || !rightTarget) {
        return 0;
      }

      return sortByDiscovery(leftTarget, rightTarget);
    });

  const nextTarget = pendingTargets[0];

  if (!nextTarget) {
    return null;
  }

  const targetKey = buildNamingTargetKey(nextTarget.targetType, nextTarget.targetId);
  const candidateNames = (submissionMap[targetKey] ?? []).slice(0, 3).map((submission) => submission.proposedName);
  return buildNamingEncounterTemplate(nextTarget.targetType, nextTarget.targetId, candidateNames, nextTarget.baseName);
};

export const submitNameForTarget = (
  state: PettitState,
  stats: PettitStats,
  submissionMap: NamingSubmissionMap,
  username: string,
  targetKey: string,
  proposedName: string
): NamingSubmissionMap => {
  const { targetType, targetId } = parseNamingTargetKey(targetKey);
  const target = getNamingTarget(state, targetType, targetId, stats.resolvedEncounterCount);

  if (!target) {
    throw new Error('INVALID_NAMING_TARGET');
  }

  const normalizedName = normalizeName(proposedName);

  if (!normalizedName) {
    throw new Error('INVALID_NAME');
  }

  if (normalizedName.length > 32) {
    throw new Error('NAME_TOO_LONG');
  }

  const submissions = submissionMap[targetKey] ?? [];

  // TODO: Remove this submission-testing override after multi-user naming flow has been playtested on Reddit.
  const allowRepeatSubmissionsForUser = isDevMultiSubmitUser(username);

  if (!allowRepeatSubmissionsForUser && submissions.some((submission) => submission.username === username)) {
    throw new Error('DUPLICATE_NAME_SUBMISSION');
  }

  if (submissions.some((submission) => submission.proposedName.toLowerCase() === normalizedName.toLowerCase())) {
    throw new Error('DUPLICATE_NAME');
  }

  if (submissions.length >= 3) {
    throw new Error('NAME_BALLOT_FULL');
  }

  return {
    ...submissionMap,
    [targetKey]: [
      ...submissions,
      {
        username,
        proposedName: normalizedName,
        submittedAt: new Date().toISOString(),
      },
    ],
  };
};

export const applyCanonName = (
  state: PettitState,
  targetType: NamingTargetType,
  targetId: string,
  canonName: string
): PettitState => {
  if (targetType === 'pettit') {
    return {
      ...state,
      name: canonName,
      nameOrigin: 'community',
      pettitNamingFinalizedAt: new Date().toISOString(),
    };
  }

  if (targetType === 'gift') {
    return {
      ...state,
      inventory: state.inventory.map((item) =>
        canonicalizeGiftId(item.giftId) === canonicalizeGiftId(targetId) && !item.canonName
          ? {
              ...item,
              canonName,
            }
          : item
      ),
    };
  }

  return {
    ...state,
    landmarks: state.landmarks.map((landmark) =>
      landmark.id === targetId
        ? {
            ...landmark,
            canonName,
          }
        : landmark
    ),
  };
};

export const clearNamingTargetSubmissions = (
  submissionMap: NamingSubmissionMap,
  targetType: NamingTargetType,
  targetId: string
): NamingSubmissionMap => {
  const nextSubmissionMap = { ...submissionMap };
  delete nextSubmissionMap[buildNamingTargetKey(targetType, targetId)];
  return nextSubmissionMap;
};

export const formatGiftDisplayName = (item: PettitInventoryItem): string => item.canonName ?? item.name;

export const getLandmarkReference = (state: PettitState, landmarkId: string): string | null => {
  const landmark = state.landmarks.find((candidate) => candidate.id === landmarkId);

  if (!landmark?.canonName) {
    return null;
  }

  return landmark.canonName;
};

export const personalizeEncounterText = (
  state: PettitState,
  templateId: string,
  value: string
): string => {
  const canonicalTemplateId = canonicalizeEncounterTemplateId(templateId);

  if (canonicalTemplateId === 'encounter-cave') {
    const canonName = getLandmarkReference(state, 'mossy-cave');
    return canonName ? value.replaceAll('the cave', canonName).replaceAll('a cave', canonName) : value;
  }

  if (canonicalTemplateId === 'encounter-stars') {
    const canonName = getLandmarkReference(state, 'stargazing-hill');
    return canonName ? `${value} From ${canonName}, everything felt a little closer.` : value;
  }

  if (canonicalTemplateId === 'encounter-traveller') {
    const canonName = getLandmarkReference(state, 'traveller-road');
    return canonName ? `${value} It happened along ${canonName}.` : value;
  }

  return value;
};

export const getPendingNamingTargetOptions = (
  state: PettitState,
  submissionMap: NamingSubmissionMap,
  resolvedEncounterCount: number
): Array<{ label: string; value: string }> => {
  return getPendingNamingTargets(state, submissionMap, resolvedEncounterCount).map((target) => ({
    label: `${target.baseName} (${target.submissionCount}/3)`,
    value: buildNamingTargetKey(target.targetType, target.targetId),
  }));
};
