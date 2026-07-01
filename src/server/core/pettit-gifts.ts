import type { EncounterTemplate, GiftCategory, PettitInventoryItem, TraitKey } from '../../shared/pettit';

export type GiftDefinition = {
  id: string;
  name: string;
  description: string;
  category: GiftCategory;
  moodLine: string;
  traitEffects: Partial<Record<TraitKey, number>>;
  seasonalOnly?: boolean;
};

const GIFT_ENCOUNTER_PREFIX = 'encounter-gift:';
const LEGACY_GIFT_QUEST_PREFIX = 'quest-gift:';
const COMMUNITY_GIFT_PREFIX = 'community-gift:';

const GIFT_LIBRARY: readonly GiftDefinition[] = [
  {
    id: 'adventure-book',
    name: 'Adventure Book',
    description: 'A dog-eared book full of brave journeys, cliffside paths, and hopeful endings.',
    category: 'books',
    moodLine: 'Pettit opened the adventure book at once and started imagining distant paths with a delighted little gasp.',
    traitEffects: { courage: 1, curiosity: 1 },
  },
  {
    id: 'nature-guide',
    name: 'Nature Guide',
    description: 'A gentle field guide for leaves, feathers, tracks, and tiny wonders.',
    category: 'books',
    moodLine: 'Pettit turned each page carefully, then kept glancing outside as if the whole world had become easier to notice.',
    traitEffects: { curiosity: 1, trust: 1 },
  },
  {
    id: 'story-book',
    name: 'Story Book',
    description: 'A cozy story book made for curled-up afternoons and soft imagination.',
    category: 'books',
    moodLine: 'Pettit held the story book close and looked very pleased by the thought of so many tales waiting inside.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'puzzle-book',
    name: 'Puzzle Book',
    description: 'A playful little book full of riddles, mazes, and thoughtful detours.',
    category: 'books',
    moodLine: 'Pettit frowned at the puzzle book for exactly one second before getting completely absorbed in it.',
    traitEffects: { curiosity: 1, chaos: 1 },
  },
  {
    id: 'star-map',
    name: 'Star Map',
    description: 'A folded map of constellations for late-night wondering and skyward questions.',
    category: 'books',
    moodLine: 'Pettit spread the star map wide and immediately started matching its tiny patterns to the night above.',
    traitEffects: { curiosity: 1 },
  },
  {
    id: 'straw-hat',
    name: 'Straw Hat',
    description: 'A sunny little hat that makes every walk feel softer and friendlier.',
    category: 'clothing',
    moodLine: 'Pettit tipped the straw hat forward with such seriousness that it somehow made the whole moment sweeter.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'wool-hat',
    name: 'Wool Hat',
    description: 'A warm wool hat for chilly air, rosy cheeks, and brave little outings.',
    category: 'clothing',
    moodLine: 'Pettit pulled the wool hat down over its head and immediately looked much more prepared for the weather.',
    traitEffects: { courage: 1 },
  },
  {
    id: 'wizard-hat',
    name: 'Wizard Hat',
    description: 'A floppy starry hat with exactly the right amount of nonsense.',
    category: 'clothing',
    moodLine: 'Pettit put on the wizard hat and began behaving as though every ordinary object might secretly be magical.',
    traitEffects: { chaos: 1, curiosity: 1 },
  },
  {
    id: 'explorer-hat',
    name: 'Explorer Hat',
    description: 'A practical little hat for peering into bushes, maps, and mysteries.',
    category: 'clothing',
    moodLine: 'Pettit settled the explorer hat into place and instantly looked ready to follow even the smallest clue.',
    traitEffects: { courage: 1, curiosity: 1 },
  },
  {
    id: 'tiny-cape',
    name: 'Tiny Cape',
    description: 'A dramatic cape sized perfectly for very important small adventures.',
    category: 'clothing',
    moodLine: 'Pettit swished the tiny cape behind itself and seemed delighted by how heroic the breeze suddenly felt.',
    traitEffects: { courage: 1, chaos: 1 },
  },
  {
    id: 'birthday-hat',
    name: 'Birthday Hat',
    description: 'A tiny party hat that makes even ordinary moments feel a little celebratory.',
    category: 'clothing',
    moodLine: 'Pettit wore the birthday hat with very serious joy, which somehow made it even sweeter.',
    traitEffects: { trust: 1, chaos: 1 },
    seasonalOnly: true,
  },
  {
    id: 'flower-crown',
    name: 'Flower Crown',
    description: 'A soft crown of fresh flowers that makes the whole day feel gentler.',
    category: 'clothing',
    moodLine: 'Pettit tucked itself beneath the flower crown and looked wonderfully pleased with the whole arrangement.',
    traitEffects: { curiosity: 1, trust: 1 },
    seasonalOnly: true,
  },
  {
    id: 'small-backpack',
    name: 'Small Backpack',
    description: 'A sturdy little backpack for carrying future discoveries.',
    category: 'clothing',
    moodLine: 'Pettit wiggled happily into the backpack straps and immediately started planning adventures.',
    traitEffects: { courage: 1 },
  },
  {
    id: 'lantern',
    name: 'Lantern',
    description: 'A warm lantern for caves, twilight walks, and brave ideas.',
    category: 'tools',
    moodLine: 'Pettit held the lantern close and made the dark feel a little friendlier.',
    traitEffects: { courage: 1, trust: 1 },
  },
  {
    id: 'walking-stick',
    name: 'Walking Stick',
    description: 'A smooth walking stick for steady paths and longer rambles.',
    category: 'tools',
    moodLine: 'Pettit tested the walking stick against the ground a few times and seemed quietly pleased by the sturdiness of it.',
    traitEffects: { courage: 1 },
  },
  {
    id: 'compass',
    name: 'Compass',
    description: 'A pocket compass for crossroads, wandering, and finding the next good direction.',
    category: 'tools',
    moodLine: 'Pettit watched the compass needle settle and looked comforted by the idea that some things can still point true.',
    traitEffects: { curiosity: 1, courage: 1 },
  },
  {
    id: 'binoculars',
    name: 'Binoculars',
    description: 'A tiny pair of binoculars for birdwatching, horizon-checking, and distant curiosity.',
    category: 'tools',
    moodLine: 'Pettit lifted the binoculars with both paws and immediately found ten new things worth noticing.',
    traitEffects: { curiosity: 1 },
  },
  {
    id: 'paintbrush',
    name: 'Paintbrush',
    description: 'A little paintbrush for bright ideas, careful dabs, and unnecessary creativity.',
    category: 'tools',
    moodLine: 'Pettit held the paintbrush like it had just been trusted with an important secret.',
    traitEffects: { curiosity: 1, chaos: 1 },
    seasonalOnly: true,
  },
  {
    id: 'easel',
    name: 'Easel',
    description: 'A tiny easel for turning small moments into something worth looking at twice.',
    category: 'tools',
    moodLine: 'Pettit kept stepping back from the easel as though admiring a masterpiece it had not made yet.',
    traitEffects: { curiosity: 1, trust: 1 },
    seasonalOnly: true,
  },
  {
    id: 'palette',
    name: 'Palette',
    description: 'A bright little palette that makes color feel like an invitation.',
    category: 'tools',
    moodLine: 'Pettit stared at the palette with a look that suggested every color deserved a turn.',
    traitEffects: { curiosity: 1, chaos: 1 },
    seasonalOnly: true,
  },
  {
    id: 'paper-windmill',
    name: 'Paper Windmill',
    description: 'A cheerful little windmill that seems happiest when the day refuses to stand still.',
    category: 'tools',
    moodLine: 'Pettit watched the paper windmill spin and immediately started trusting the breeze a little more.',
    traitEffects: { curiosity: 1, courage: 1 },
    seasonalOnly: true,
  },
  {
    id: 'honey-jar',
    name: 'Honey Jar',
    description: 'A tiny jar of golden honey that feels like warmth you can carry around.',
    category: 'tools',
    moodLine: 'Pettit cradled the honey jar carefully, as though sweetness deserved proper respect.',
    traitEffects: { trust: 1 },
    seasonalOnly: true,
  },
  {
    id: 'teddy-bear',
    name: 'Teddy Bear',
    description: 'A worn little teddy bear that feels like comfort made visible.',
    category: 'toys',
    moodLine: 'Pettit hugged the teddy bear right away and looked as though it had been trusted with something precious.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'wooden-sword',
    name: 'Wooden Sword',
    description: 'A harmless wooden sword for pretend heroics and brave little poses.',
    category: 'toys',
    moodLine: 'Pettit brandished the wooden sword with great enthusiasm and only a modest amount of balance.',
    traitEffects: { courage: 1, chaos: 1 },
  },
  {
    id: 'toy-boat',
    name: 'Toy Boat',
    description: 'A toy boat meant for puddles, creeks, and patient floating.',
    category: 'toys',
    moodLine: 'Pettit set the toy boat down carefully and watched it as though even tiny journeys deserved respect.',
    traitEffects: { curiosity: 1, trust: 1 },
  },
  {
    id: 'yo-yo',
    name: 'Yo-Yo',
    description: 'A bright yo-yo for restless paws and cheerful distractions.',
    category: 'toys',
    moodLine: 'Pettit spent a while trying to master the yo-yo and looked delighted every time it almost worked.',
    traitEffects: { chaos: 1 },
  },
  {
    id: 'kite',
    name: 'Kite',
    description: 'A bright kite for breezy afternoons and playful detours.',
    category: 'toys',
    moodLine: 'Pettit ran in circles with the kite string until the whole field felt more alive.',
    traitEffects: { curiosity: 1, chaos: 1 },
  },
  {
    id: 'toy-robot',
    name: 'Toy Robot',
    description: 'A clunky little toy robot that feels equal parts adorable and suspiciously determined.',
    category: 'toys',
    moodLine: 'Pettit set the toy robot down, watched it wobble once, and decided they understood each other immediately.',
    traitEffects: { curiosity: 1, chaos: 1 },
    seasonalOnly: true,
  },
  {
    id: 'wooden-horse',
    name: 'Wooden Horse',
    description: 'A tiny carved wooden horse that makes even stillness feel like travel.',
    category: 'toys',
    moodLine: 'Pettit held the wooden horse in both paws and looked ready to invent a whole journey around it.',
    traitEffects: { trust: 1, courage: 1 },
    seasonalOnly: true,
  },
  {
    id: 'sleeping-bag',
    name: 'Sleeping Bag',
    description: 'A snug sleeping bag for camp nights, starwatching, and bundled-up dreams.',
    category: 'tools',
    moodLine: 'Pettit climbed into the sleeping bag and instantly looked like it might stay there until morning by choice.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'camp-mug',
    name: 'Camp Mug',
    description: 'A sturdy camp mug for warm drinks, soft breaks, and shared fireside moments.',
    category: 'tools',
    moodLine: 'Pettit turned the camp mug in its paws and seemed very taken with the cozy possibilities of it.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'blanket',
    name: 'Blanket',
    description: 'A soft blanket for resting, reading, and feeling looked after.',
    category: 'tools',
    moodLine: 'Pettit wrapped up in the blanket and looked so content that the room itself seemed to soften a little.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'rope',
    name: 'Rope',
    description: 'A useful coil of rope for climbing, tying, hauling, and practical courage.',
    category: 'tools',
    moodLine: 'Pettit inspected the rope with a thoughtful tilt of the head, already imagining all the ways it might be useful later.',
    traitEffects: { courage: 1, trust: 1 },
  },
  {
    id: 'pocket-torch',
    name: 'Pocket Torch',
    description: 'A little torch for hidden corners, evening walks, and small brave moments.',
    category: 'tools',
    moodLine: 'Pettit clicked the pocket torch on and off a few times, delighted by how much courage such a small light could carry.',
    traitEffects: { courage: 1 },
  },
  {
    id: 'rubber-chicken',
    name: 'Rubber Chicken',
    description: 'A gloriously silly rubber chicken that nobody can take entirely seriously.',
    category: 'funny',
    moodLine: 'Pettit squeezed the rubber chicken once, then laughed so hard at the noise that it had to do it again.',
    traitEffects: { chaos: 1 },
  },
  {
    id: 'lucky-rock',
    name: 'Lucky Rock',
    description: 'A smooth little rock that somehow feels more important than reason can explain.',
    category: 'funny',
    moodLine: 'Pettit held the lucky rock very carefully, as though luck might be shy if handled too casually.',
    traitEffects: { trust: 1, chaos: 1 },
  },
  {
    id: 'shiny-button',
    name: 'Shiny Button',
    description: 'A mysterious shiny button that seems too cheerful to throw away.',
    category: 'funny',
    moodLine: 'Pettit kept turning the shiny button toward the light like it might reveal a secret if admired from the right angle.',
    traitEffects: { curiosity: 1, chaos: 1 },
  },
  {
    id: 'fake-mustache',
    name: 'Fake Mustache',
    description: 'A tiny fake mustache for moments that clearly need more disguise than logic.',
    category: 'funny',
    moodLine: 'Pettit wore the fake mustache with astonishing confidence, which somehow only made it more ridiculous.',
    traitEffects: { chaos: 1 },
  },
  {
    id: 'squeaky-duck',
    name: 'Squeaky Duck',
    description: 'A cheerful squeaky duck that makes quiet moments much harder to keep quiet.',
    category: 'funny',
    moodLine: 'Pettit booped the squeaky duck once and then stared at it with the delighted betrayal of someone who found exactly what they hoped for.',
    traitEffects: { chaos: 1, trust: 1 },
  },
  {
    id: 'friendship-bracelet',
    name: 'Friendship Bracelet',
    description: 'A tiny bracelet that makes community care feel visible.',
    category: 'community',
    moodLine: 'Pettit looked at the bracelet for a long time and seemed very pleased by the thought behind it.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'hand-knitted-scarf',
    name: 'Hand-Knitted Scarf',
    description: 'A homemade scarf stitched with warmth, patience, and obvious affection.',
    category: 'community',
    moodLine: 'Pettit nuzzled into the hand-knitted scarf and looked deeply comforted by the care sewn into it.',
    traitEffects: { trust: 1 },
  },
  {
    id: 'painted-pebble',
    name: 'Painted Pebble',
    description: 'A painted pebble that feels less like an object and more like a tiny hello.',
    category: 'community',
    moodLine: 'Pettit turned the painted pebble over in its paws and seemed touched that someone had made something small just for it.',
    traitEffects: { trust: 1, curiosity: 1 },
  },
  {
    id: 'wooden-charm',
    name: 'Wooden Charm',
    description: 'A carved wooden charm meant to travel along on future adventures.',
    category: 'community',
    moodLine: 'Pettit held the wooden charm up to the light and looked as though it had just been trusted with a promise.',
    traitEffects: { trust: 1, courage: 1 },
  },
  {
    id: 'tiny-flag',
    name: 'Tiny Flag',
    description: 'A tiny community flag that makes belonging feel bright and easy to spot.',
    category: 'community',
    moodLine: 'Pettit planted the tiny flag nearby and seemed delighted by the idea that togetherness could look so cheerful.',
    traitEffects: { trust: 1 },
  },
];

const LEGACY_GIFT_DEFINITIONS: readonly GiftDefinition[] = [
  {
    id: 'tiny-crown',
    name: 'Tiny Crown',
    description: 'A very serious crown for very unserious royal business.',
    category: 'funny',
    moodLine: 'Pettit wore the tiny crown with the kind of dignity that only made it funnier.',
    traitEffects: { chaos: 1 },
  },
];

const LEGACY_GIFT_ALIASES: Readonly<Record<string, string>> = {
  backpack: 'small-backpack',
  'star-guide': 'star-map',
};

const LEGACY_GIFT_NAME_ALIASES: Readonly<Record<string, string>> = {
  backpack: 'small-backpack',
  'small backpack': 'small-backpack',
  lantern: 'lantern',
  'star guide': 'star-map',
  'star map': 'star-map',
  'friendship bracelet': 'friendship-bracelet',
  kite: 'kite',
  'tiny crown': 'tiny-crown',
};

const CANONICAL_GIFT_MAP = new Map<string, GiftDefinition>(GIFT_LIBRARY.map((gift) => [gift.id, gift]));
const LEGACY_GIFT_MAP = new Map<string, GiftDefinition>(LEGACY_GIFT_DEFINITIONS.map((gift) => [gift.id, gift]));
const GIFT_NAME_INDEX = new Map<string, string>(
  [...GIFT_LIBRARY, ...LEGACY_GIFT_DEFINITIONS].map((gift) => [gift.name.toLowerCase(), gift.id])
);

export const canonicalizeGiftId = (giftId: string): string => LEGACY_GIFT_ALIASES[giftId] ?? giftId;

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

export const isCommunityGiftId = (giftId: string | null | undefined): giftId is string =>
  Boolean(giftId?.startsWith(COMMUNITY_GIFT_PREFIX));

export const buildCommunityGiftDefinition = (gift: Omit<GiftDefinition, 'id'>): GiftDefinition => {
  const payload = JSON.stringify({
    name: gift.name,
    description: gift.description,
    category: gift.category,
    moodLine: gift.moodLine,
    traitEffects: gift.traitEffects,
  });

  return {
    ...gift,
    id: `${COMMUNITY_GIFT_PREFIX}${encodePayload(payload)}`,
  };
};

export const encodeCommunityGiftId = (gift: Omit<GiftDefinition, 'id' | 'seasonalOnly'>): string =>
  buildCommunityGiftDefinition(gift).id;

const parseCommunityGiftDefinition = (giftId: string): GiftDefinition => {
  const encodedPayload = giftId.slice(COMMUNITY_GIFT_PREFIX.length);

  try {
    const parsed = JSON.parse(decodePayload(encodedPayload)) as Omit<GiftDefinition, 'id'>;
    return {
      id: giftId,
      name: parsed.name,
      description: parsed.description,
      category: parsed.category,
      moodLine: parsed.moodLine,
      traitEffects: parsed.traitEffects,
    };
  } catch {
    throw new Error(`Unknown gift: ${giftId}`);
  }
};

export const inferGiftId = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' && value.startsWith(COMMUNITY_GIFT_PREFIX)) {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const byAlias = LEGACY_GIFT_NAME_ALIASES[normalized];

  if (byAlias) {
    return byAlias;
  }

  const byName = GIFT_NAME_INDEX.get(normalized);

  if (byName) {
    return canonicalizeGiftId(byName);
  }

  return null;
};

export const resolveInventoryGiftId = (item: Partial<PettitInventoryItem>): string | null => {
  return inferGiftId(item.giftId) ?? inferGiftId(item.name) ?? inferGiftId(item.canonName);
};

export const getGiftById = (giftId: string): GiftDefinition => {
  if (isCommunityGiftId(giftId)) {
    return parseCommunityGiftDefinition(giftId);
  }

  const canonicalId = canonicalizeGiftId(giftId);
  const canonicalGift = CANONICAL_GIFT_MAP.get(canonicalId);

  if (canonicalGift) {
    return canonicalGift;
  }

  const legacyGift = LEGACY_GIFT_MAP.get(giftId);

  if (legacyGift) {
    return legacyGift;
  }

  throw new Error(`Unknown gift: ${giftId}`);
};

const buildGiftOutcome = (gift: GiftDefinition) => ({
  optionId: gift.id,
  resultText: `${gift.moodLine} The whole gift felt like a message from the community: we want you to keep growing.`,
  memoryTitle: `Received ${gift.name}`,
  memoryDescription: `The community chose to give Pettit ${gift.description.toLowerCase()}.`,
  memoryType: 'gift' as const,
  importance: 4,
  mood: 'excited' as const,
  traitEffects: gift.traitEffects,
  awardedGiftId: gift.id,
});

export const buildGiftEncounterTemplate = (giftIds: readonly string[]): EncounterTemplate => {
  const gifts = giftIds.map((giftId) => getGiftById(giftId));
  const encounterId = `${GIFT_ENCOUNTER_PREFIX}${gifts.map((gift) => gift.id).join('~')}`;

  return {
    id: encounterId,
    title: "Choose Pettit's Next Gift",
    description: 'The community is sending Pettit a keepsake. Which gift should become part of its story next?',
    affinity: 'community',
    options: gifts.map((gift) => ({
      id: gift.id,
      label: gift.name,
    })),
    outcomes: gifts.map((gift) => buildGiftOutcome(gift)),
  };
};

export const isGiftEncounterTemplateId = (templateId: string): boolean => {
  return templateId.startsWith(GIFT_ENCOUNTER_PREFIX) || templateId.startsWith(LEGACY_GIFT_QUEST_PREFIX);
};

export const getGiftEncounterTemplateById = (templateId: string): EncounterTemplate => {
  if (!isGiftEncounterTemplateId(templateId)) {
    throw new Error(`Unknown gift encounter template: ${templateId}`);
  }

  const encodedGiftIds = templateId.startsWith(GIFT_ENCOUNTER_PREFIX)
    ? templateId.slice(GIFT_ENCOUNTER_PREFIX.length)
    : templateId.slice(LEGACY_GIFT_QUEST_PREFIX.length);
  const giftIds = encodedGiftIds.split('~').filter(Boolean);

  if (giftIds.length === 0) {
    throw new Error(`Gift encounter template has no gifts: ${templateId}`);
  }

  return buildGiftEncounterTemplate(giftIds);
};

export const selectGiftEncounterIds = (inventory: PettitInventoryItem[], optionCount: number): string[] => {
  const ownedCanonicalIds = new Set(inventory.map((item) => canonicalizeGiftId(item.giftId)));
  const unowned = GIFT_LIBRARY.filter((gift) => !ownedCanonicalIds.has(gift.id) && !gift.seasonalOnly);
  const offset = inventory.length % GIFT_LIBRARY.length;
  const orderedAll = GIFT_LIBRARY.filter((gift) => !gift.seasonalOnly)
    .slice(offset)
    .concat(GIFT_LIBRARY.filter((gift) => !gift.seasonalOnly).slice(0, offset));
  const selected: string[] = [];

  for (const gift of unowned) {
    if (selected.length >= optionCount) {
      break;
    }

    selected.push(gift.id);
  }

  for (const gift of orderedAll) {
    if (selected.length >= optionCount) {
      break;
    }

    if (!selected.includes(gift.id) && !ownedCanonicalIds.has(gift.id)) {
      selected.push(gift.id);
    }
  }

  return selected;
};

export const selectPreferredGiftEncounterIds = (
  inventory: PettitInventoryItem[],
  optionCount: number,
  preferredGiftIds: readonly string[]
): string[] => {
  const ownedCanonicalIds = new Set(inventory.map((item) => canonicalizeGiftId(item.giftId)));
  const selected: string[] = [];

  preferredGiftIds.forEach((giftId) => {
    const canonicalId = canonicalizeGiftId(giftId);

    if (
      selected.length < optionCount &&
      !ownedCanonicalIds.has(canonicalId) &&
      CANONICAL_GIFT_MAP.has(canonicalId) &&
      !selected.includes(canonicalId)
    ) {
      selected.push(canonicalId);
    }
  });

  if (selected.length >= optionCount) {
    return selected;
  }

  const fallback = selectGiftEncounterIds(inventory, optionCount);

  fallback.forEach((giftId) => {
    if (selected.length < optionCount && !selected.includes(giftId)) {
      selected.push(giftId);
    }
  });

  return selected;
};
