import type {
  ActiveEncounter,
  EncounterOptionOutcome,
  MemoryType,
  PettitMood,
  PettitState,
  TraitKey,
} from '../../shared/pettit';
import type { JournalStyleKey } from './pettit-journal-templates';
import { getTopTraits } from './pettit-seed';

type MinorEventDefinition = {
  key: string;
  title: string;
  preferredAffinities?: ActiveEncounter['affinity'][];
  preferredTraits?: TraitKey[];
  preferredMoods?: PettitMood[];
  preferredMemoryTypes?: MemoryType[];
  linesByStyle: Record<JournalStyleKey, readonly string[]>;
};

export type SelectedMinorEvent = {
  key: string;
  title: string;
  linesByStyle: Record<JournalStyleKey, readonly string[]>;
};

const MINOR_EVENT_TRIGGER_THRESHOLD = 38;

const MINOR_EVENT_LIBRARY: readonly MinorEventDefinition[] = [
  {
    key: 'friendly-dog',
    title: 'Friendly Dog',
    preferredAffinities: ['trust', 'community'],
    preferredTraits: ['trust'],
    preferredMoods: ['excited', 'curious'],
    preferredMemoryTypes: ['friendship', 'community'],
    linesByStyle: {
      reflective: [
        'A friendly dog also wandered through the edges of the day, and somehow that small kindness made everything feel steadier.',
      ],
      excited: [
        'A friendly dog showed up too, which made the whole adventure feel even happier than it already did.',
      ],
      funny: [
        'A friendly dog appeared for part of it as well, and I am choosing to believe we understood each other perfectly.',
      ],
      curious: [
        'A friendly dog crossed my path too, and now I have at least three new questions about where it came from and where it was going.',
      ],
      childlike: [
        'A friendly dog came by too, and that made the whole day feel extra nice.',
      ],
    },
  },
  {
    key: 'empty-campfire',
    title: 'Empty Campfire',
    preferredAffinities: ['curiosity', 'courage'],
    preferredTraits: ['curiosity', 'courage'],
    preferredMoods: ['thoughtful', 'nervous'],
    preferredMemoryTypes: ['learning', 'adventure', 'special'],
    linesByStyle: {
      reflective: [
        'Later, I found the remains of an empty campfire, and it left me wondering who had needed that warmth before me.',
      ],
      excited: [
        'I even passed an empty campfire afterward, which made the whole day feel like part of a much bigger adventure trail.',
      ],
      funny: [
        'I also found an empty campfire, which felt like the sort of clue that should come with a dramatic soundtrack.',
      ],
      curious: [
        'I came across an empty campfire too, and I cannot stop wondering whose story I almost bumped into.',
      ],
      childlike: [
        'There was an empty campfire later too, and it made me think somebody else had a story here before me.',
      ],
    },
  },
  {
    key: 'hidden-waterfall',
    title: 'Hidden Waterfall',
    preferredAffinities: ['curiosity', 'rare'],
    preferredTraits: ['curiosity'],
    preferredMoods: ['curious', 'excited'],
    preferredMemoryTypes: ['learning', 'special', 'adventure'],
    linesByStyle: {
      reflective: [
        'At one point I found a hidden waterfall, and the sound of it made the rest of the day feel clearer somehow.',
      ],
      excited: [
        'I even found a hidden waterfall along the way, which was exactly as wonderful as it sounds.',
      ],
      funny: [
        'A hidden waterfall turned up too, just in case the day was not already showing off.',
      ],
      curious: [
        'I also discovered a hidden waterfall, and now I want to know what other secret places the world is keeping from me.',
      ],
      childlike: [
        'I found a hidden waterfall too, and it felt like stumbling into a secret made out of light and sound.',
      ],
    },
  },
  {
    key: 'storyteller',
    title: 'Storyteller',
    preferredAffinities: ['trust', 'community', 'curiosity'],
    preferredTraits: ['trust', 'curiosity'],
    preferredMoods: ['thoughtful', 'curious'],
    preferredMemoryTypes: ['community', 'learning', 'friendship'],
    linesByStyle: {
      reflective: [
        'A passing storyteller shared a few words with me later, and they made the day feel like something worth keeping carefully.',
      ],
      excited: [
        'I also ran into a storyteller, which made everything feel even more like the middle of a real adventure.',
      ],
      funny: [
        'A storyteller appeared later too, and I am fairly sure they improved the drama of the whole situation by at least thirty percent.',
      ],
      curious: [
        'A storyteller crossed my path too, and now I keep wondering how many lives can brush against each other in a single day.',
      ],
      childlike: [
        'I met a storyteller later too, and their words made the day glow a little in my head.',
      ],
    },
  },
  {
    key: 'lost-hat',
    title: 'Lost Hat',
    preferredAffinities: ['chaos', 'community'],
    preferredTraits: ['chaos'],
    preferredMoods: ['excited', 'nervous'],
    preferredMemoryTypes: ['funny', 'community'],
    linesByStyle: {
      reflective: [
        'Somewhere in the middle of everything, I also found a lost hat, which felt oddly meaningful for reasons I cannot fully defend.',
      ],
      excited: [
        'I even found a lost hat during all of this, which honestly made the day better.',
      ],
      funny: [
        'I also found a lost hat, which immediately raised several important questions, none of them sensible.',
      ],
      curious: [
        'A lost hat turned up too, and now I would really like to know the story that left it behind.',
      ],
      childlike: [
        'I found a lost hat too, and it felt like the sort of thing that should belong to an interesting story.',
      ],
    },
  },
  {
    key: 'chased-own-tail',
    title: 'Chased Own Tail',
    preferredAffinities: ['chaos'],
    preferredTraits: ['chaos'],
    preferredMoods: ['excited'],
    preferredMemoryTypes: ['funny'],
    linesByStyle: {
      reflective: [
        'I also spent a brief and not especially dignified moment chasing my own tail, which I suppose is part of having a full life.',
      ],
      excited: [
        'At one point I absolutely chased my own tail for a moment, and honestly the energy felt correct.',
      ],
      funny: [
        'I also chased my own tail for a while, which was not useful but did feel committed.',
      ],
      curious: [
        'I somehow ended up chasing my own tail for a moment too, and I still cannot explain exactly why it felt necessary.',
      ],
      childlike: [
        'I chased my own tail a little too, and it was silly but kind of fun.',
      ],
    },
  },
];

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

const getDefinitionWeight = (
  definition: MinorEventDefinition,
  state: PettitState,
  encounter: ActiveEncounter,
  outcome: EncounterOptionOutcome
): number => {
  const topTraits = getTopTraits(state.traits, 2);
  let weight = 1;

  if (definition.preferredAffinities?.includes(encounter.affinity)) {
    weight += 4;
  }

  if (definition.preferredTraits?.some((trait) => topTraits.includes(trait))) {
    weight += 3;
  }

  if (definition.preferredMoods?.includes(outcome.mood)) {
    weight += 2;
  }

  if (definition.preferredMemoryTypes?.includes(outcome.memoryType)) {
    weight += 3;
  }

  return weight;
};

export const selectMinorEvent = (
  state: PettitState,
  encounter: ActiveEncounter,
  outcome: EncounterOptionOutcome,
  sequenceNumber: number
): SelectedMinorEvent | null => {
  const triggerSeed = stringToSeed(
    [encounter.templateId, outcome.optionId, state.mood, String(sequenceNumber)].join('|')
  );

  if (triggerSeed % 100 >= MINOR_EVENT_TRIGGER_THRESHOLD) {
    return null;
  }

  const weightedPool = MINOR_EVENT_LIBRARY.flatMap((definition) =>
    Array.from({ length: getDefinitionWeight(definition, state, encounter, outcome) }, () => definition)
  );

  if (weightedPool.length === 0) {
    return null;
  }

  const selected = pickDeterministic(weightedPool, triggerSeed);

  return {
    key: selected.key,
    title: selected.title,
    linesByStyle: selected.linesByStyle,
  };
};

export const renderMinorEventJournalLine = (
  minorEvent: SelectedMinorEvent,
  style: JournalStyleKey,
  seedKey: string
): string => {
  const lines = minorEvent.linesByStyle[style];
  return pickDeterministic(lines, stringToSeed(seedKey));
};
