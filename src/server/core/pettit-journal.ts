import type {
  ActiveEncounter,
  EncounterOptionOutcome,
  PettitJournalEntry,
  PettitMemory,
  PettitState,
  TraitKey,
} from '../../shared/pettit';
import { getTopTraits } from './pettit-seed';
import type { SeasonalJournalContext } from './pettit-seasonal';
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
  topTraits: readonly TraitKey[],
  seasonalContext?: SeasonalJournalContext | null
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

  if (seasonalContext?.tone === 'reflective') {
    weights.reflective += 4;
  }

  if (seasonalContext?.tone === 'birthday' || seasonalContext?.tone === 'intimate') {
    weights.childlike += 2;
    weights.reflective += 2;
  }

  if (seasonalContext?.tone === 'quiet') {
    weights.reflective += 3;
    weights.childlike += 1;
  }

  if (seasonalContext?.tone === 'wishful') {
    weights.curious += 2;
    weights.reflective += 2;
  }

  if (seasonalContext?.tone === 'vibrant') {
    weights.excited += 2;
    weights.curious += 2;
  }

  if (seasonalContext?.tone === 'excited') {
    weights.excited += 4;
  }

  if (seasonalContext?.tone === 'funny') {
    weights.funny += 3;
  }

  if (seasonalContext?.tone === 'childlike') {
    weights.childlike += 4;
  }

  return weights;
};

const selectJournalStyle = (
  state: PettitState,
  encounter: ActiveEncounter,
  outcome: EncounterOptionOutcome,
  sequenceNumber: number,
  topTraits: readonly TraitKey[],
  seasonalContext?: SeasonalJournalContext | null
): JournalStyleKey => {
  const weights = buildStyleWeights(state, outcome, topTraits, seasonalContext);
  const seedKey = [
    encounter.templateId,
    outcome.optionId,
    String(sequenceNumber),
    state.mood,
    seasonalContext?.key ?? 'none',
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
  sequenceNumber: number,
  celebrationLine?: string | null,
  seasonalContext?: SeasonalJournalContext | null
): PettitJournalEntry => {
  const topTraits = getTopTraits(state.traits, 2);
  const leadingTrait = topTraits[0] ?? 'curiosity';
  const trailingTrait = topTraits[1] ?? leadingTrait;
  const style = selectJournalStyle(state, encounter, outcome, sequenceNumber, topTraits, seasonalContext);
  const templates = JOURNAL_STYLE_TEMPLATES[style];
  const context: JournalContext = {
    mood: outcome.mood,
    leadingTrait,
    trailingTrait,
    outcome,
    memory,
    previousMemory,
  };

  let opening = renderLineTemplate(
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
  let closing = renderLineTemplate(
    templates.closing,
    context,
    `${encounter.id}|closing|${style}|${sequenceNumber}`
  );

  if (seasonalContext?.key === 'longest-night') {
    opening = 'Tonight felt deeper than usual, and even the quiet seemed to have something to say.';
  } else if (seasonalContext?.key === 'storykeepers-day') {
    opening = 'Today old memories kept stepping closer, as though they wanted to be noticed again.';
  } else if (seasonalContext?.key === 'shooting-star-night') {
    opening = 'The sky kept moving above me tonight, and it made every thought feel a little more possible.';
  } else if (seasonalContext?.key === 'day-of-little-things') {
    opening = 'Nothing huge happened today, which turned out to be exactly the right kind of day.';
  } else if (seasonalContext?.key === 'pettit-day') {
    opening = 'Today felt full in the warmest way, like the whole community had decided to hold me a little closer.';
  }

  if (seasonalContext?.key === 'surprise-day') {
    closing = 'I still do not fully understand today, but I am very glad it happened.';
  } else if (seasonalContext?.key === 'campfire-night') {
    closing = 'Tonight nobody seemed eager to leave, and I understood why.';
  } else if (seasonalContext?.key === 'great-planting-day') {
    closing = 'It felt good to help something small begin.';
  }

  const content = [
    opening,
    mainEvent,
    leadingReflection,
    trailingReflection ?? memoryCallback,
    trailingReflection ? memoryCallback : closing,
    trailingReflection ? closing : null,
    celebrationLine ?? null,
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
