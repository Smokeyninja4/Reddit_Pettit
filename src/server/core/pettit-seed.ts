import type {
  ActiveEncounter,
  EncounterAffinity,
  EncounterSeason,
  EncounterTemplate,
  PettitDailyCycle,
  PettitState,
  PettitStats,
  PettitTraits,
  TraitKey,
} from '../../shared/pettit';
import { getGiftEncounterTemplateById, isGiftEncounterTemplateId } from './pettit-gifts';
import { getNamingEncounterTemplateById, isNamingEncounterTemplateId } from './pettit-naming';

type EncounterSeed = {
  id: string;
  title: string;
  description: string;
  affinity: EncounterAffinity;
  season?: EncounterSeason;
  isRare?: boolean;
  options: ReadonlyArray<{
    id: string;
    label: string;
  }>;
  outcomes: EncounterTemplate['outcomes'];
};

const DEFAULT_TRAITS: PettitTraits = {
  curiosity: 52,
  chaos: 28,
  trust: 47,
  courage: 44,
};

const LEGACY_TEMPLATE_ID_ALIASES: Record<string, string> = {
  'quest-cave': 'encounter-cave',
  'quest-stars': 'encounter-stars',
  'quest-traveller': 'encounter-traveller',
};

const curiosityTitles = [
  'Ancient Bell',
  'Lost Library',
  'Strange Tracks',
  'Hidden Door',
  'Old Telescope',
  'Forgotten Well',
  'Crystal Cavern',
  'Abandoned Windmill',
  'Glowing Pond',
  'Mysterious Map',
  'Broken Statue',
  'Echoing Tunnel',
  'Floating Lights',
  'Old Journal',
  'Hidden Garden',
] as const;

const trustTitles = [
  'Share Food',
  'Help Traveller',
  'Carry Supplies',
  'Protect Camp',
  'Watch Together',
  'Return Lost Toy',
  'Guide Lost Child',
  'Feed Hungry Bird',
  'Build Small Shelter',
  'Visit Elder',
  'Comfort Stranger',
  'Deliver Letter',
  'Plant New Tree',
  'Repair Broken Fence',
  'Welcome New Friend',
] as const;

const courageTitles = [
  'Cross Bridge',
  'Enter Cave',
  'Face Storm',
  'Climb Cliff',
  'Explore Ruins',
  'Walk Through Fog',
  'Cross Frozen River',
  'Stand Guard',
  'Follow Wolf Howl',
  'Investigate Smoke',
  'Descend Old Mine',
  'Save Trapped Animal',
  'Night Watch',
  'Cross Rope Bridge',
  'Enter Dark Woods',
] as const;

const chaosTitles = [
  'Eat Weird Mushroom',
  'Push Big Button',
  'Kick Rock',
  'Follow Goblin',
  'Open Sealed Box',
  'Taste Purple Berry',
  'Chase Fireflies',
  'Poke Sleeping Slime',
  'Ride Rolling Barrel',
  'Pull Random Lever',
  'Wear Strange Hat',
  'Touch Magic Crystal',
  'Drink Bubbling Potion',
  'Throw Stick Into Portal',
  'Press Glowing Rune',
] as const;

const rareTitles = [
  'Golden Egg',
  'Sleeping Giant',
  'Fallen Star',
  'Ghost Lantern',
  'Time Capsule',
  'Talking Tree',
  'Moon Rabbit',
  'Dragon Footprint',
  'Secret Door Beneath Pond',
  'Whispering Crown',
] as const;

const seasonalSeeds: ReadonlyArray<{ season: EncounterSeason; titles: readonly string[] }> = [
  { season: 'spring', titles: ['First Blossom', 'Singing Frogs', 'Bee Rescue'] },
  { season: 'summer', titles: ['Beach Treasure', 'Heatwave Shelter', 'Berry Harvest'] },
  { season: 'autumn', titles: ['Falling Leaves', 'Giant Pumpkin', 'Mushroom Circle'] },
  { season: 'winter', titles: ['Snow Tunnel', 'Ice Lantern', 'Lost Scarf'] },
];

const curiosityOptions = [
  { id: 'investigate', label: 'Investigate Closely' },
  { id: 'observe', label: 'Observe Quietly' },
  { id: 'ask', label: 'Ask Around' },
  { id: 'return-note', label: 'Return With Notes' },
] as const;

const trustOptions = [
  { id: 'help', label: 'Offer Help' },
  { id: 'share', label: 'Share Something' },
  { id: 'stay', label: 'Stay Together' },
  { id: 'support', label: 'Support From Nearby' },
] as const;

const courageOptions = [
  { id: 'enter', label: 'Go Forward' },
  { id: 'cross', label: 'Cross Carefully' },
  { id: 'stand', label: 'Stand Firm' },
  { id: 'retreat', label: 'Retreat Carefully' },
] as const;

const chaosOptions = [
  { id: 'press', label: 'Press It' },
  { id: 'taste', label: 'Try It' },
  { id: 'touch', label: 'Touch It' },
  { id: 'chase', label: 'Chase It' },
] as const;

const rareOptions = [
  { id: 'careful', label: 'Approach Carefully' },
  { id: 'bold', label: 'Be Bold' },
  { id: 'shared', label: 'Call The Community' },
  { id: 'mystery', label: 'Leave Some Mystery' },
] as const;

const seasonalOptions = [
  { id: 'gather', label: 'Gather Around' },
  { id: 'listen', label: 'Listen Closely' },
  { id: 'share', label: 'Share The Moment' },
] as const;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sentenceCaseTitle = (title: string): string => title.toLowerCase();

const makeEncounterSeed = (
  familyId: string,
  title: string,
  description: string,
  affinity: EncounterAffinity,
  options: typeof curiosityOptions | typeof trustOptions | typeof courageOptions | typeof chaosOptions | typeof rareOptions | typeof seasonalOptions,
  outcomes: EncounterTemplate['outcomes'],
  extras?: Pick<EncounterSeed, 'isRare' | 'season'>
): EncounterSeed => ({
  id: `encounter-${familyId}-${slugify(title)}`,
  title,
  description,
  affinity,
  season: extras?.season,
  isRare: extras?.isRare,
  options,
  outcomes,
});

const buildCuriosityEncounter = (title: string): EncounterSeed => {
  const lowerTitle = sentenceCaseTitle(title);
  return makeEncounterSeed(
    'curiosity',
    title,
    `${title} has Pettit leaning forward with questions. Which kind of curiosity should lead the way?`,
    'curiosity',
    curiosityOptions,
    [
      {
        optionId: 'investigate',
        resultText: `Pettit got close to ${lowerTitle} and came away with fresh clues and even fresher questions.`,
        memoryTitle: `Investigated ${title}`,
        memoryDescription: `The community encouraged Pettit to study ${lowerTitle} up close and turn wonder into discovery.`,
        memoryType: 'learning',
        importance: 3,
        mood: 'curious',
        traitEffects: { curiosity: 3, courage: 1 },
      },
      {
        optionId: 'observe',
        resultText: `Pettit watched ${lowerTitle} patiently until the small details began to explain themselves.`,
        memoryTitle: `Observed ${title}`,
        memoryDescription: `Pettit slowed down, paid attention, and found meaning in the shape of ${lowerTitle}.`,
        memoryType: 'special',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2 },
      },
      {
        optionId: 'ask',
        resultText: `Pettit asked the community about ${lowerTitle} and ended up with more stories than answers.`,
        memoryTitle: `Asked about ${title}`,
        memoryDescription: `Questions about ${lowerTitle} turned into a shared conversation and a warmer sense of wonder.`,
        memoryType: 'community',
        importance: 3,
        mood: 'curious',
        traitEffects: { curiosity: 2, trust: 1 },
      },
      {
        optionId: 'return-note',
        resultText: `Pettit made careful notes about ${lowerTitle} and promised to come back wiser next time.`,
        memoryTitle: `Kept notes on ${title}`,
        memoryDescription: `Pettit chose patient learning, carrying home a little record of ${lowerTitle} instead of rushing it.`,
        memoryType: 'learning',
        importance: 2,
        mood: 'thoughtful',
        traitEffects: { curiosity: 1, trust: 1 },
      },
    ]
  );
};

const buildTrustEncounter = (title: string): EncounterSeed => {
  const lowerTitle = sentenceCaseTitle(title);
  return makeEncounterSeed(
    'trust',
    title,
    `${title} gives Pettit a chance to decide what kindness should look like today.`,
    'trust',
    trustOptions,
    [
      {
        optionId: 'help',
        resultText: `Pettit stepped in to help with ${lowerTitle} and made the whole moment feel softer.`,
        memoryTitle: `Helped through ${title}`,
        memoryDescription: `The community guided Pettit toward direct kindness, turning ${lowerTitle} into a warm memory.`,
        memoryType: 'friendship',
        importance: 3,
        mood: 'excited',
        traitEffects: { trust: 3, courage: 1 },
      },
      {
        optionId: 'share',
        resultText: `Pettit shared what it could and discovered that generosity travels further than expected.`,
        memoryTitle: `Shared during ${title}`,
        memoryDescription: `Pettit chose to give something of its own, and ${lowerTitle} became a story about welcome.`,
        memoryType: 'community',
        importance: 3,
        mood: 'curious',
        traitEffects: { trust: 2 },
      },
      {
        optionId: 'stay',
        resultText: `Pettit stayed close through ${lowerTitle} until everyone seemed steadier.`,
        memoryTitle: `Stayed close for ${title}`,
        memoryDescription: `Sometimes simply remaining nearby was the kindest choice, and Pettit felt that clearly today.`,
        memoryType: 'friendship',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { trust: 2, courage: 1 },
      },
      {
        optionId: 'support',
        resultText: `Pettit supported ${lowerTitle} from a careful distance and still made the path easier.`,
        memoryTitle: `Supported ${title}`,
        memoryDescription: `The community chose gentle backup over big heroics, and Pettit learned that quiet care still counts.`,
        memoryType: 'community',
        importance: 2,
        mood: 'thoughtful',
        traitEffects: { trust: 1, curiosity: 1 },
      },
    ]
  );
};

const buildCourageEncounter = (title: string): EncounterSeed => {
  const lowerTitle = sentenceCaseTitle(title);
  return makeEncounterSeed(
    'courage',
    title,
    `${title} is the sort of moment that makes Pettit pause, breathe, and ask what bravery means today.`,
    'courage',
    courageOptions,
    [
      {
        optionId: 'enter',
        resultText: `Pettit moved into ${lowerTitle} with a brave little gulp and found the fear shrinking along the way.`,
        memoryTitle: `Braved ${title}`,
        memoryDescription: `The community chose forward motion, and Pettit discovered that bravery can arrive one step at a time.`,
        memoryType: 'adventure',
        importance: 4,
        mood: 'excited',
        traitEffects: { courage: 3, curiosity: 1 },
      },
      {
        optionId: 'cross',
        resultText: `Pettit handled ${lowerTitle} carefully, making it across without rushing the nerves away.`,
        memoryTitle: `Crossed ${title}`,
        memoryDescription: `Caution and courage worked together, and Pettit felt stronger for respecting both.`,
        memoryType: 'adventure',
        importance: 3,
        mood: 'nervous',
        traitEffects: { courage: 2, trust: 1 },
      },
      {
        optionId: 'stand',
        resultText: `Pettit held its ground through ${lowerTitle} until the world stopped feeling quite so large.`,
        memoryTitle: `Stood firm during ${title}`,
        memoryDescription: `The community asked Pettit to stay steady, and that steadiness turned into a memory worth keeping.`,
        memoryType: 'special',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { courage: 2 },
      },
      {
        optionId: 'retreat',
        resultText: `Pettit backed away from ${lowerTitle} carefully and turned caution into part of the lesson.`,
        memoryTitle: `Retreated from ${title}`,
        memoryDescription: `Not every brave choice means pushing ahead. Pettit learned that listening to fear can still be wise.`,
        memoryType: 'learning',
        importance: 2,
        mood: 'nervous',
        traitEffects: { trust: 1, curiosity: 1 },
      },
    ]
  );
};

const buildChaosEncounter = (title: string): EncounterSeed => {
  const lowerTitle = sentenceCaseTitle(title);
  return makeEncounterSeed(
    'chaos',
    title,
    `${title} looks like the kind of idea that could become either a great story or a terrible plan.`,
    'chaos',
    chaosOptions,
    [
      {
        optionId: 'press',
        resultText: `Pettit acted on instinct around ${lowerTitle}, and the result was confusing in a very memorable way.`,
        memoryTitle: `Messed with ${title}`,
        memoryDescription: `The community encouraged a wonderfully reckless choice, and Pettit got a strange story out of it.`,
        memoryType: 'funny',
        importance: 3,
        mood: 'excited',
        traitEffects: { chaos: 3, courage: 1 },
      },
      {
        optionId: 'taste',
        resultText: `Pettit gave ${lowerTitle} a try just to see what would happen, and that turned out to be plenty.`,
        memoryTitle: `Tried ${title}`,
        memoryDescription: `Curiosity and chaos tangled together around ${lowerTitle}, and Pettit laughed first and worried later.`,
        memoryType: 'funny',
        importance: 3,
        mood: 'curious',
        traitEffects: { chaos: 2, curiosity: 1 },
      },
      {
        optionId: 'touch',
        resultText: `Pettit tapped ${lowerTitle} and immediately learned why some mysteries come with warning signs.`,
        memoryTitle: `Touched ${title}`,
        memoryDescription: `A single impulsive choice turned ${lowerTitle} into a chaotic little legend for the day.`,
        memoryType: 'adventure',
        importance: 3,
        mood: 'nervous',
        traitEffects: { chaos: 2, courage: 1 },
      },
      {
        optionId: 'chase',
        resultText: `Pettit chased the energy of ${lowerTitle} until the whole scene became delightfully difficult to explain.`,
        memoryTitle: `Chased ${title}`,
        memoryDescription: `The community chose motion over caution, and Pettit ended up with a bright, unruly memory.`,
        memoryType: 'funny',
        importance: 4,
        mood: 'excited',
        traitEffects: { chaos: 2, trust: 1 },
      },
    ]
  );
};

const buildRareEncounter = (title: string): EncounterSeed => {
  const lowerTitle = sentenceCaseTitle(title);
  return makeEncounterSeed(
    'rare',
    title,
    `${title} does not feel like an everyday story. How should Pettit meet it?`,
    'rare',
    rareOptions,
    [
      {
        optionId: 'careful',
        resultText: `Pettit approached ${lowerTitle} with unusual care and left feeling changed in a quiet way.`,
        memoryTitle: `Approached ${title} Carefully`,
        memoryDescription: `The community treated ${lowerTitle} like something worth respecting, and Pettit felt that weight too.`,
        memoryType: 'special',
        importance: 5,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, trust: 1 },
      },
      {
        optionId: 'bold',
        resultText: `Pettit met ${lowerTitle} head-on and turned wonder into a brave little legend.`,
        memoryTitle: `Faced ${title}`,
        memoryDescription: `A rare moment asked for boldness, and Pettit answered with more heart than hesitation.`,
        memoryType: 'special',
        importance: 5,
        mood: 'excited',
        traitEffects: { courage: 2, curiosity: 1 },
      },
      {
        optionId: 'shared',
        resultText: `Pettit called the community into ${lowerTitle}, and the whole thing felt bigger because nobody held it alone.`,
        memoryTitle: `Shared ${title}`,
        memoryDescription: `The community turned a rare discovery into a collective story instead of a private secret.`,
        memoryType: 'community',
        importance: 5,
        mood: 'curious',
        traitEffects: { trust: 2, curiosity: 1 },
      },
      {
        optionId: 'mystery',
        resultText: `Pettit left part of ${lowerTitle} unexplained, and somehow the wonder lasted longer because of it.`,
        memoryTitle: `Left ${title} Unsolved`,
        memoryDescription: `Not every mystery needed conquering. Pettit let the rare moment stay a little wild.`,
        memoryType: 'special',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { chaos: 1, curiosity: 1 },
      },
    ],
    { isRare: true }
  );
};

const buildSeasonalEncounter = (season: EncounterSeason, title: string): EncounterSeed => {
  const seasonalDescription: Record<EncounterSeason, string> = {
    spring: `${title} makes the world feel newly awake. How should Pettit meet the season?`,
    summer: `${title} arrives with long light and lively energy. What should Pettit do with it?`,
    autumn: `${title} gives the day a softer edge and a little extra mystery.`,
    winter: `${title} asks Pettit to find warmth, care, or wonder in the cold.`,
  };

  return makeEncounterSeed(
    `${season}`,
    title,
    seasonalDescription[season],
    'seasonal',
    seasonalOptions,
    [
      {
        optionId: 'gather',
        resultText: `Pettit gathered close to ${sentenceCaseTitle(title)} and turned the season into something shared.`,
        memoryTitle: `Gathered for ${title}`,
        memoryDescription: `The community helped Pettit make ${sentenceCaseTitle(title)} feel welcoming and memorable.`,
        memoryType: 'community',
        importance: 3,
        mood: 'excited',
        traitEffects: { trust: 2 },
      },
      {
        optionId: 'listen',
        resultText: `Pettit listened closely to ${sentenceCaseTitle(title)} until the whole season seemed to say a little more.`,
        memoryTitle: `Listened to ${title}`,
        memoryDescription: `A quiet moment with ${sentenceCaseTitle(title)} left Pettit feeling thoughtful and a little wiser.`,
        memoryType: 'special',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2 },
      },
      {
        optionId: 'share',
        resultText: `Pettit shared ${sentenceCaseTitle(title)} with the community and made the day feel brighter for everyone.`,
        memoryTitle: `Shared ${title}`,
        memoryDescription: `Instead of keeping the moment alone, Pettit turned ${sentenceCaseTitle(title)} into a communal memory.`,
        memoryType: 'community',
        importance: 3,
        mood: 'curious',
        traitEffects: { trust: 1, courage: 1 },
      },
    ],
    { season }
  );
};

const TRANSITION_ENCOUNTERS: readonly EncounterSeed[] = [
  {
    id: 'encounter-cave',
    title: 'A Strange Cave',
    description: 'Pettit found a cave tucked behind a curtain of moss and would like a little advice.',
    affinity: 'courage',
    options: [
      { id: 'enter', label: 'Enter' },
      { id: 'observe', label: 'Observe' },
      { id: 'leave', label: 'Leave' },
      { id: 'ask-help', label: 'Ask For Help' },
    ],
    outcomes: [
      {
        optionId: 'enter',
        resultText: 'Pettit padded into the cave and found an old lantern beside a shallow puddle.',
        memoryTitle: 'Found a cave lantern',
        memoryDescription: 'The community encouraged Pettit to step into the cave and it came back with an old lantern.',
        memoryType: 'adventure',
        importance: 4,
        mood: 'excited',
        traitEffects: { courage: 3, curiosity: 2 },
        discoveredLandmarkId: 'mossy-cave',
      },
      {
        optionId: 'observe',
        resultText: 'Pettit stayed near the entrance and noticed odd tracks curving deeper into the dark.',
        memoryTitle: 'Studied cave tracks',
        memoryDescription: 'Pettit carefully watched the cave entrance and discovered unusual tracks in the dust.',
        memoryType: 'learning',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { curiosity: 3 },
        discoveredLandmarkId: 'mossy-cave',
      },
      {
        optionId: 'leave',
        resultText: 'Pettit decided the cave could wait and headed home with a story to tell instead.',
        memoryTitle: 'Left the cave alone',
        memoryDescription: 'The community chose caution, and Pettit turned back before the cave could become a problem.',
        memoryType: 'community',
        importance: 2,
        mood: 'nervous',
        traitEffects: { trust: 1 },
        discoveredLandmarkId: 'mossy-cave',
      },
      {
        optionId: 'ask-help',
        resultText: 'Pettit asked the community for backup and turned the cave into a group mystery.',
        memoryTitle: 'Asked the community for help',
        memoryDescription: 'Pettit chose not to explore alone and made the cave a shared investigation.',
        memoryType: 'community',
        importance: 4,
        mood: 'curious',
        traitEffects: { trust: 3, curiosity: 1 },
        discoveredLandmarkId: 'mossy-cave',
      },
    ],
  },
  {
    id: 'encounter-stars',
    title: 'Learn About Stars',
    description: 'The night sky has Pettit full of questions, and it wants to know where to begin.',
    affinity: 'curiosity',
    options: [
      { id: 'ask-questions', label: 'Ask Questions' },
      { id: 'read-book', label: 'Read A Book' },
      { id: 'observe-sky', label: 'Observe The Sky' },
    ],
    outcomes: [
      {
        optionId: 'ask-questions',
        resultText: 'Pettit spent the evening peppering everyone with star questions until the sky felt friendlier.',
        memoryTitle: 'Asked about the stars',
        memoryDescription: 'The community steered Pettit toward conversation, and it came away with new questions and bigger wonder.',
        memoryType: 'learning',
        importance: 3,
        mood: 'curious',
        traitEffects: { curiosity: 3, trust: 1 },
        discoveredLandmarkId: 'stargazing-hill',
      },
      {
        optionId: 'read-book',
        resultText: 'Pettit curled up with a weathered star book and read until the moon climbed higher.',
        memoryTitle: 'Read a book about stars',
        memoryDescription: 'Pettit learned from a book and ended the night feeling quietly wiser.',
        memoryType: 'learning',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, trust: 1 },
        discoveredLandmarkId: 'stargazing-hill',
      },
      {
        optionId: 'observe-sky',
        resultText: 'Pettit lay on the grass and watched the sky long enough to feel very small in a good way.',
        memoryTitle: 'Watched the night sky',
        memoryDescription: 'Pettit chose stillness and spent the night studying the stars directly.',
        memoryType: 'special',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, courage: 1 },
        discoveredLandmarkId: 'stargazing-hill',
      },
    ],
  },
  {
    id: 'encounter-traveller',
    title: 'Help A Traveller',
    description: 'A tired traveller has wandered by, and Pettit wants to decide the kindest way to help.',
    affinity: 'trust',
    options: [
      { id: 'guide', label: 'Guide Them' },
      { id: 'feed', label: 'Share Food' },
      { id: 'give-supplies', label: 'Give Supplies' },
    ],
    outcomes: [
      {
        optionId: 'guide',
        resultText: 'Pettit walked the traveller to the right path and made the road feel less lonely.',
        memoryTitle: 'Guided a traveller home',
        memoryDescription: 'Pettit chose to stay with a stranger until they were safe again.',
        memoryType: 'friendship',
        importance: 4,
        mood: 'excited',
        traitEffects: { trust: 2, courage: 2 },
        discoveredLandmarkId: 'traveller-road',
      },
      {
        optionId: 'feed',
        resultText: 'Pettit shared a simple meal and listened to the traveller\'s stories until sunset.',
        memoryTitle: 'Shared a meal with a traveller',
        memoryDescription: 'The community turned a passing stranger into a warm memory with one generous choice.',
        memoryType: 'friendship',
        importance: 3,
        mood: 'curious',
        traitEffects: { trust: 3 },
        discoveredLandmarkId: 'traveller-road',
      },
      {
        optionId: 'give-supplies',
        resultText: 'Pettit sent the traveller onward with supplies and the pleased feeling of having done something useful.',
        memoryTitle: 'Packed supplies for a traveller',
        memoryDescription: 'Pettit helped from a distance and still made the road ahead a little easier.',
        memoryType: 'community',
        importance: 3,
        mood: 'excited',
        traitEffects: { trust: 2, courage: 1 },
        discoveredLandmarkId: 'traveller-road',
      },
    ],
  },
];

// TODO: Replace the shared-pattern expansion pass with more handcrafted encounter-specific writing over time.
const STANDARD_ENCOUNTER_LIBRARY: readonly EncounterSeed[] = [
  ...TRANSITION_ENCOUNTERS,
  ...curiosityTitles.map((title) => buildCuriosityEncounter(title)),
  ...trustTitles.map((title) => buildTrustEncounter(title)),
  ...courageTitles.map((title) => buildCourageEncounter(title)),
  ...chaosTitles.map((title) => buildChaosEncounter(title)),
];

const RARE_ENCOUNTER_LIBRARY: readonly EncounterSeed[] = rareTitles.map((title) => buildRareEncounter(title));

const SEASONAL_ENCOUNTER_LIBRARY: readonly EncounterSeed[] = seasonalSeeds.flatMap((seasonSeed) =>
  seasonSeed.titles.map((title) => buildSeasonalEncounter(seasonSeed.season, title))
);

const ALL_ENCOUNTER_TEMPLATES: readonly EncounterTemplate[] = [
  ...STANDARD_ENCOUNTER_LIBRARY,
  ...RARE_ENCOUNTER_LIBRARY,
  ...SEASONAL_ENCOUNTER_LIBRARY,
];

const ENCOUNTER_TEMPLATE_MAP = new Map<string, EncounterTemplate>(
  ALL_ENCOUNTER_TEMPLATES.map((template) => [template.id, template])
);

const getUtcDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const getNextUtcMidnight = (date: Date): string => {
  const next = new Date(date);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
};

export const createDefaultDailyCycle = (date: Date = new Date()): PettitDailyCycle => ({
  currentDayKey: getUtcDayKey(date),
  nextResolveAt: getNextUtcMidnight(date),
  lastProcessedDayKey: getUtcDayKey(date),
});

export const createDefaultPettitState = (subredditName: string): PettitState => ({
  id: `pettit-${subredditName}`,
  name: 'Pettit',
  createdAt: new Date().toISOString(),
  ageDays: 0,
  mood: 'curious',
  traits: { ...DEFAULT_TRAITS },
  inventory: [],
  landmarks: [],
  activeEncounterId: `${TRANSITION_ENCOUNTERS[0]?.id ?? 'encounter-cave'}-1`,
  latestJournalId: null,
  dailyCycle: createDefaultDailyCycle(),
});

export const createDefaultStats = (): PettitStats => ({
  totalVotes: 0,
  journalCount: 0,
  memoryCount: 0,
  resolvedEncounterCount: 0,
});

export const getTopTraits = (traits: PettitTraits, limit: number): TraitKey[] =>
  (Object.entries(traits) as [TraitKey, number][])
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([traitKey]) => traitKey);

export const canonicalizeEncounterTemplateId = (templateId: string): string => {
  return LEGACY_TEMPLATE_ID_ALIASES[templateId] ?? templateId;
};

export const getCurrentSeason = (date = new Date()): EncounterSeason => {
  const month = date.getUTCMonth() + 1;

  if (month >= 3 && month <= 5) {
    return 'spring';
  }

  if (month >= 6 && month <= 8) {
    return 'summer';
  }

  if (month >= 9 && month <= 11) {
    return 'autumn';
  }

  return 'winter';
};

export const getEncounterTemplateById = (templateId: string): EncounterTemplate => {
  if (isNamingEncounterTemplateId(templateId)) {
    return getNamingEncounterTemplateById(templateId);
  }

  if (isGiftEncounterTemplateId(templateId)) {
    return getGiftEncounterTemplateById(templateId);
  }

  const canonicalId = canonicalizeEncounterTemplateId(templateId);
  const encounter = ENCOUNTER_TEMPLATE_MAP.get(canonicalId);

  if (!encounter) {
    throw new Error(`Unknown encounter template: ${templateId}`);
  }

  return encounter;
};

export const getStandardEncounterTemplates = (): readonly EncounterTemplate[] => STANDARD_ENCOUNTER_LIBRARY;

export const getRareEncounterTemplates = (): readonly EncounterTemplate[] => RARE_ENCOUNTER_LIBRARY;

export const getSeasonalEncounterTemplates = (date = new Date()): readonly EncounterTemplate[] => {
  const season = getCurrentSeason(date);
  return SEASONAL_ENCOUNTER_LIBRARY.filter((template) => template.season === season);
};

export const getAllEncounterTemplates = (): readonly EncounterTemplate[] => ALL_ENCOUNTER_TEMPLATES;

export const createEncounterInstanceFromTemplate = (
  template: EncounterTemplate,
  sequenceNumber: number
): ActiveEncounter => ({
  id: `${template.id}-${sequenceNumber}`,
  templateId: template.id,
  title: template.title,
  description: template.description,
  affinity: template.affinity,
  season: template.season,
  isRare: template.isRare,
  createdAt: new Date().toISOString(),
  options: template.options.map((option) => ({
    id: option.id,
    label: option.label,
    votes: 0,
  })),
});
