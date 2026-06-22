import type {
  ActiveQuest,
  PettitState,
  PettitStats,
  PettitTraits,
  QuestTemplate,
  TraitKey,
} from '../../shared/pettit';
import { getGiftQuestTemplateById, isGiftQuestTemplateId } from './pettit-gifts';

const DEFAULT_TRAITS: PettitTraits = {
  curiosity: 52,
  chaos: 28,
  trust: 47,
  courage: 44,
};

export const STARTER_QUESTS: readonly QuestTemplate[] = [
  {
    id: 'quest-cave',
    title: 'A Strange Cave',
    description: 'Pettit found a cave tucked behind a curtain of moss and would like a little advice.',
    category: 'explore',
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
      },
    ],
  },
  {
    id: 'quest-stars',
    title: 'Learn About Stars',
    description: 'The night sky has Pettit full of questions, and it wants to know where to begin.',
    category: 'learn',
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
      },
    ],
  },
  {
    id: 'quest-traveller',
    title: 'Help A Traveller',
    description: 'A tired traveller has wandered by, and Pettit wants to decide the kindest way to help.',
    category: 'social',
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
      },
      {
        optionId: 'feed',
        resultText: 'Pettit shared a simple meal and listened to the traveller’s stories until sunset.',
        memoryTitle: 'Shared a meal with a traveller',
        memoryDescription: 'The community turned a passing stranger into a warm memory with one generous choice.',
        memoryType: 'friendship',
        importance: 3,
        mood: 'curious',
        traitEffects: { trust: 3 },
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
      },
    ],
  },
];

export const createDefaultPettitState = (subredditName: string): PettitState => ({
  id: `pettit-${subredditName}`,
  name: 'Pettit',
  createdAt: new Date().toISOString(),
  ageDays: 0,
  mood: 'curious',
  traits: { ...DEFAULT_TRAITS },
  inventory: [],
  activeQuestId: `${getStarterQuestByIndex(0).id}-1`,
  latestJournalId: null,
});

export const createDefaultStats = (): PettitStats => ({
  totalVotes: 0,
  journalCount: 0,
  memoryCount: 0,
  resolvedQuestCount: 0,
});

export const getStarterQuestByIndex = (index: number): QuestTemplate => {
  const safeIndex = ((index % STARTER_QUESTS.length) + STARTER_QUESTS.length) % STARTER_QUESTS.length;
  const quest = STARTER_QUESTS[safeIndex];

  if (!quest) {
    throw new Error('Starter quest catalog is empty');
  }

  return quest;
};

export const getQuestTemplateById = (templateId: string): QuestTemplate => {
  if (isGiftQuestTemplateId(templateId)) {
    return getGiftQuestTemplateById(templateId);
  }

  const quest = STARTER_QUESTS.find((candidate) => candidate.id === templateId);

  if (!quest) {
    throw new Error(`Unknown quest template: ${templateId}`);
  }

  return quest;
};

export const getTopTraits = (traits: PettitTraits, limit: number): TraitKey[] =>
  (Object.entries(traits) as [TraitKey, number][])
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([traitKey]) => traitKey);

export const createQuestInstanceFromTemplate = (
  template: QuestTemplate,
  sequenceNumber: number
): ActiveQuest => ({
  id: `${template.id}-${sequenceNumber}`,
  templateId: template.id,
  title: template.title,
  description: template.description,
  category: template.category,
  createdAt: new Date().toISOString(),
  options: template.options.map((option) => ({
    id: option.id,
    label: option.label,
    votes: 0,
  })),
});
