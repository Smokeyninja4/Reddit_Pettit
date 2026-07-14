import type { EncounterOptionOutcome, EncounterTemplate, PettitState } from '../../shared/pettit';

export type StoryArcKey =
  | 'cave-lantern'
  | 'cave-tracks'
  | 'traveller-return'
  | 'star-chart'
  | 'lantern-chamber'
  | 'constellation-answer';

type StoryArcDefinition = {
  key: StoryArcKey;
  triggerTemplateId: string;
  triggerOptionId?: string;
  title: string;
  description: string;
  affinity: EncounterTemplate['affinity'];
  options: EncounterTemplate['options'];
  outcomes: EncounterTemplate['outcomes'];
};

const STORY_ARC_TEMPLATE_PREFIX = 'encounter-arc-';
const STORY_ARC_REPEAT_MEMORY_LIMIT = 4;
const STORY_ARC_MIN_GAP = 3;

const buildArcTemplateId = (key: StoryArcKey): string => `${STORY_ARC_TEMPLATE_PREFIX}${key}`;

const STORY_ARC_DEFINITIONS: readonly StoryArcDefinition[] = [
  {
    key: 'cave-lantern',
    triggerTemplateId: 'encounter-cave',
    triggerOptionId: 'enter',
    title: 'The Lantern Flickered Again',
    description: 'The old cave lantern refuses to feel finished, and Pettit suspects it was trying to point somewhere.',
    affinity: 'curiosity',
    options: [
      { id: 'follow-light', label: 'Follow The Light' },
      { id: 'clean-lantern', label: 'Clean It First' },
      { id: 'show-community', label: 'Show Everyone' },
    ],
    outcomes: [
      {
        optionId: 'follow-light',
        resultText: 'Pettit followed the lantern deeper into the cave and found markings that looked almost like a map.',
        memoryTitle: 'Followed the cave lantern',
        memoryDescription: 'The lantern seemed to know more than an ordinary lantern should, and Pettit trusted it just enough to learn something back.',
        memoryType: 'adventure',
        importance: 4,
        mood: 'curious',
        traitEffects: { curiosity: 2, courage: 1 },
      },
      {
        optionId: 'clean-lantern',
        resultText: 'Pettit polished the lantern carefully and discovered tiny carved symbols hidden beneath the soot.',
        memoryTitle: 'Cleaned the cave lantern',
        memoryDescription: 'Instead of rushing, Pettit treated the lantern like an object with a history, and it rewarded the patience.',
        memoryType: 'learning',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, trust: 1 },
      },
      {
        optionId: 'show-community',
        resultText: 'Pettit brought the lantern back to everyone, and the shared inspection turned the cave into a bigger mystery than before.',
        memoryTitle: 'Shared the cave lantern',
        memoryDescription: 'The community leaned into the lantern mystery together, and the whole story felt warmer for being shared.',
        memoryType: 'community',
        importance: 4,
        mood: 'excited',
        traitEffects: { trust: 2, curiosity: 1 },
      },
    ],
  },
  {
    key: 'cave-tracks',
    triggerTemplateId: 'encounter-cave',
    triggerOptionId: 'observe',
    title: 'The Cave Tracks Continue',
    description: 'Those strange tracks did not stop at the entrance after all, and Pettit keeps wondering who made them.',
    affinity: 'courage',
    options: [
      { id: 'track-carefully', label: 'Track Them Carefully' },
      { id: 'sketch-them', label: 'Sketch The Pattern' },
      { id: 'wait-nearby', label: 'Wait Nearby' },
    ],
    outcomes: [
      {
        optionId: 'track-carefully',
        resultText: 'Pettit followed the tracks just far enough to find a narrow passage and the feeling that this story was still opening.',
        memoryTitle: 'Tracked the cave prints',
        memoryDescription: 'The cave mystery deepened when Pettit chose careful bravery over comfort.',
        memoryType: 'adventure',
        importance: 4,
        mood: 'nervous',
        traitEffects: { courage: 2, curiosity: 1 },
      },
      {
        optionId: 'sketch-them',
        resultText: 'Pettit copied the track pattern and realized the shapes looked a little too deliberate to be accidental.',
        memoryTitle: 'Sketched the cave tracks',
        memoryDescription: 'Observation turned into evidence, and Pettit came away feeling like the cave had tried to leave a clue.',
        memoryType: 'learning',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2 },
      },
      {
        optionId: 'wait-nearby',
        resultText: 'Pettit waited beside the entrance until the silence itself started to feel like an answer.',
        memoryTitle: 'Waited by the cave',
        memoryDescription: 'Patience did not solve the mystery completely, but it changed the way Pettit listened to it.',
        memoryType: 'special',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { trust: 1, curiosity: 1 },
      },
    ],
  },
  {
    key: 'traveller-return',
    triggerTemplateId: 'encounter-traveller',
    title: 'The Traveller Returned',
    description: 'The traveller Pettit once helped has come back with a grateful smile and a story from the road.',
    affinity: 'trust',
    options: [
      { id: 'listen-story', label: 'Listen Closely' },
      { id: 'ask-where-next', label: 'Ask Where Next' },
      { id: 'share-meal-again', label: 'Share Another Meal' },
    ],
    outcomes: [
      {
        optionId: 'listen-story',
        resultText: 'Pettit listened to the traveller\'s return story and felt the world getting larger in a friendly way.',
        memoryTitle: 'Heard the traveller return',
        memoryDescription: 'A small earlier kindness came back carrying proof that it had mattered somewhere beyond sight.',
        memoryType: 'friendship',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { trust: 2, curiosity: 1 },
      },
      {
        optionId: 'ask-where-next',
        resultText: 'Pettit asked where the road led next and came away with three new places to wonder about.',
        memoryTitle: 'Asked about the road ahead',
        memoryDescription: 'The returning traveller turned gratitude into possibility, and Pettit immediately wanted to know more.',
        memoryType: 'learning',
        importance: 4,
        mood: 'curious',
        traitEffects: { curiosity: 2, trust: 1 },
      },
      {
        optionId: 'share-meal-again',
        resultText: 'Pettit shared another meal, and the second welcome somehow felt even more meaningful than the first.',
        memoryTitle: 'Welcomed the traveller back',
        memoryDescription: 'The community got to see a passing kindness become an ongoing relationship instead of a single scene.',
        memoryType: 'community',
        importance: 4,
        mood: 'excited',
        traitEffects: { trust: 2, courage: 1 },
      },
    ],
  },
  {
    key: 'star-chart',
    triggerTemplateId: 'encounter-stars',
    triggerOptionId: 'observe-sky',
    title: 'A Pattern In The Stars',
    description: 'The sky Pettit studied before is refusing to stay ordinary. A pattern keeps standing out now.',
    affinity: 'curiosity',
    options: [
      { id: 'trace-pattern', label: 'Trace The Pattern' },
      { id: 'compare-notes', label: 'Compare Notes' },
      { id: 'make-a-wish', label: 'Treat It Like A Sign' },
    ],
    outcomes: [
      {
        optionId: 'trace-pattern',
        resultText: 'Pettit traced the star pattern until it began to feel like a message left in light.',
        memoryTitle: 'Traced a star pattern',
        memoryDescription: 'The sky rewarded attention by becoming a little more readable than before.',
        memoryType: 'special',
        importance: 4,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, courage: 1 },
      },
      {
        optionId: 'compare-notes',
        resultText: 'Pettit compared what it remembered with fresh notes and discovered the pattern had shifted on purpose.',
        memoryTitle: 'Compared star notes',
        memoryDescription: 'Curiosity turned into real study, and Pettit felt wonderfully justified for keeping track.',
        memoryType: 'learning',
        importance: 4,
        mood: 'curious',
        traitEffects: { curiosity: 3 },
      },
      {
        optionId: 'make-a-wish',
        resultText: 'Pettit treated the strange alignment like a sign and spent the rest of the night gentler than usual.',
        memoryTitle: 'Made a wish on a pattern',
        memoryDescription: 'Not every mystery had to become a solved one. Some of them felt better as company.',
        memoryType: 'special',
        importance: 3,
        mood: 'thoughtful',
        traitEffects: { trust: 1, curiosity: 1 },
      },
    ],
  },
  {
    key: 'lantern-chamber',
    triggerTemplateId: 'encounter-arc-cave-lantern',
    triggerOptionId: 'follow-light',
    title: 'The Hidden Chamber',
    description: 'The lantern\'s guidance leads Pettit toward a smaller chamber that feels forgotten on purpose.',
    affinity: 'courage',
    options: [
      { id: 'step-inside', label: 'Step Inside' },
      { id: 'study-walls', label: 'Study The Walls' },
      { id: 'leave-offering', label: 'Leave A Little Offering' },
    ],
    outcomes: [
      {
        optionId: 'step-inside',
        resultText: 'Pettit stepped into the chamber and found the kind of silence that feels more protective than empty.',
        memoryTitle: 'Entered the hidden chamber',
        memoryDescription: 'The cave finally gave up one more secret, and Pettit met it with equal parts courage and care.',
        memoryType: 'adventure',
        importance: 5,
        mood: 'nervous',
        traitEffects: { courage: 2, curiosity: 1 },
      },
      {
        optionId: 'study-walls',
        resultText: 'Pettit studied the walls and discovered markings that made the lantern feel less lost and more placed.',
        memoryTitle: 'Read the chamber walls',
        memoryDescription: 'The mystery became a history lesson, and Pettit left feeling like the cave had finally introduced itself.',
        memoryType: 'learning',
        importance: 5,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, trust: 1 },
      },
      {
        optionId: 'leave-offering',
        resultText: 'Pettit left a tiny offering behind, and the whole chamber felt kinder afterward.',
        memoryTitle: 'Honoured the hidden chamber',
        memoryDescription: 'Instead of claiming the moment, Pettit answered it with respect and turned the cave into a shared kind of memory.',
        memoryType: 'community',
        importance: 5,
        mood: 'thoughtful',
        traitEffects: { trust: 2 },
      },
    ],
  },
  {
    key: 'constellation-answer',
    triggerTemplateId: 'encounter-arc-star-chart',
    triggerOptionId: 'trace-pattern',
    title: 'The Constellation Answered',
    description: 'The pattern Pettit noticed in the stars looks even clearer tonight, almost as if the sky remembered being watched.',
    affinity: 'rare',
    options: [
      { id: 'watch-quietly', label: 'Watch Quietly' },
      { id: 'call-everyone', label: 'Call Everyone Over' },
      { id: 'draw-it-fast', label: 'Draw It Before It Fades' },
    ],
    outcomes: [
      {
        optionId: 'watch-quietly',
        resultText: 'Pettit watched the constellation settle into place and felt very small, very lucky, and not lonely at all.',
        memoryTitle: 'Watched a constellation answer',
        memoryDescription: 'The sky felt responsive for one impossible little moment, and Pettit knew some mysteries are allowed to feel personal.',
        memoryType: 'special',
        importance: 5,
        mood: 'thoughtful',
        traitEffects: { curiosity: 2, trust: 1 },
      },
      {
        optionId: 'call-everyone',
        resultText: 'Pettit called everyone over, and the whole community ended up beneath the same impossible answer.',
        memoryTitle: 'Shared a living constellation',
        memoryDescription: 'A private wonder became a communal one, which somehow made the night feel even larger.',
        memoryType: 'community',
        importance: 5,
        mood: 'excited',
        traitEffects: { trust: 2, curiosity: 1 },
      },
      {
        optionId: 'draw-it-fast',
        resultText: 'Pettit drew the constellation as fast as it could, preserving just enough of it to keep the mystery glowing.',
        memoryTitle: 'Sketched the answering sky',
        memoryDescription: 'The moment did not stay forever, but Pettit carried home proof that it had existed.',
        memoryType: 'learning',
        importance: 5,
        mood: 'curious',
        traitEffects: { curiosity: 3 },
      },
    ],
  },
] as const;

const STORY_ARC_TEMPLATE_MAP = new Map<string, EncounterTemplate>(
  STORY_ARC_DEFINITIONS.map((definition) => [
    buildArcTemplateId(definition.key),
    {
      id: buildArcTemplateId(definition.key),
      title: definition.title,
      description: definition.description,
      affinity: definition.affinity,
      options: definition.options,
      outcomes: definition.outcomes,
    },
  ])
);

const getEligibleArcKey = (
  resolvedTemplateId: string,
  outcome: EncounterOptionOutcome
): StoryArcKey | null => {
  const directMatch = STORY_ARC_DEFINITIONS.find(
    (definition) =>
      definition.triggerTemplateId === resolvedTemplateId &&
      (definition.triggerOptionId === undefined || definition.triggerOptionId === outcome.optionId)
  );

  return directMatch?.key ?? null;
};

export const isStoryArcEncounterTemplateId = (templateId: string): boolean =>
  templateId.startsWith(STORY_ARC_TEMPLATE_PREFIX);

export const getStoryArcEncounterTemplateById = (templateId: string): EncounterTemplate | null => {
  return STORY_ARC_TEMPLATE_MAP.get(templateId) ?? null;
};

export const getStoryArcEncounterTemplate = (
  state: PettitState,
  resolvedTemplateId: string,
  outcome: EncounterOptionOutcome,
  resolvedEncounterCount: number
): EncounterTemplate | null => {
  const storyArcKey = getEligibleArcKey(resolvedTemplateId, outcome);

  if (!storyArcKey) {
    return null;
  }

  if (state.storyArcProgress.recentArcKeys.includes(storyArcKey)) {
    return null;
  }

  if (
    state.storyArcProgress.lastArcResolvedCount !== null &&
    resolvedEncounterCount - state.storyArcProgress.lastArcResolvedCount < STORY_ARC_MIN_GAP
  ) {
    return null;
  }

  return STORY_ARC_TEMPLATE_MAP.get(buildArcTemplateId(storyArcKey)) ?? null;
};

export const recordResolvedStoryArc = (
  state: PettitState,
  resolvedTemplateId: string,
  resolvedEncounterCount: number
): PettitState['storyArcProgress'] => {
  if (!isStoryArcEncounterTemplateId(resolvedTemplateId)) {
    return state.storyArcProgress;
  }

  const storyArcKey = resolvedTemplateId.slice(STORY_ARC_TEMPLATE_PREFIX.length) as StoryArcKey;

  return {
    lastArcResolvedCount: resolvedEncounterCount,
    recentArcKeys: [storyArcKey, ...state.storyArcProgress.recentArcKeys.filter((key) => key !== storyArcKey)].slice(
      0,
      STORY_ARC_REPEAT_MEMORY_LIMIT
    ),
  };
};
