import type {
  ActiveEncounter,
  EncounterOptionOutcome,
  PettitJournalEntry,
  PettitMemory,
  PettitState,
  TraitKey,
} from '../../shared/pettit';
import { getTopTraits } from './pettit-seed';
import {
  JOURNAL_STYLE_TEMPLATES,
  type JournalContext,
  type JournalStyleKey,
} from './pettit-journal-templates';

const JOURNAL_STYLES: readonly JournalStyleKey[] = ['reflective', 'excited', 'funny', 'curious', 'childlike'];

const stringToSeed = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const pickDeterministic = <T>(items: readonly T[], seed: number): T => {
  const safeIndex = Math.abs(seed) % items.length;
  return items[safeIndex] ?? items[0]!;
};

const renderLineTemplate = (
  templates: readonly (string | ((context: JournalContext) => string))[],
  context: JournalContext,
  seedKey: string
): string => {
  const template = pickDeterministic(templates, stringToSeed(seedKey));
  return typeof template === 'function' ? template(context) : template;
};

const isSoftEncounter = (outcome: EncounterOptionOutcome): boolean => {
  return (
    outcome.memoryType === 'friendship' ||
    outcome.memoryType === 'community' ||
    outcome.memoryType === 'gift'
  );
};

const isPlayfulEncounter = (outcome: EncounterOptionOutcome): boolean => {
  return outcome.memoryType === 'funny' || outcome.memoryType === 'gift' || outcome.importance >= 4;
};

const buildStyleWeights = (
  state: PettitState,
  outcome: EncounterOptionOutcome,
  topTraits: readonly TraitKey[]
): Record<JournalStyleKey, number> => {
  const weights: Record<JournalStyleKey, number> = {
    reflective: 2,
    excited: 2,
    funny: 2,
    curious: 2,
    childlike: 2,
  };

  const [leadingTrait, trailingTrait] = topTraits;
  const mood = state.mood;

  if (mood === 'thoughtful' || mood === 'nervous') {
    weights.reflective += 3;
  }

  if (mood === 'excited') {
    weights.excited += 4;
  }

  if (mood === 'curious') {
    weights.curious += 4;
  }

  if (leadingTrait === 'curiosity') {
    weights.curious += 4;
    weights.reflective += 1;
  }

  if (leadingTrait === 'chaos') {
    weights.funny += 4;
  }

  if (leadingTrait === 'trust') {
    weights.childlike += 3;
    weights.reflective += 2;
  }

  if (leadingTrait === 'courage') {
    weights.excited += 3;
    weights.reflective += 2;
  }

  if (trailingTrait === 'chaos') {
    weights.funny += 2;
  }

  if (trailingTrait === 'trust') {
    weights.childlike += 2;
  }

  if (trailingTrait === 'courage') {
    weights.excited += 1;
    weights.reflective += 1;
  }

  if (isPlayfulEncounter(outcome)) {
    weights.funny += 2;
  }

  if (isSoftEncounter(outcome)) {
    weights.childlike += 2;
  }

  return weights;
};

const selectJournalStyle = (
  state: PettitState,
  encounter: ActiveEncounter,
  outcome: EncounterOptionOutcome,
  sequenceNumber: number,
  topTraits: readonly TraitKey[]
): JournalStyleKey => {
  const weights = buildStyleWeights(state, outcome, topTraits);
  const seedKey = [
    encounter.templateId,
    outcome.optionId,
    String(sequenceNumber),
    state.mood,
    ...topTraits,
  ].join('|');
  const weightedPool = JOURNAL_STYLES.flatMap((style) =>
    Array.from({ length: Math.max(1, weights[style]) }, () => style)
  );

  return pickDeterministic(weightedPool, stringToSeed(seedKey));
};

export const createJournalEntry = (
  state: PettitState,
  encounter: ActiveEncounter,
  outcome: EncounterOptionOutcome,
  memory: PettitMemory,
  previousMemory: PettitMemory | null,
  sequenceNumber: number
): PettitJournalEntry => {
  const topTraits = getTopTraits(state.traits, 2);
  const leadingTrait = topTraits[0] ?? 'curiosity';
  const trailingTrait = topTraits[1] ?? leadingTrait;
  const style = selectJournalStyle(state, encounter, outcome, sequenceNumber, topTraits);
  const templates = JOURNAL_STYLE_TEMPLATES[style];
  const context: JournalContext = {
    mood: outcome.mood,
    leadingTrait,
    trailingTrait,
    outcome,
    memory,
    previousMemory,
  };

  const opening = renderLineTemplate(
    templates.openingByMood[context.mood],
    context,
    `${encounter.id}|opening|${style}|${context.mood}`
  );
  const mainEvent = renderLineTemplate(
    templates.mainEvent,
    context,
    `${encounter.id}|main|${style}|${outcome.optionId}`
  );
  const leadingReflection = renderLineTemplate(
    templates.reflectionByTrait[leadingTrait],
    context,
    `${encounter.id}|reflect-leading|${style}|${leadingTrait}`
  );
  const trailingReflection =
    trailingTrait !== leadingTrait
      ? renderLineTemplate(
          templates.reflectionByTrait[trailingTrait],
          context,
          `${encounter.id}|reflect-trailing|${style}|${trailingTrait}`
        )
      : null;
  const memoryCallback = renderLineTemplate(
    templates.memoryCallback,
    context,
    `${encounter.id}|memory|${style}|${previousMemory?.id ?? 'none'}`
  );
  const closing = renderLineTemplate(
    templates.closing,
    context,
    `${encounter.id}|closing|${style}|${sequenceNumber}`
  );

  const content = [
    opening,
    mainEvent,
    leadingReflection,
    trailingReflection ?? memoryCallback,
    trailingReflection ? memoryCallback : closing,
    trailingReflection ? closing : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join(' ');

  return {
    id: `journal-${sequenceNumber}`,
    date: new Date().toISOString(),
    title: encounter.title,
    content,
    relatedMemoryIds: [memory.id],
    relatedEncounterId: encounter.id,
  };
};
