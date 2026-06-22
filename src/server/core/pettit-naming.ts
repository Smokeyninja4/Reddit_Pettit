import type {
  CanonNameRecord,
  NamingTargetType,
  PendingNamingTarget,
  PettitInventoryItem,
  PettitLandmark,
  PettitNameSubmission,
  PettitState,
  QuestTemplate,
} from '../../shared/pettit';
import { getGiftById } from './pettit-gifts';

type LandmarkDefinition = {
  id: string;
  baseName: string;
  description: string;
  sourceQuestTemplateId: string;
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

const NAMING_QUEST_PREFIX = 'quest-name:';

const LANDMARKS: readonly LandmarkDefinition[] = [
  {
    id: 'mossy-cave',
    baseName: 'Mossy Cave',
    description: 'The little cave behind the moss curtain.',
    sourceQuestTemplateId: 'quest-cave',
    referenceLabel: 'the cave',
  },
  {
    id: 'stargazing-hill',
    baseName: 'Stargazing Hill',
    description: 'The quiet hill where Pettit watches the night sky.',
    sourceQuestTemplateId: 'quest-stars',
    referenceLabel: 'the hill',
  },
  {
    id: 'traveller-road',
    baseName: 'Traveller Road',
    description: 'The road where strangers and small acts of kindness keep meeting Pettit.',
    sourceQuestTemplateId: 'quest-traveller',
    referenceLabel: 'the road',
  },
];

const DEV_MULTI_SUBMIT_USERNAME = 'Smokeyninja04';

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

const sortByDiscovery = (left: NamingTarget, right: NamingTarget): number => {
  return Date.parse(left.discoveredAt) - Date.parse(right.discoveredAt);
};

const buildNamingQuestId = (
  targetType: NamingTargetType,
  targetId: string,
  candidateNames: readonly string[]
): string => {
  const encodedNames = candidateNames.map((candidate) => encodeURIComponent(candidate)).join('~');
  return `${NAMING_QUEST_PREFIX}${targetType}:${targetId}:${encodedNames}`;
};

export const buildNamingTargetKey = (targetType: NamingTargetType, targetId: string): string => {
  return `${targetType}:${targetId}`;
};

const parseNamingTargetKey = (targetKey: string): { targetType: NamingTargetType; targetId: string } => {
  const [targetType, ...targetIdParts] = targetKey.split(':');

  if ((targetType !== 'gift' && targetType !== 'landmark') || targetIdParts.length === 0) {
    throw new Error('INVALID_NAMING_TARGET');
  }

  return {
    targetType,
    targetId: targetIdParts.join(':'),
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
    sourceQuestTemplateId: definition.sourceQuestTemplateId,
    discoveredAt: new Date().toISOString(),
  };
};

const getGiftTarget = (inventoryItem: PettitInventoryItem): NamingTarget | null => {
  if (inventoryItem.canonName) {
    return null;
  }

  return {
    targetType: 'gift',
    targetId: inventoryItem.giftId,
    baseName: inventoryItem.name,
    description: inventoryItem.description,
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

const getNamingTarget = (state: PettitState, targetType: NamingTargetType, targetId: string): NamingTarget | null => {
  if (targetType === 'gift') {
    const item = state.inventory.find((candidate) => candidate.giftId === targetId && !candidate.canonName);
    return item ? getGiftTarget(item) : null;
  }

  const landmark = state.landmarks.find((candidate) => candidate.id === targetId);
  return landmark ? getLandmarkTarget(landmark) : null;
};

export const getPendingNamingTargets = (
  state: PettitState,
  submissionMap: NamingSubmissionMap
): PendingNamingTarget[] => {
  const targets = [
    ...state.inventory.map((item) => getGiftTarget(item)).filter((target): target is NamingTarget => target !== null),
    ...state.landmarks.map((landmark) => getLandmarkTarget(landmark)).filter((target): target is NamingTarget => target !== null),
  ].sort(sortByDiscovery);

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
      targetId: item.giftId,
      baseName: item.name,
      canonName: item.canonName ?? item.name,
      description: item.description,
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

  return [...landmarkNames, ...inventoryNames];
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

export const isNamingQuestTemplateId = (templateId: string): boolean => templateId.startsWith(NAMING_QUEST_PREFIX);

export const buildNamingQuestTemplate = (
  targetType: NamingTargetType,
  targetId: string,
  candidateNames: readonly string[]
): QuestTemplate => {
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
          const landmark = getLandmarkDefinition(targetId);
          return {
            targetType: 'landmark' as const,
            targetId,
            baseName: landmark.baseName,
            description: landmark.description,
            discoveredAt: '',
          };
        })();

  const targetLabel = targetType === 'gift' ? target.baseName : `${target.baseName}`;
  const title = targetType === 'gift' ? `Choose A Name For ${targetLabel}` : `Choose A Name For ${targetLabel}`;
  const description =
    targetType === 'gift'
      ? `The community has adopted this keepsake. Which name should become part of Pettit's world?`
      : `This place has become part of Pettit's story. Which name should the community make canon?`;

  return {
    id: buildNamingQuestId(targetType, targetId, candidateNames),
    title,
    description,
    category: 'community',
    options: candidateNames.map((candidateName, index) => ({
      id: `name-${index + 1}`,
      label: candidateName,
    })),
    outcomes: candidateNames.map((candidateName, index) => ({
      optionId: `name-${index + 1}`,
      resultText:
        targetType === 'gift'
          ? `The community decided that ${target.baseName.toLowerCase()} should be known as "${candidateName}" from now on.`
          : `The community chose to call this place "${candidateName}", and the name settled into Pettit's world immediately.`,
      memoryTitle:
        targetType === 'gift' ? `Named ${target.baseName} "${candidateName}"` : `Named ${candidateName}`,
      memoryDescription:
        targetType === 'gift'
          ? `The community gave Pettit's ${target.baseName.toLowerCase()} a permanent name: "${candidateName}".`
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

export const getNamingQuestTemplateById = (templateId: string): QuestTemplate => {
  if (!isNamingQuestTemplateId(templateId)) {
    throw new Error(`Unknown naming quest template: ${templateId}`);
  }

  const encoded = templateId.slice(NAMING_QUEST_PREFIX.length);
  const [targetTypeValue, targetId, encodedNames] = encoded.split(':');

  if (
    (targetTypeValue !== 'gift' && targetTypeValue !== 'landmark') ||
    !targetId ||
    !encodedNames
  ) {
    throw new Error(`Malformed naming quest template: ${templateId}`);
  }

  const candidateNames = encodedNames
    .split('~')
    .filter(Boolean)
    .map((candidate) => decodeURIComponent(candidate));

  return buildNamingQuestTemplate(targetTypeValue, targetId, candidateNames);
};

export const selectReadyNamingQuestTemplate = (
  state: PettitState,
  submissionMap: NamingSubmissionMap
): QuestTemplate | null => {
  const pendingTargets = getPendingNamingTargets(state, submissionMap)
    .filter((target) => target.submissionCount >= 3)
    .sort((left, right) => {
      const leftTarget = getNamingTarget(state, left.targetType, left.targetId);
      const rightTarget = getNamingTarget(state, right.targetType, right.targetId);

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
  return buildNamingQuestTemplate(nextTarget.targetType, nextTarget.targetId, candidateNames);
};

export const submitNameForTarget = (
  state: PettitState,
  submissionMap: NamingSubmissionMap,
  username: string,
  targetKey: string,
  proposedName: string
): NamingSubmissionMap => {
  const { targetType, targetId } = parseNamingTargetKey(targetKey);
  const target = getNamingTarget(state, targetType, targetId);

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

  // TODO: Remove this development override after multi-user naming flow has been playtested on Reddit.
  const allowRepeatSubmissionsForUser = username === DEV_MULTI_SUBMIT_USERNAME;

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
  if (targetType === 'gift') {
    return {
      ...state,
      inventory: state.inventory.map((item) =>
        item.giftId === targetId && !item.canonName
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

export const personalizeQuestText = (
  state: PettitState,
  templateId: string,
  value: string
): string => {
  if (templateId === 'quest-cave') {
    const canonName = getLandmarkReference(state, 'mossy-cave');
    return canonName ? value.replaceAll('the cave', canonName).replaceAll('a cave', canonName) : value;
  }

  if (templateId === 'quest-stars') {
    const canonName = getLandmarkReference(state, 'stargazing-hill');
    return canonName ? `${value} From ${canonName}, everything felt a little closer.` : value;
  }

  if (templateId === 'quest-traveller') {
    const canonName = getLandmarkReference(state, 'traveller-road');
    return canonName ? `${value} It happened along ${canonName}.` : value;
  }

  return value;
};

export const getPendingNamingTargetOptions = (
  state: PettitState,
  submissionMap: NamingSubmissionMap
): Array<{ label: string; value: string }> => {
  return getPendingNamingTargets(state, submissionMap).map((target) => ({
    label: `${target.baseName} (${target.submissionCount}/3)`,
    value: buildNamingTargetKey(target.targetType, target.targetId),
  }));
};
