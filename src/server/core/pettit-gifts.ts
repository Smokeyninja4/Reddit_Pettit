import type { GiftCategory, PettitInventoryItem, QuestTemplate, TraitKey } from '../../shared/pettit';

type GiftDefinition = {
  id: string;
  name: string;
  description: string;
  category: GiftCategory;
  moodLine: string;
  traitEffects: Partial<Record<TraitKey, number>>;
};

const GIFT_QUEST_PREFIX = 'quest-gift:';

export const STARTER_GIFTS: readonly GiftDefinition[] = [
  {
    id: 'backpack',
    name: 'Backpack',
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
    id: 'star-guide',
    name: 'Star Guide',
    description: 'A pocket guide full of constellations and bedtime wondering.',
    category: 'books',
    moodLine: 'Pettit opened the guide right away and started comparing the pages to the sky.',
    traitEffects: { curiosity: 1 },
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
    id: 'kite',
    name: 'Kite',
    description: 'A bright kite for breezy afternoons and playful detours.',
    category: 'toys',
    moodLine: 'Pettit ran in circles with the kite string until the whole field felt more alive.',
    traitEffects: { curiosity: 1, chaos: 1 },
  },
  {
    id: 'tiny-crown',
    name: 'Tiny Crown',
    description: 'A very serious crown for very unserious royal business.',
    category: 'funny',
    moodLine: 'Pettit wore the tiny crown with the kind of dignity that only made it funnier.',
    traitEffects: { chaos: 1 },
  },
];

export const getGiftById = (giftId: string): GiftDefinition => {
  const gift = STARTER_GIFTS.find((candidate) => candidate.id === giftId);

  if (!gift) {
    throw new Error(`Unknown gift: ${giftId}`);
  }

  return gift;
};

const buildGiftOutcome = (gift: GiftDefinition) => ({
  optionId: gift.id,
  resultText: `${gift.moodLine} The whole gift felt like a message from the community: we want you to keep growing.`,
  memoryTitle: `Received ${gift.name}`,
  memoryDescription: `The community chose to give Pettit ${gift.description.toLowerCase()}`,
  memoryType: 'gift' as const,
  importance: 4,
  mood: 'excited' as const,
  traitEffects: gift.traitEffects,
  awardedGiftId: gift.id,
});

export const buildGiftQuestTemplate = (giftIds: readonly string[]): QuestTemplate => {
  const gifts = giftIds.map((giftId) => getGiftById(giftId));
  const questId = `${GIFT_QUEST_PREFIX}${gifts.map((gift) => gift.id).join('~')}`;

  return {
    id: questId,
    title: 'Choose Pettit’s Next Gift',
    description: 'The community is sending Pettit a keepsake. Which gift should become part of its story next?',
    category: 'community',
    options: gifts.map((gift) => ({
      id: gift.id,
      label: gift.name,
    })),
    outcomes: gifts.map((gift) => buildGiftOutcome(gift)),
  };
};

export const isGiftQuestTemplateId = (templateId: string): boolean => templateId.startsWith(GIFT_QUEST_PREFIX);

export const getGiftQuestTemplateById = (templateId: string): QuestTemplate => {
  if (!isGiftQuestTemplateId(templateId)) {
    throw new Error(`Unknown gift quest template: ${templateId}`);
  }

  const encodedGiftIds = templateId.slice(GIFT_QUEST_PREFIX.length);
  const giftIds = encodedGiftIds.split('~').filter(Boolean);

  if (giftIds.length === 0) {
    throw new Error(`Gift quest template has no gifts: ${templateId}`);
  }

  return buildGiftQuestTemplate(giftIds);
};

export const selectGiftRoundGiftIds = (inventory: PettitInventoryItem[], optionCount: number): string[] => {
  const ownedIds = new Set(inventory.map((item) => item.name.toLowerCase().replace(/\s+/g, '-')));
  const unowned = STARTER_GIFTS.filter((gift) => !ownedIds.has(gift.id));
  const orderedAll = STARTER_GIFTS.slice(inventory.length % STARTER_GIFTS.length).concat(
    STARTER_GIFTS.slice(0, inventory.length % STARTER_GIFTS.length)
  );

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

    if (!selected.includes(gift.id)) {
      selected.push(gift.id);
    }
  }

  return selected;
};
