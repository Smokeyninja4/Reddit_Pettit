import type {
  ActiveSeasonalEventView,
  EncounterOptionOutcome,
  EncounterTemplate,
  MemoryType,
  PettitInventoryItem,
  PettitSeasonalProgress,
  PettitState,
  SeasonalEventKey,
  SeasonalEventKind,
  SeasonalProgressView,
  TraitKey,
} from '../../shared/pettit';
import { getGiftById } from './pettit-gifts';
import { getPettitBirthdayMonthDay, personalizePettitText } from './pettit-identity';

type SeasonalJournalTone =
  | 'reflective'
  | 'intimate'
  | 'quiet'
  | 'wishful'
  | 'birthday'
  | 'vibrant'
  | 'funny'
  | 'childlike'
  | 'excited';

type SeasonalEncounterSeed = {
  title: string;
  description: string;
  affinity: TraitKey | 'community' | 'seasonal';
  optionSet: 'wonder' | 'help' | 'brave' | 'playful' | 'quiet' | 'festival' | 'story' | 'legendary';
  memoryType: MemoryType;
  importance: number;
  mood: 'curious' | 'excited' | 'thoughtful' | 'nervous';
  resultStem: string;
  memoryStem: string;
  traitEffects: Partial<Record<TraitKey, number>>;
};

type SeasonalEventDefinition = {
  key: SeasonalEventKey;
  title: string;
  kind: SeasonalEventKind;
  flavorText: string;
  accentColor: string;
  timingLabel: string;
  affinityBoosts: Partial<Record<TraitKey, number>>;
  preferredGiftIds: readonly string[];
  specialEncounterChance: number;
  rareChanceBonus: number;
  journalTone?: SeasonalJournalTone;
  preferOldMemories?: boolean;
  match: (date: Date, progress: PettitSeasonalProgress) => boolean;
  encounter: SeasonalEncounterSeed;
};

export type SeasonalEncounterModifier = {
  activeEvent: ActiveSeasonalEventView | null;
  affinityBoosts: Partial<Record<TraitKey, number>>;
  preferredGiftIds: readonly string[];
  seasonalEncounterChance: number;
  rareChanceBonus: number;
  journalTone?: SeasonalJournalTone;
  preferOldMemories: boolean;
};

export type SeasonalJournalContext = {
  key: SeasonalEventKey;
  title: string;
  tone?: SeasonalJournalTone;
  preferOldMemories: boolean;
};

const LEGENDARY_EVENT_CHANCE_PERCENT = 2;

const stringToSeed = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const getDaysInUtcYear = (year: number): number => {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
};

const getDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const getDateFromDayOfYear = (year: number, dayOfYear: number): string => {
  const date = new Date(Date.UTC(year, 0, 1));
  date.setUTCDate(dayOfYear);
  return getDateKey(date);
};

const isSameUtcDay = (date: Date, month: number, day: number): boolean =>
  date.getUTCMonth() + 1 === month && date.getUTCDate() === day;

const isWithinUtcRange = (
  date: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number
): boolean => {
  const value = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  const startValue = startMonth * 100 + startDay;
  const endValue = endMonth * 100 + endDay;

  return value >= startValue && value <= endValue;
};

const buildOptionOutcomes = (
  eventKey: SeasonalEventKey,
  seed: SeasonalEncounterSeed
): ReadonlyArray<EncounterOptionOutcome> => {
  const optionSets = {
    wonder: [
      {
        id: 'observe',
        label: 'Look Closer',
        mood: 'curious' as const,
        effect: { curiosity: 2 },
        memorySuffix: 'and found a little more wonder waiting there.',
      },
      {
        id: 'share',
        label: 'Share The Moment',
        mood: 'thoughtful' as const,
        effect: { trust: 1, curiosity: 1 },
        memorySuffix: 'and made the moment feel bigger by not keeping it alone.',
      },
      {
        id: 'follow',
        label: 'Follow The Clue',
        mood: 'excited' as const,
        effect: { courage: 1, curiosity: 1 },
        memorySuffix: 'and let the day open into a new little adventure.',
      },
    ],
    help: [
      {
        id: 'help',
        label: 'Help Out',
        mood: 'thoughtful' as const,
        effect: { trust: 2 },
        memorySuffix: 'and left behind a gentle kind of warmth.',
      },
      {
        id: 'stay',
        label: 'Stay Nearby',
        mood: 'curious' as const,
        effect: { trust: 1, courage: 1 },
        memorySuffix: 'and discovered that kindness can be brave too.',
      },
      {
        id: 'encourage',
        label: 'Encourage Everyone',
        mood: 'excited' as const,
        effect: { trust: 1, chaos: 1 },
        memorySuffix: 'and turned the whole moment into shared momentum.',
      },
    ],
    brave: [
      {
        id: 'step-forward',
        label: 'Step Forward',
        mood: 'excited' as const,
        effect: { courage: 2 },
        memorySuffix: 'and felt a little steadier afterward.',
      },
      {
        id: 'steady-breath',
        label: 'Take A Breath',
        mood: 'thoughtful' as const,
        effect: { courage: 1, trust: 1 },
        memorySuffix: 'and proved that slow courage still counts.',
      },
      {
        id: 'bring-friends',
        label: 'Bring Everyone Along',
        mood: 'curious' as const,
        effect: { trust: 1, courage: 1 },
        memorySuffix: 'and made the unknown feel much friendlier.',
      },
    ],
    playful: [
      {
        id: 'try-it',
        label: 'Try It',
        mood: 'excited' as const,
        effect: { chaos: 2 },
        memorySuffix: 'and the day immediately got weirder in the best way.',
      },
      {
        id: 'poke-around',
        label: 'Poke Around',
        mood: 'curious' as const,
        effect: { chaos: 1, curiosity: 1 },
        memorySuffix: 'and uncovered exactly the sort of nonsense it hoped for.',
      },
      {
        id: 'laugh',
        label: 'Laugh First',
        mood: 'thoughtful' as const,
        effect: { trust: 1, chaos: 1 },
        memorySuffix: 'and made silliness feel strangely comforting.',
      },
    ],
    quiet: [
      {
        id: 'pause',
        label: 'Pause Here',
        mood: 'thoughtful' as const,
        effect: { trust: 1, curiosity: 1 },
        memorySuffix: 'and noticed how much a soft moment can hold.',
      },
      {
        id: 'listen',
        label: 'Listen Closely',
        mood: 'curious' as const,
        effect: { curiosity: 1, trust: 1 },
        memorySuffix: 'and heard little details the day almost kept hidden.',
      },
      {
        id: 'keep-company',
        label: 'Keep Company',
        mood: 'thoughtful' as const,
        effect: { trust: 2 },
        memorySuffix: 'and let quiet become something shared instead of empty.',
      },
    ],
    festival: [
      {
        id: 'join-in',
        label: 'Join In',
        mood: 'excited' as const,
        effect: { trust: 1, courage: 1 },
        memorySuffix: 'and the celebration wrapped around Pettit like a song.',
      },
      {
        id: 'explore-stalls',
        label: 'Explore',
        mood: 'curious' as const,
        effect: { curiosity: 2 },
        memorySuffix: 'and every colorful corner seemed to hide another tiny surprise.',
      },
      {
        id: 'make-mischief',
        label: 'Make Mischief',
        mood: 'excited' as const,
        effect: { chaos: 1, trust: 1 },
        memorySuffix: 'and somehow made the whole event feel even more alive.',
      },
    ],
    story: [
      {
        id: 'tell-a-story',
        label: 'Tell A Story',
        mood: 'thoughtful' as const,
        effect: { trust: 1, courage: 1 },
        memorySuffix: 'and left everyone leaning a little closer.',
      },
      {
        id: 'listen-deeply',
        label: 'Listen Deeply',
        mood: 'thoughtful' as const,
        effect: { trust: 1, curiosity: 1 },
        memorySuffix: 'and felt the older parts of the world stir awake again.',
      },
      {
        id: 'laugh-together',
        label: 'Laugh Together',
        mood: 'excited' as const,
        effect: { chaos: 1, trust: 1 },
        memorySuffix: 'and turned the night into something easier to carry home.',
      },
    ],
    legendary: [
      {
        id: 'witness',
        label: 'Witness',
        mood: 'thoughtful' as const,
        effect: { curiosity: 2, trust: 1 },
        memorySuffix: 'and knew at once this would become one of the stories worth keeping.',
      },
      {
        id: 'approach',
        label: 'Approach Carefully',
        mood: 'nervous' as const,
        effect: { courage: 2 },
        memorySuffix: 'and discovered that awe and bravery can live in the same breath.',
      },
      {
        id: 'invite-others',
        label: 'Call Everyone Over',
        mood: 'excited' as const,
        effect: { trust: 2 },
        memorySuffix: 'and made the miracle feel even more real by sharing it immediately.',
      },
    ],
  } as const;

  return optionSets[seed.optionSet].map((option) => ({
    optionId: `${eventKey}-${option.id}`,
    resultText: `${seed.resultStem} Pettit ${option.memorySuffix}`,
    memoryTitle: seed.title,
    memoryDescription: `${seed.memoryStem} Pettit ${option.memorySuffix}`,
    memoryType: seed.memoryType,
    importance: seed.importance,
    mood: option.mood,
    traitEffects: {
      ...seed.traitEffects,
      ...option.effect,
    },
  }));
};

const buildEncounterTemplate = (
  key: SeasonalEventKey,
  seed: SeasonalEncounterSeed
): EncounterTemplate => {
  const optionOutcomes = buildOptionOutcomes(key, seed);
  const optionLabels: Record<string, string> = {
    observe: 'Look Closer',
    share: 'Share The Moment',
    follow: 'Follow The Clue',
    help: 'Help Out',
    stay: 'Stay Nearby',
    encourage: 'Encourage Everyone',
    'step-forward': 'Step Forward',
    'steady-breath': 'Take A Breath',
    'bring-friends': 'Bring Everyone Along',
    'try-it': 'Try It',
    'poke-around': 'Poke Around',
    laugh: 'Laugh First',
    pause: 'Pause Here',
    listen: 'Listen Closely',
    'keep-company': 'Keep Company',
    'join-in': 'Join In',
    'explore-stalls': 'Explore',
    'make-mischief': 'Make Mischief',
    'tell-a-story': 'Tell A Story',
    'listen-deeply': 'Listen Deeply',
    'laugh-together': 'Laugh Together',
    witness: 'Witness',
    approach: 'Approach Carefully',
    'invite-others': 'Call Everyone Over',
  };

  return {
    id: `encounter-seasonal-${key}`,
    title: seed.title,
    description: seed.description,
    affinity: seed.affinity,
    options: optionOutcomes.map((outcome) => ({
      id: outcome.optionId,
      label: optionLabels[outcome.optionId.replace(`${key}-`, '')] ?? 'Choose',
    })),
    outcomes: optionOutcomes,
  };
};

const LEGENDARY_EVENT_KEYS: readonly SeasonalEventKey[] = [
  'blue-moon-feast',
  'rainbow-bloom',
  'butterfly-migration',
  'crystal-frost',
  'ancient-forest-awakening',
  'comet-night',
  'festival-of-forgotten-names',
  'night-of-a-thousand-lanterns',
  'whispering-woods',
  'constellation-festival',
];

const EVENT_DEFINITIONS: readonly SeasonalEventDefinition[] = [
  {
    key: 'pettit-day',
    title: 'Pettit Day',
    kind: 'holiday',
    flavorText: "Pettit's birthday is here, and the whole community feels a little softer and brighter.",
    accentColor: '#f6c453',
    timingLabel: 'Today',
    affinityBoosts: { trust: 3, curiosity: 1 },
    preferredGiftIds: ['birthday-hat', 'friendship-bracelet', 'painted-pebble'],
    specialEncounterChance: 0.75,
    rareChanceBonus: 0,
    journalTone: 'birthday',
    preferOldMemories: true,
    match: (_date, progress) => {
      void progress;
      return false;
    },
    encounter: {
      title: 'Birthday Gathering',
      description: 'A little birthday gathering forms around Pettit, full of handmade things and warm attention.',
      affinity: 'community',
      optionSet: 'festival',
      memoryType: 'community',
      importance: 4,
      mood: 'excited',
      resultStem: 'The birthday gathering turned into the kind of day Pettit will carry for a long time.',
      memoryStem: 'The community gathered around Pettit for a birthday full of shared affection,',
      traitEffects: { trust: 1 },
    },
  },
  {
    key: 'longest-night',
    title: 'Longest Night',
    kind: 'holiday',
    flavorText: 'The world feels darker tonight, but not lonelier. Stories and quiet courage stay close.',
    accentColor: '#5d79d6',
    timingLabel: 'Rare Night',
    affinityBoosts: { trust: 1, courage: 2 },
    preferredGiftIds: ['lantern', 'blanket', 'camp-mug'],
    specialEncounterChance: 0.55,
    rareChanceBonus: 0.1,
    journalTone: 'reflective',
    preferOldMemories: true,
    match: (date) => isSameUtcDay(date, 12, 21),
    encounter: {
      title: 'Lanterns In The Dark',
      description: 'The Longest Night makes every quiet glow feel more important than usual.',
      affinity: 'seasonal',
      optionSet: 'story',
      memoryType: 'special',
      importance: 4,
      mood: 'thoughtful',
      resultStem: 'The Longest Night held Pettit in a hush full of old stories and brave little lights.',
      memoryStem: 'On the Longest Night, Pettit stayed close to the lantern glow,',
      traitEffects: { courage: 1, trust: 1 },
    },
  },
  {
    key: 'bloom-day',
    title: 'Bloom Day',
    kind: 'holiday',
    flavorText: 'Everything feels newly colorful, as though the world remembered how to be delighted again.',
    accentColor: '#ff8db8',
    timingLabel: 'Today',
    affinityBoosts: { curiosity: 3, trust: 1 },
    preferredGiftIds: ['flower-crown', 'painted-pebble', 'nature-guide'],
    specialEncounterChance: 0.5,
    rareChanceBonus: 0,
    journalTone: 'vibrant',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 4, 18),
    encounter: {
      title: 'The Meadow Looked Different Today',
      description: 'A familiar meadow suddenly feels brighter, stranger, and full of hidden invitations.',
      affinity: 'curiosity',
      optionSet: 'wonder',
      memoryType: 'learning',
      importance: 3,
      mood: 'curious',
      resultStem: 'Bloom Day made even ordinary grass feel like a fresh beginning.',
      memoryStem: 'The meadow shifted into something luminous on Bloom Day,',
      traitEffects: { curiosity: 1 },
    },
  },
  {
    key: 'campfire-night',
    title: 'Campfire Night',
    kind: 'holiday',
    flavorText: 'Nobody seems eager to leave the fire. The night feels built for stories and company.',
    accentColor: '#e38c52',
    timingLabel: 'Tonight',
    affinityBoosts: { trust: 3, courage: 1 },
    preferredGiftIds: ['camp-mug', 'blanket', 'story-book', 'music-box', 'picnic-basket'],
    specialEncounterChance: 0.6,
    rareChanceBonus: 0,
    journalTone: 'intimate',
    preferOldMemories: true,
    match: (date) => isSameUtcDay(date, 8, 12),
    encounter: {
      title: 'Stories By Firelight',
      description: 'The flames throw long shapes while everyone settles in to listen, laugh, or remember.',
      affinity: 'community',
      optionSet: 'story',
      memoryType: 'community',
      importance: 4,
      mood: 'thoughtful',
      resultStem: 'Campfire Night brought everyone close enough for the smallest stories to matter.',
      memoryStem: 'Around the campfire, Pettit found a kind of closeness that made the whole night glow,',
      traitEffects: { trust: 1 },
    },
  },
  {
    key: 'storykeepers-day',
    title: "Storykeeper's Day",
    kind: 'holiday',
    flavorText: 'Old memories feel nearer today, as if the world wants Pettit to turn around and look back with care.',
    accentColor: '#b889f7',
    timingLabel: 'Today',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['story-book', 'adventure-book', 'story-collection', 'adventure-journal', 'painted-pebble'],
    specialEncounterChance: 0.52,
    rareChanceBonus: 0,
    journalTone: 'reflective',
    preferOldMemories: true,
    match: (date) => isSameUtcDay(date, 10, 6),
    encounter: {
      title: 'Remember Together',
      description: 'The community starts retelling older Pettit moments, and each one seems to shine a little brighter.',
      affinity: 'community',
      optionSet: 'story',
      memoryType: 'community',
      importance: 4,
      mood: 'thoughtful',
      resultStem: "Storykeeper's Day made Pettit's history feel alive instead of finished.",
      memoryStem: 'While old stories were shared again, Pettit realized memory can keep growing,',
      traitEffects: { trust: 1, curiosity: 1 },
    },
  },
  {
    key: 'lost-toy-day',
    title: 'Lost Toy Day',
    kind: 'holiday',
    flavorText: 'Everyone is looking for little missing things, and somehow that makes the whole day gentler.',
    accentColor: '#f2a4cb',
    timingLabel: 'Today',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['teddy-bear', 'wooden-horse', 'toy-robot', 'kite'],
    specialEncounterChance: 0.5,
    rareChanceBonus: 0,
    journalTone: 'childlike',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 5, 11),
    encounter: {
      title: 'Search The Grass',
      description: 'A missing toy turns the afternoon into a careful little search full of hopeful glances.',
      affinity: 'trust',
      optionSet: 'help',
      memoryType: 'friendship',
      importance: 3,
      mood: 'curious',
      resultStem: 'Lost Toy Day reminded Pettit that small kindnesses are often the most memorable.',
      memoryStem: 'While helping search for a lost toy, Pettit kept everyone company,',
      traitEffects: { trust: 1 },
    },
  },
  {
    key: 'rain-appreciation-day',
    title: 'Rain Appreciation Day',
    kind: 'holiday',
    flavorText: "Today the rain feels like part of the comfort, not a reason to hide from it.",
    accentColor: '#7ec0d8',
    timingLabel: 'Today',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['blanket', 'camp-mug', 'nature-guide', 'rain-coat', 'notebook'],
    specialEncounterChance: 0.45,
    rareChanceBonus: 0,
    journalTone: 'reflective',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 11, 3),
    encounter: {
      title: 'Listen To The Rain',
      description: 'The rain turns paths, roofs, and leaves into a quiet orchestra.',
      affinity: 'seasonal',
      optionSet: 'quiet',
      memoryType: 'special',
      importance: 3,
      mood: 'thoughtful',
      resultStem: 'Rain Appreciation Day made the weather feel less like interruption and more like company.',
      memoryStem: 'Instead of hurrying away from the rain, Pettit stayed with it,',
      traitEffects: { trust: 1 },
    },
  },
  {
    key: 'paint-everything-day',
    title: 'Paint Everything Day',
    kind: 'holiday',
    flavorText: 'The world looks brighter today, like someone decided color should be everyone’s business.',
    accentColor: '#55d7d7',
    timingLabel: 'Today',
    affinityBoosts: { curiosity: 2, chaos: 1 },
    preferredGiftIds: ['paintbrush', 'easel', 'palette', 'painted-pebble', 'festival-badge'],
    specialEncounterChance: 0.55,
    rareChanceBonus: 0,
    journalTone: 'vibrant',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 7, 9),
    encounter: {
      title: 'Color Everywhere',
      description: 'Even familiar places feel transformed when the day fills them with playful color.',
      affinity: 'seasonal',
      optionSet: 'festival',
      memoryType: 'funny',
      importance: 3,
      mood: 'excited',
      resultStem: 'Paint Everything Day made Pettit feel like color itself had decided to help out.',
      memoryStem: 'With color showing up everywhere it could, Pettit leaned into the fun,',
      traitEffects: { curiosity: 1, chaos: 1 },
    },
  },
  {
    key: 'silly-socks-day',
    title: 'Silly Socks Day',
    kind: 'holiday',
    flavorText: 'There is no serious point to any of this, which seems to be exactly why everyone loves it.',
    accentColor: '#f7a85b',
    timingLabel: 'Today',
    affinityBoosts: { chaos: 3, trust: 1 },
    preferredGiftIds: ['fake-mustache', 'squeaky-duck', 'wizard-hat'],
    specialEncounterChance: 0.5,
    rareChanceBonus: 0,
    journalTone: 'funny',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 2, 7),
    encounter: {
      title: 'Ridiculous Parade',
      description: 'The day turns into a cheerful procession of pointless sock-related confidence.',
      affinity: 'chaos',
      optionSet: 'playful',
      memoryType: 'funny',
      importance: 3,
      mood: 'excited',
      resultStem: 'Silly Socks Day proved that nonsense can be a very good reason to gather.',
      memoryStem: 'In the middle of a very unnecessary parade, Pettit joined in anyway,',
      traitEffects: { chaos: 1 },
    },
  },
  {
    key: 'great-planting-day',
    title: 'Great Planting Day',
    kind: 'holiday',
    flavorText: 'Hands get muddy, hopes get quieter, and the day feels like a promise being put into the ground.',
    accentColor: '#77c16d',
    timingLabel: 'Today',
    affinityBoosts: { trust: 2, courage: 1 },
    preferredGiftIds: ['nature-guide', 'wooden-charm', 'blanket'],
    specialEncounterChance: 0.6,
    rareChanceBonus: 0,
    journalTone: 'quiet',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 3, 22),
    encounter: {
      title: 'Plant A Small Tree',
      description: 'The community gathers around a new sapling and treats it like the start of a shared promise.',
      affinity: 'community',
      optionSet: 'help',
      memoryType: 'community',
      importance: 4,
      mood: 'thoughtful',
      resultStem: 'Great Planting Day gave Pettit a hopeful little task that felt bigger than the hole in the ground.',
      memoryStem: 'While planting a small tree together, Pettit worked carefully,',
      traitEffects: { trust: 1, courage: 1 },
    },
  },
  {
    key: 'day-of-little-things',
    title: 'Day of Little Things',
    kind: 'holiday',
    flavorText: 'Nothing huge is asking to happen today. That turns out to be its own kind of gift.',
    accentColor: '#a9c3b2',
    timingLabel: 'Today',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['lucky-rock', 'painted-pebble', 'camp-mug'],
    specialEncounterChance: 0.45,
    rareChanceBonus: 0,
    journalTone: 'quiet',
    preferOldMemories: false,
    match: (date) => isSameUtcDay(date, 9, 14),
    encounter: {
      title: 'Notice The Small Joys',
      description: 'The day offers no crisis, no spectacle, and no urgency. It only asks Pettit to notice.',
      affinity: 'seasonal',
      optionSet: 'quiet',
      memoryType: 'special',
      importance: 3,
      mood: 'thoughtful',
      resultStem: 'Day of Little Things reminded Pettit that peace can still feel full.',
      memoryStem: 'During a very gentle day, Pettit slowed down enough to notice the small joys,',
      traitEffects: { trust: 1, curiosity: 1 },
    },
  },
  {
    key: 'gift-exchange',
    title: 'Gift Exchange',
    kind: 'festival',
    flavorText: 'Homemade kindness is everywhere this week, and every keepsake feels like a tiny story.',
    accentColor: '#f0b06b',
    timingLabel: 'This Week',
    affinityBoosts: { trust: 2 },
    preferredGiftIds: ['painted-pebble', 'hand-knitted-scarf', 'wooden-charm', 'tiny-flag', 'friendship-bracelet', 'festival-badge', 'founders-coin'],
    specialEncounterChance: 0.5,
    rareChanceBonus: 0,
    journalTone: 'intimate',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 12, 8, 12, 14),
    encounter: {
      title: 'Exchange Handmade Gifts',
      description: 'This week, even small handmade things seem to carry the warmth of the whole community.',
      affinity: 'community',
      optionSet: 'festival',
      memoryType: 'gift',
      importance: 4,
      mood: 'excited',
      resultStem: 'The Gift Exchange felt less like shopping and more like shared care becoming visible.',
      memoryStem: 'During the Gift Exchange, Pettit found itself surrounded by handmade affection,',
      traitEffects: { trust: 1 },
    },
  },
  {
    key: 'mushroom-festival',
    title: 'Mushroom Festival',
    kind: 'festival',
    flavorText: 'The decorations are mossy, the lanterns glow strangely, and good decisions feel optional.',
    accentColor: '#cb7ae8',
    timingLabel: 'Festival',
    affinityBoosts: { chaos: 3, curiosity: 1 },
    preferredGiftIds: ['lantern', 'rubber-chicken', 'shiny-button'],
    specialEncounterChance: 0.56,
    rareChanceBonus: 0.05,
    journalTone: 'funny',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 10, 10, 10, 16),
    encounter: {
      title: 'Lantern Mushrooms',
      description: 'Glowing mushrooms and cheerful toadstools turn the festival into a gentle kind of nonsense.',
      affinity: 'chaos',
      optionSet: 'playful',
      memoryType: 'funny',
      importance: 3,
      mood: 'excited',
      resultStem: 'The Mushroom Festival made mischief feel almost ceremonial.',
      memoryStem: 'With lantern mushrooms lighting the way, Pettit wandered into the festival,',
      traitEffects: { chaos: 1, curiosity: 1 },
    },
  },
  {
    key: 'honey-harvest',
    title: 'Honey Harvest',
    kind: 'festival',
    flavorText: 'The week feels full of warm kitchens, careful hands, and sweetness shared out loud.',
    accentColor: '#e5b84c',
    timingLabel: 'This Week',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['honey-jar', 'camp-mug', 'blanket'],
    specialEncounterChance: 0.48,
    rareChanceBonus: 0,
    journalTone: 'intimate',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 9, 1, 9, 7),
    encounter: {
      title: 'Taste The First Honey',
      description: 'Bee decorations and warm dishes make the week feel gently celebratory.',
      affinity: 'trust',
      optionSet: 'help',
      memoryType: 'community',
      importance: 3,
      mood: 'thoughtful',
      resultStem: 'Honey Harvest made sharing feel as natural as breathing.',
      memoryStem: 'During Honey Harvest, Pettit helped gather and share the season’s sweetness,',
      traitEffects: { trust: 1 },
    },
  },
  {
    key: 'wind-festival',
    title: 'Wind Festival',
    kind: 'festival',
    flavorText: 'Leaves, ribbons, and kites keep everything in motion this week.',
    accentColor: '#7ecfe8',
    timingLabel: 'This Week',
    affinityBoosts: { curiosity: 2, courage: 1 },
    preferredGiftIds: ['kite', 'paper-windmill', 'small-backpack'],
    specialEncounterChance: 0.52,
    rareChanceBonus: 0,
    journalTone: 'excited',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 3, 8, 3, 14),
    encounter: {
      title: 'Chase The Breeze',
      description: 'Paper windmills spin, strings pull skyward, and even standing still feels like moving.',
      affinity: 'curiosity',
      optionSet: 'wonder',
      memoryType: 'adventure',
      importance: 3,
      mood: 'excited',
      resultStem: 'Wind Festival made movement feel contagious.',
      memoryStem: 'With the whole day pulled along by the wind, Pettit leaned into it,',
      traitEffects: { curiosity: 1, courage: 1 },
    },
  },
  {
    key: 'pie-festival',
    title: 'Pie Festival',
    kind: 'festival',
    flavorText: 'Every community brings a different kind of pie, and somehow Pettit can feel the personality in each one.',
    accentColor: '#d88b61',
    timingLabel: 'Festival',
    affinityBoosts: { trust: 2, chaos: 1 },
    preferredGiftIds: ['camp-mug', 'lucky-rock', 'story-book'],
    specialEncounterChance: 0.5,
    rareChanceBonus: 0,
    journalTone: 'funny',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 11, 17, 11, 23),
    encounter: {
      title: 'The Pie Table',
      description: 'The whole celebration revolves around pies, opinions, and the occasional floury accident.',
      affinity: 'community',
      optionSet: 'festival',
      memoryType: 'funny',
      importance: 3,
      mood: 'excited',
      resultStem: 'Pie Festival somehow managed to be both comforting and slightly dangerous.',
      memoryStem: 'At the Pie Festival, Pettit discovered that community warmth can come with crumbs attached,',
      traitEffects: { trust: 1, chaos: 1 },
    },
  },
  {
    key: 'mask-festival',
    title: 'Mask Festival',
    kind: 'festival',
    flavorText: 'Costumes and little disguises make everyone feel playful, dramatic, and a bit more willing to pretend.',
    accentColor: '#9b8df0',
    timingLabel: 'Festival',
    affinityBoosts: { chaos: 2, courage: 1 },
    preferredGiftIds: ['wizard-hat', 'tiny-cape', 'fake-mustache'],
    specialEncounterChance: 0.54,
    rareChanceBonus: 0,
    journalTone: 'funny',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 10, 27, 10, 31),
    encounter: {
      title: 'Pretend To Be Someone Else',
      description: 'The festival makes room for masks, costumes, and sillier versions of bravery.',
      affinity: 'chaos',
      optionSet: 'festival',
      memoryType: 'funny',
      importance: 3,
      mood: 'excited',
      resultStem: 'Mask Festival let Pettit try on a different kind of confidence for a little while.',
      memoryStem: 'Among masks and capes, Pettit discovered how fun pretending can be,',
      traitEffects: { courage: 1, chaos: 1 },
    },
  },
  {
    key: 'wanderers-week',
    title: "Wanderer's Week",
    kind: 'week',
    flavorText: 'The world feels a little larger this week, and Pettit keeps finding reasons to keep going.',
    accentColor: '#73c8b5',
    timingLabel: 'This Week',
    affinityBoosts: { curiosity: 2, courage: 2, trust: 1 },
    preferredGiftIds: ['star-map', 'compass', 'binoculars', 'small-backpack'],
    specialEncounterChance: 0.48,
    rareChanceBonus: 0.08,
    journalTone: 'excited',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 6, 1, 6, 7),
    encounter: {
      title: 'A Longer Road',
      description: 'During Wanderer’s Week, even a familiar path seems to continue farther than usual.',
      affinity: 'courage',
      optionSet: 'brave',
      memoryType: 'adventure',
      importance: 3,
      mood: 'excited',
      resultStem: "Wanderer's Week stretched the horizon in exactly the way Pettit had hoped for.",
      memoryStem: 'While the roads felt especially inviting this week, Pettit kept going,',
      traitEffects: { curiosity: 1, courage: 1 },
    },
  },
  {
    key: 'library-week',
    title: 'Library Week',
    kind: 'week',
    flavorText: 'Books, maps, recipes, and old legends all feel a little easier to stumble into this week.',
    accentColor: '#8ca1f3',
    timingLabel: 'This Week',
    affinityBoosts: { curiosity: 3, trust: 1 },
    preferredGiftIds: ['adventure-book', 'nature-guide', 'story-book', 'puzzle-book', 'star-map', 'story-collection', 'adventure-journal', 'plant-guide'],
    specialEncounterChance: 0.46,
    rareChanceBonus: 0,
    journalTone: 'reflective',
    preferOldMemories: false,
    match: (date) => isWithinUtcRange(date, 1, 15, 1, 21),
    encounter: {
      title: 'A Shelf Full Of Clues',
      description: 'Library Week makes every shelf feel like a map to somewhere else.',
      affinity: 'curiosity',
      optionSet: 'wonder',
      memoryType: 'learning',
      importance: 3,
      mood: 'curious',
      resultStem: 'Library Week made learning feel like a kind of exploration all by itself.',
      memoryStem: 'Between maps, recipes, and fairy tales, Pettit found more questions to love,',
      traitEffects: { curiosity: 1 },
    },
  },
  {
    key: 'surprise-day',
    title: 'Surprise Day',
    kind: 'special',
    flavorText: 'Nobody knew this was coming, which seems to be part of the fun.',
    accentColor: '#ffd983',
    timingLabel: 'Surprise',
    affinityBoosts: { chaos: 2, curiosity: 1 },
    preferredGiftIds: ['birthday-hat', 'wizard-hat', 'squeaky-duck'],
    specialEncounterChance: 0.7,
    rareChanceBonus: 0.05,
    journalTone: 'funny',
    preferOldMemories: false,
    match: (date, progress) => progress.surpriseDayYear[String(date.getUTCFullYear())] === getDateKey(date),
    encounter: {
      title: 'A Completely Unexpected Day',
      description: 'Confetti, ducks, cake, or absolutely nothing at all. Surprise Day refuses to explain itself.',
      affinity: 'seasonal',
      optionSet: 'festival',
      memoryType: 'special',
      importance: 4,
      mood: 'excited',
      resultStem: 'Surprise Day somehow felt perfectly satisfying without making sense.',
      memoryStem: 'When Surprise Day arrived out of nowhere, Pettit leaned into the mystery,',
      traitEffects: { chaos: 1, curiosity: 1 },
    },
  },
  {
    key: 'shooting-star-night',
    title: 'Shooting Star Night',
    kind: 'special',
    flavorText: 'For one night, the sky feels close enough for wishes to matter again.',
    accentColor: '#7fb4ff',
    timingLabel: 'Rare Night',
    affinityBoosts: { curiosity: 2, courage: 1 },
    preferredGiftIds: ['star-map', 'lantern', 'compass'],
    specialEncounterChance: 0.68,
    rareChanceBonus: 0.08,
    journalTone: 'wishful',
    preferOldMemories: false,
    match: (date, progress) => progress.shootingStarYear[String(date.getUTCFullYear())] === getDateKey(date),
    encounter: {
      title: 'Make A Wish',
      description: 'The sky is alive tonight, and every falling light makes the world feel briefly impossible.',
      affinity: 'curiosity',
      optionSet: 'wonder',
      memoryType: 'special',
      importance: 4,
      mood: 'thoughtful',
      resultStem: 'Shooting Star Night gave Pettit a reason to look up and stay there a while.',
      memoryStem: 'As the stars kept falling, Pettit held still long enough to make a wish,',
      traitEffects: { curiosity: 1, courage: 1 },
    },
  },
  {
    key: 'blue-moon-feast',
    title: 'Blue Moon Feast',
    kind: 'legendary',
    flavorText: 'A once-in-a-while gathering under a rare moon, remembered for years afterward.',
    accentColor: '#88b7ff',
    timingLabel: 'Legendary',
    affinityBoosts: { trust: 2, curiosity: 2 },
    preferredGiftIds: ['camp-mug', 'tiny-flag', 'lantern'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'wishful',
    preferOldMemories: true,
    match: () => false,
    encounter: {
      title: 'Feast Beneath A Blue Moon',
      description: 'The sky itself feels like part of the celebration.',
      affinity: 'seasonal',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'thoughtful',
      resultStem: 'The Blue Moon Feast felt too rare to hurry through.',
      memoryStem: 'Under a blue moon, Pettit stepped into a feast the community would talk about for ages,',
      traitEffects: { trust: 1, curiosity: 1 },
    },
  },
  {
    key: 'rainbow-bloom',
    title: 'Rainbow Bloom',
    kind: 'legendary',
    flavorText: 'Fields burst into impossible color for just long enough to leave everyone wondering if it truly happened.',
    accentColor: '#ff9fd9',
    timingLabel: 'Legendary',
    affinityBoosts: { curiosity: 3 },
    preferredGiftIds: ['flower-crown', 'palette', 'paintbrush'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'vibrant',
    preferOldMemories: false,
    match: () => false,
    encounter: {
      title: 'Walk Through Rainbow Bloom',
      description: 'The meadow erupts into color no one can quite explain.',
      affinity: 'curiosity',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'curious',
      resultStem: 'Rainbow Bloom made the world feel astonishingly generous.',
      memoryStem: 'Among impossible colors, Pettit walked carefully and kept looking back,',
      traitEffects: { curiosity: 2 },
    },
  },
  {
    key: 'butterfly-migration',
    title: 'Butterfly Migration',
    kind: 'legendary',
    flavorText: 'A whole living cloud passes through, and the day falls quiet on purpose.',
    accentColor: '#f7bf76',
    timingLabel: 'Legendary',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['painted-pebble', 'nature-guide', 'flower-crown'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'quiet',
    preferOldMemories: false,
    match: () => false,
    encounter: {
      title: 'Stand Beneath The Butterflies',
      description: 'The air fills with wings until standing still feels like the right kind of bravery.',
      affinity: 'seasonal',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'thoughtful',
      resultStem: 'The Butterfly Migration left Pettit quieter than before, but fuller too.',
      memoryStem: 'As butterflies drifted overhead in impossible numbers, Pettit stayed very still,',
      traitEffects: { trust: 1, curiosity: 1 },
    },
  },
  {
    key: 'crystal-frost',
    title: 'Crystal Frost',
    kind: 'legendary',
    flavorText: 'By morning, everything gleams like it was remade from glass and patience.',
    accentColor: '#b8f1ff',
    timingLabel: 'Legendary',
    affinityBoosts: { courage: 2, trust: 1 },
    preferredGiftIds: ['wool-hat', 'blanket', 'pocket-torch'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'reflective',
    preferOldMemories: false,
    match: () => false,
    encounter: {
      title: 'Wake To Crystal Frost',
      description: 'Every branch and fence glitters with a beauty that feels almost too fragile to touch.',
      affinity: 'courage',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'thoughtful',
      resultStem: 'Crystal Frost made the morning feel sacred without saying a word.',
      memoryStem: 'When crystal frost covered everything in sight, Pettit moved with unusual care,',
      traitEffects: { courage: 1, trust: 1 },
    },
  },
  {
    key: 'ancient-forest-awakening',
    title: 'Ancient Forest Awakening',
    kind: 'legendary',
    flavorText: 'The forest feels old, aware, and only barely willing to let anyone witness it.',
    accentColor: '#76be88',
    timingLabel: 'Legendary',
    affinityBoosts: { curiosity: 2, courage: 2 },
    preferredGiftIds: ['walking-stick', 'rope', 'lantern'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'reflective',
    preferOldMemories: true,
    match: () => false,
    encounter: {
      title: 'Hear The Forest Wake',
      description: 'Ancient roots, slow creaks, and a sense that the woods are paying attention back.',
      affinity: 'courage',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'nervous',
      resultStem: 'The forest awakening left Pettit awed in a way that lingered long after the sound had passed.',
      memoryStem: 'While the old forest stirred awake, Pettit tried not to waste the moment,',
      traitEffects: { curiosity: 1, courage: 1 },
    },
  },
  {
    key: 'comet-night',
    title: 'Comet Night',
    kind: 'legendary',
    flavorText: 'The sky writes something bright and unrepeatable over Pettit’s whole world.',
    accentColor: '#8bc5ff',
    timingLabel: 'Legendary',
    affinityBoosts: { curiosity: 2, courage: 1 },
    preferredGiftIds: ['star-map', 'compass', 'binoculars'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'wishful',
    preferOldMemories: false,
    match: () => false,
    encounter: {
      title: 'Watch The Comet',
      description: 'A bright trail crosses the sky and changes the whole mood of the night.',
      affinity: 'curiosity',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'thoughtful',
      resultStem: 'Comet Night gave Pettit the feeling that the sky was trying to say something kind.',
      memoryStem: 'Under the comet’s passing light, Pettit stayed up longer than usual,',
      traitEffects: { curiosity: 1, courage: 1 },
    },
  },
  {
    key: 'festival-of-forgotten-names',
    title: 'Festival of Forgotten Names',
    kind: 'legendary',
    flavorText: 'Old names, half-remembered stories, and strange belonging drift through the air.',
    accentColor: '#d3a1ff',
    timingLabel: 'Legendary',
    affinityBoosts: { trust: 2, curiosity: 1 },
    preferredGiftIds: ['story-book', 'story-collection', 'wooden-charm', 'tiny-flag', 'founders-coin'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'reflective',
    preferOldMemories: true,
    match: () => false,
    encounter: {
      title: 'Speak The Old Names',
      description: 'The celebration turns memory itself into something that can be gathered around.',
      affinity: 'community',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'thoughtful',
      resultStem: 'The Festival of Forgotten Names made even lost things feel welcomed back.',
      memoryStem: 'As older names were spoken again, Pettit felt history leaning close,',
      traitEffects: { trust: 1, curiosity: 1 },
    },
  },
  {
    key: 'night-of-a-thousand-lanterns',
    title: 'Night of a Thousand Lanterns',
    kind: 'legendary',
    flavorText: 'Lantern light spills everywhere until even the dark seems willing to help.',
    accentColor: '#f0c26c',
    timingLabel: 'Legendary',
    affinityBoosts: { trust: 2, courage: 1 },
    preferredGiftIds: ['lantern', 'pocket-torch', 'camp-mug'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'intimate',
    preferOldMemories: true,
    match: () => false,
    encounter: {
      title: 'Follow The Lantern River',
      description: 'So many lanterns glow at once that the whole night seems to soften.',
      affinity: 'community',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'thoughtful',
      resultStem: 'The Night of a Thousand Lanterns gave Pettit a kind of calm it could hardly explain.',
      memoryStem: 'Walking among endless lantern light, Pettit found the dark much easier to trust,',
      traitEffects: { trust: 1, courage: 1 },
    },
  },
  {
    key: 'whispering-woods',
    title: 'Whispering Woods',
    kind: 'legendary',
    flavorText: 'The woods are talking tonight. Whether they mean to be heard is harder to say.',
    accentColor: '#70a87d',
    timingLabel: 'Legendary',
    affinityBoosts: { curiosity: 2, courage: 1 },
    preferredGiftIds: ['lantern', 'walking-stick', 'compass'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'reflective',
    preferOldMemories: false,
    match: () => false,
    encounter: {
      title: 'Listen To The Woods',
      description: 'Every leaf and branch seems to be carrying a message tonight.',
      affinity: 'courage',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'nervous',
      resultStem: 'Whispering Woods left Pettit wondering whether being listened to is different from being watched.',
      memoryStem: 'With the woods whispering around it, Pettit listened back as carefully as it could,',
      traitEffects: { curiosity: 1, courage: 1 },
    },
  },
  {
    key: 'constellation-festival',
    title: 'Constellation Festival',
    kind: 'legendary',
    flavorText: 'The sky becomes the main event, and everyone keeps pointing upward at once.',
    accentColor: '#87a6ff',
    timingLabel: 'Legendary',
    affinityBoosts: { curiosity: 3 },
    preferredGiftIds: ['star-map', 'binoculars', 'lantern'],
    specialEncounterChance: 0.9,
    rareChanceBonus: 0.15,
    journalTone: 'wishful',
    preferOldMemories: false,
    match: () => false,
    encounter: {
      title: 'Read The Constellations',
      description: 'The festival turns the sky itself into a storybook.',
      affinity: 'curiosity',
      optionSet: 'legendary',
      memoryType: 'special',
      importance: 5,
      mood: 'curious',
      resultStem: 'Constellation Festival made the night feel wonderfully readable.',
      memoryStem: 'As everyone traced stories in the stars, Pettit kept finding new patterns to love,',
      traitEffects: { curiosity: 2 },
    },
  },
];

const EVENT_MAP = new Map(EVENT_DEFINITIONS.map((definition) => [definition.key, definition]));

const ensureAnnualRandoms = (state: PettitState, date: Date): PettitState => {
  const year = date.getUTCFullYear();
  const yearKey = String(year);
  const progress = state.seasonalProgress;
  let changed = false;
  const nextProgress: PettitSeasonalProgress = {
    ...progress,
    surpriseDayYear: { ...progress.surpriseDayYear },
    shootingStarYear: { ...progress.shootingStarYear },
    legendaryEventYear: { ...progress.legendaryEventYear },
  };

  if (!nextProgress.surpriseDayYear[yearKey]) {
    const totalDays = getDaysInUtcYear(year);
    const dayOfYear = (stringToSeed(`${state.id}|surprise|${year}`) % totalDays) + 1;
    nextProgress.surpriseDayYear[yearKey] = getDateFromDayOfYear(year, dayOfYear);
    changed = true;
  }

  if (!nextProgress.shootingStarYear[yearKey]) {
    const totalDays = getDaysInUtcYear(year);
    const dayOfYear = (stringToSeed(`${state.id}|shooting-star|${year}`) % totalDays) + 1;
    nextProgress.shootingStarYear[yearKey] = getDateFromDayOfYear(year, dayOfYear);
    changed = true;
  }

  if (!(yearKey in nextProgress.legendaryEventYear)) {
    const chanceRoll = stringToSeed(`${state.id}|legendary-chance|${year}`) % 100;

    if (chanceRoll < LEGENDARY_EVENT_CHANCE_PERCENT) {
      const keyIndex = stringToSeed(`${state.id}|legendary-key|${year}`) % LEGENDARY_EVENT_KEYS.length;
      const dateSeed = stringToSeed(`${state.id}|legendary-date|${year}`);
      const totalDays = getDaysInUtcYear(year);
      const dayOfYear = (dateSeed % totalDays) + 1;
      const chosenKey = LEGENDARY_EVENT_KEYS[keyIndex] ?? LEGENDARY_EVENT_KEYS[0]!;
      nextProgress.legendaryEventYear[yearKey] = `${chosenKey}|${getDateFromDayOfYear(year, dayOfYear)}`;
    } else {
      nextProgress.legendaryEventYear[yearKey] = null;
    }

    changed = true;
  }

  return changed ? { ...state, seasonalProgress: nextProgress } : state;
};

const getLegendaryEventForDate = (
  date: Date,
  progress: PettitSeasonalProgress
): SeasonalEventDefinition | null => {
  const encoded = progress.legendaryEventYear[String(date.getUTCFullYear())];

  if (!encoded) {
    return null;
  }

  const [eventKey, dateKey] = encoded.split('|');

  if (dateKey !== getDateKey(date)) {
    return null;
  }

  const definition = EVENT_MAP.get(eventKey as SeasonalEventKey);
  return definition?.kind === 'legendary' ? definition : null;
};

const getActiveDefinition = (
  state: PettitState,
  date: Date
): SeasonalEventDefinition | null => {
  const legendary = getLegendaryEventForDate(date, state.seasonalProgress);

  if (legendary) {
    return legendary;
  }

  const matchingDefinitions = EVENT_DEFINITIONS.filter((definition) => {
    if (definition.key === 'pettit-day') {
      const { month, day } = getPettitBirthdayMonthDay(state.createdAt);
      return isSameUtcDay(date, month, day);
    }

    return definition.kind !== 'legendary' && definition.match(date, state.seasonalProgress);
  });

  return matchingDefinitions[0] ?? null;
};

const buildInventoryGift = (
  inventory: PettitInventoryItem[],
  giftId: string,
  source: string
): PettitInventoryItem => {
  const gift = getGiftById(giftId);

  return {
    id: `inventory-${inventory.length + 1}`,
    giftId: gift.id,
    name: gift.name,
    description: gift.description,
    category: gift.category,
    source,
    obtainedAt: new Date().toISOString(),
  };
};

const getBirthdayGiftId = (): string => 'birthday-hat';

export const syncSeasonalState = (
  state: PettitState,
  date: Date = new Date()
): { state: PettitState; activeEvent: ActiveSeasonalEventView | null; changed: boolean } => {
  let nextState = ensureAnnualRandoms(state, date);
  let changed = nextState !== state;
  const definition = getActiveDefinition(nextState, date);
  const currentEventKey = definition?.key ?? null;
  const progress = nextState.seasonalProgress;
  const nextProgress: PettitSeasonalProgress = {
    ...progress,
    lastSeenEventKeys: [...progress.lastSeenEventKeys],
    pettitDayGiftGrantedYears: [...progress.pettitDayGiftGrantedYears],
  };

  if (progress.activeEventKey !== currentEventKey) {
    nextProgress.activeEventKey = currentEventKey;
    changed = true;

    if (definition && nextProgress.lastSeenEventKeys[0] !== definition.key) {
      nextProgress.lastSeenEventKeys = [definition.key, ...nextProgress.lastSeenEventKeys.filter((key) => key !== definition.key)].slice(0, 12);
    }
  }

  if (definition?.key === 'pettit-day') {
    const yearKey = String(date.getUTCFullYear());
    const birthdayGiftId = getBirthdayGiftId();
    const alreadyGranted = nextProgress.pettitDayGiftGrantedYears.includes(yearKey);
    const alreadyOwned = nextState.inventory.some((item) => item.giftId === birthdayGiftId);

    if (!alreadyGranted) {
      nextProgress.pettitDayGiftGrantedYears.push(yearKey);
      changed = true;

      if (!alreadyOwned) {
        nextState = {
          ...nextState,
          inventory: [...nextState.inventory, buildInventoryGift(nextState.inventory, birthdayGiftId, 'Pettit Day')],
        };
      }
    }
  }

  if (changed) {
    nextState = {
      ...nextState,
      seasonalProgress: nextProgress,
    };
  }

  return {
    state: nextState,
    activeEvent: definition
      ? {
          key: definition.key,
        title: definition.title,
        kind: definition.kind,
        timingLabel: definition.timingLabel,
        flavorText: personalizePettitText(nextState, definition.flavorText),
        accentColor: definition.accentColor,
      }
      : null,
    changed,
  };
};

export const getSeasonalProgressView = (
  state: PettitState,
  date: Date = new Date()
): SeasonalProgressView => {
  const { state: syncedState, activeEvent } = syncSeasonalState(state, date);

  return {
    activeEvent,
    recentEventKeys: syncedState.seasonalProgress.lastSeenEventKeys,
  };
};

export const getSeasonalEncounterModifier = (
  state: PettitState,
  date: Date = new Date()
): SeasonalEncounterModifier => {
  const { activeEvent } = syncSeasonalState(state, date);

  if (!activeEvent) {
    return {
      activeEvent: null,
      affinityBoosts: {},
      preferredGiftIds: [],
      seasonalEncounterChance: 0,
      rareChanceBonus: 0,
      journalTone: undefined,
      preferOldMemories: false,
    };
  }

  const definition = EVENT_MAP.get(activeEvent.key)!;

  return {
    activeEvent,
    affinityBoosts: definition.affinityBoosts,
    preferredGiftIds: definition.preferredGiftIds,
    seasonalEncounterChance: definition.specialEncounterChance,
    rareChanceBonus: definition.rareChanceBonus,
    journalTone: definition.journalTone,
    preferOldMemories: definition.preferOldMemories ?? false,
  };
};

export const getSeasonalEncounterTemplates = (
  state: PettitState,
  date: Date = new Date()
): readonly EncounterTemplate[] => {
  const { activeEvent } = syncSeasonalState(state, date);

  if (!activeEvent) {
    return [];
  }

  const definition = EVENT_MAP.get(activeEvent.key);
  return definition ? [buildEncounterTemplate(definition.key, definition.encounter)] : [];
};

export const getSeasonalEncounterTemplateById = (templateId: string): EncounterTemplate | null => {
  if (!templateId.startsWith('encounter-seasonal-')) {
    return null;
  }

  const eventKey = templateId.slice('encounter-seasonal-'.length) as SeasonalEventKey;
  const definition = EVENT_MAP.get(eventKey);

  return definition ? buildEncounterTemplate(definition.key, definition.encounter) : null;
};

export const getSeasonalJournalContext = (
  state: PettitState,
  date: Date = new Date()
): SeasonalJournalContext | null => {
  const { activeEvent } = syncSeasonalState(state, date);

  if (!activeEvent) {
    return null;
  }

  const definition = EVENT_MAP.get(activeEvent.key);

  if (!definition) {
    return null;
  }

  return {
    key: definition.key,
    title: definition.title,
    tone: definition.journalTone,
    preferOldMemories: definition.preferOldMemories ?? false,
  };
};

export const getSeasonalPreferredGiftIds = (
  state: PettitState,
  date: Date = new Date()
): readonly string[] => {
  const { activeEvent } = syncSeasonalState(state, date);

  if (!activeEvent) {
    return [];
  }

  return EVENT_MAP.get(activeEvent.key)?.preferredGiftIds ?? [];
};
