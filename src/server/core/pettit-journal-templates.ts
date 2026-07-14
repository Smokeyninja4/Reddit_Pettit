import type { EncounterOptionOutcome, PettitMood, PettitMemory, TraitKey } from '../../shared/pettit';

export type JournalStyleKey = 'reflective' | 'excited' | 'funny' | 'curious' | 'childlike';

export type JournalContext = {
  mood: PettitMood;
  leadingTrait: TraitKey;
  trailingTrait: TraitKey;
  outcome: EncounterOptionOutcome;
  memory: PettitMemory;
  previousMemory: PettitMemory | null;
};

type JournalLineTemplate = string | ((context: JournalContext) => string);

type JournalStyleTemplates = {
  openingByMood: Record<PettitMood, readonly JournalLineTemplate[]>;
  mainEvent: readonly JournalLineTemplate[];
  reflectionByTrait: Record<TraitKey, readonly JournalLineTemplate[]>;
  memoryCallback: readonly JournalLineTemplate[];
  closing: readonly JournalLineTemplate[];
};

const buildOutcomeLead = (outcome: EncounterOptionOutcome): string => {
  return outcome.resultText.charAt(0).toLowerCase() + outcome.resultText.slice(1);
};

const buildMemoryReference = (memory: PettitMemory): string => {
  return memory.title.toLowerCase();
};

export const JOURNAL_STYLE_TEMPLATES: Record<JournalStyleKey, JournalStyleTemplates> = {
  reflective: {
    openingByMood: {
      curious: [
        'Today I found something that gave me more to think about than I expected.',
        'Today felt gentle and full of questions worth sitting with for a while.',
      ],
      excited: [
        'Even with all the movement today, there was a quiet lesson waiting inside it.',
        'Today moved quickly, but I still found a moment to hold onto what it meant.',
      ],
      thoughtful: [
        'Today I discovered something that made me stop and think.',
        'The day felt quiet in a way that made everything easier to notice.',
      ],
      nervous: [
        'Today asked a little more of me than usual, so I paid close attention to how it felt.',
        'I felt small in a few moments today, but not in a hopeless way.',
      ],
    },
    mainEvent: [
      (context) => `I spent most of today noticing how ${buildOutcomeLead(context.outcome)}`,
      (context) => `What stays with me most is how ${buildOutcomeLead(context.outcome)}`,
    ],
    reflectionByTrait: {
      curiosity: [
        'When I slow down, the world always seems to reveal one more secret.',
        'I wonder how many stories are still waiting just beyond what I understand now.',
      ],
      chaos: [
        'Sometimes the strangest choices leave behind the clearest memories.',
        'A little disorder has a way of making the day feel unexpectedly alive.',
      ],
      trust: [
        'It is easier to be brave when I remember I am being shaped alongside everyone else.',
        'The community keeps reminding me that kindness can feel as sturdy as a path.',
      ],
      courage: [
        'I am starting to understand that bravery often sounds quieter than I imagined.',
        'Even small acts of courage make the world feel more possible to walk through.',
      ],
    },
    memoryCallback: [
      (context) =>
        `I kept thinking about ${buildMemoryReference(context.previousMemory ?? context.memory)}, and it made today feel connected to everything that came before it.`,
      (context) =>
        `Remembering ${buildMemoryReference(context.previousMemory ?? context.memory)} helped this day settle into place beside the others.`,
      (context) =>
        `Some part of today kept echoing ${buildMemoryReference(context.previousMemory ?? context.memory)}, and I liked how that made my story feel stitched together instead of scattered.`,
    ],
    closing: [
      'I think I am becoming a little more myself every day.',
      'Maybe that is what growing really feels like.',
      'It feels good when a day leaves behind something worth carrying forward.',
    ],
  },
  excited: {
    openingByMood: {
      curious: [
        'Today felt like the start of a really good adventure.',
        'I woke up ready for something interesting, and the day absolutely delivered.',
      ],
      excited: [
        'Today was AMAZING!',
        'I could barely keep up with how exciting today felt.',
      ],
      thoughtful: [
        'Even my quieter days can turn into adventures if I look closely enough.',
        'Today started gently and somehow still turned into something big.',
      ],
      nervous: [
        'I was a little shaky at first, but then the day turned into something worth cheering for.',
        'I did not begin today feeling brave, but I ended it with a much bigger smile.',
      ],
    },
    mainEvent: [
      (context) => `I could not wait to see what would happen next, and then ${buildOutcomeLead(context.outcome)}`,
      (context) => `Everything felt like one big adventure today because ${buildOutcomeLead(context.outcome)}`,
    ],
    reflectionByTrait: {
      curiosity: [
        'The best part is knowing there are still even more things left to discover.',
        'The more I learn, the more exciting the next mystery starts to feel.',
      ],
      chaos: [
        'Honestly, a little chaos can be excellent for keeping the day interesting.',
        'If things get weird on the way to a story, that usually means I am doing it right.',
      ],
      trust: [
        'It feels even better knowing the whole community helped point me toward this moment.',
        'I like adventures most when they feel shared.',
      ],
      courage: [
        'I am proud that I leaned forward instead of backing away.',
        'Every brave choice makes the next one feel a tiny bit easier.',
      ],
    },
    memoryCallback: [
      (context) =>
        `It even reminded me of ${buildMemoryReference(context.previousMemory ?? context.memory)}, which somehow made everything feel bigger in the best way.`,
      (context) =>
        `I keep thinking about ${buildMemoryReference(context.previousMemory ?? context.memory)} too, so today feels like part of a growing adventure trail.`,
      (context) =>
        `It also pulled ${buildMemoryReference(context.previousMemory ?? context.memory)} back into my head, which made the whole day feel like a sequel I was very happy to get.`,
    ],
    closing: [
      'I already want to see what happens next.',
      'If tomorrow is half this lively, I am going to love it.',
      'It is hard not to like a life that keeps surprising me like this.',
    ],
  },
  funny: {
    openingByMood: {
      curious: [
        'I had questions today. Some of them were smart. Some of them definitely were not.',
        'Today began with curiosity and somehow picked up a little nonsense along the way.',
      ],
      excited: [
        'Today had a lot of energy, and I used at least most of it responsibly.',
        'I was very enthusiastic today, which may or may not have improved my decision-making.',
      ],
      thoughtful: [
        'I tried to be thoughtful today, which only partially prevented things from becoming ridiculous.',
        'Even a calm day can get strange if I am involved for long enough.',
      ],
      nervous: [
        'I was a little nervous today, which is fair because the day turned out to be a lot.',
        'In my defense, today was weird first.',
      ],
    },
    mainEvent: [
      (context) => `I meant to handle everything very sensibly, but then ${buildOutcomeLead(context.outcome)}`,
      (context) => `At some point today, things became difficult to explain because ${buildOutcomeLead(context.outcome)}`,
    ],
    reflectionByTrait: {
      curiosity: [
        'The mystery is still interesting, even if I may have investigated it in a slightly silly way.',
        'Asking questions is important. Accidentally creating more questions is apparently also one of my talents.',
      ],
      chaos: [
        'That probably was not my smartest idea, but it was absolutely one of my most memorable ones.',
        'I am learning that trouble and good stories tend to arrive holding hands.',
      ],
      trust: [
        'It helps that the community keeps believing in me, even when I am making the day harder to summarize.',
        'I like knowing someone out there probably saw this coming and voted for it anyway.',
      ],
      courage: [
        'It turns out bravery and questionable judgment can look surprisingly similar from a distance.',
        'At least I cannot say I was boring today.',
      ],
    },
    memoryCallback: [
      (context) =>
        `It also made me think about ${buildMemoryReference(context.previousMemory ?? context.memory)}, which means I might be building a suspicious pattern.`,
      (context) =>
        `Honestly, remembering ${buildMemoryReference(context.previousMemory ?? context.memory)} should have prepared me better than it did.`,
      (context) =>
        `It even brought ${buildMemoryReference(context.previousMemory ?? context.memory)} back to mind, which is either charming continuity or a sign that I should make calmer choices.`,
    ],
    closing: [
      'I am choosing to believe this all counts as character growth.',
      'If nothing else, future me is going to have a very entertaining journal.',
      'At the very least, nobody can accuse today of lacking personality.',
    ],
  },
  curious: {
    openingByMood: {
      curious: [
        'Why did today feel like it was hiding one more secret from me?',
        'I woke up feeling sure there was something worth discovering.',
      ],
      excited: [
        'How could I not be excited when the whole day felt like an unanswered question?',
        'Today moved quickly, but it still left me wanting to know more.',
      ],
      thoughtful: [
        'Some days make me ask quieter questions.',
        'Today made me want to slow down and look a little closer.',
      ],
      nervous: [
        'I was nervous, but the questions still felt stronger than the fear.',
        'Sometimes uncertainty is frightening. It is also very hard to ignore.',
      ],
    },
    mainEvent: [
      (context) => `I keep wondering why ${buildOutcomeLead(context.outcome)}`,
      (context) => `The biggest question I brought home today is how ${buildOutcomeLead(context.outcome)}`,
    ],
    reflectionByTrait: {
      curiosity: [
        'Who built these moments into my life, and how many more are waiting?',
        'The more I notice, the more I feel there are deeper secrets just out of reach.',
      ],
      chaos: [
        'Maybe strange decisions are one way the world teaches me to stay alert.',
        'Unexpected turns always seem to leave the most interesting clues behind.',
      ],
      trust: [
        'I like that the community keeps handing me new mysteries instead of smaller versions of the same day.',
        'Questions feel less lonely when I know they are being asked together.',
      ],
      courage: [
        'Maybe courage is what lets a question stay open long enough to become an answer.',
        'It takes a little bravery to keep following the unknown instead of turning away from it.',
      ],
    },
    memoryCallback: [
      (context) =>
        `It also reminded me of ${buildMemoryReference(context.previousMemory ?? context.memory)}. Is that coincidence, or is my world beginning to rhyme?`,
      (context) =>
        `I cannot stop comparing it to ${buildMemoryReference(context.previousMemory ?? context.memory)} and wondering what the connection might be.`,
      (context) =>
        `It made ${buildMemoryReference(context.previousMemory ?? context.memory)} feel newly important again, as though old clues can wait patiently for better timing.`,
    ],
    closing: [
      'I feel like there are still more secrets waiting for me.',
      'I hope tomorrow leaves me with even better questions.',
      'It is comforting to know the world is still larger than whatever I understood this morning.',
    ],
  },
  childlike: {
    openingByMood: {
      curious: [
        'Today felt big and sparkly in my head.',
        'I had a lot of little questions today, and they all felt important.',
      ],
      excited: [
        'Today was so exciting!',
        'I could tell right away that today was going to be special.',
      ],
      thoughtful: [
        'Today felt soft and quiet, but still nice.',
        'Sometimes small days still leave a big feeling behind.',
      ],
      nervous: [
        'I felt a little scared today, but I kept going anyway.',
        'My heart was thumpy for a while, but the day stayed with me kindly.',
      ],
    },
    mainEvent: [
      (context) => `Then ${buildOutcomeLead(context.outcome)}`,
      (context) => `The biggest thing that happened was that ${buildOutcomeLead(context.outcome)}`,
    ],
    reflectionByTrait: {
      curiosity: [
        'I like finding new things, even when I do not understand them yet.',
        'The world keeps feeling bigger every time I look closely at it.',
      ],
      chaos: [
        'Sometimes silly things happen, and I think that is part of the fun.',
        'The day got a little wobbly, but I still liked it.',
      ],
      trust: [
        'It feels good knowing I am not doing any of this alone.',
        'I think kindness makes the world feel less scary.',
      ],
      courage: [
        'I am proud that I kept going.',
        'Maybe being brave can be small and still count.',
      ],
    },
    memoryCallback: [
      (context) =>
        `It made me remember ${buildMemoryReference(context.previousMemory ?? context.memory)}, and that made today feel extra cozy in my mind.`,
      (context) =>
        `I also thought about ${buildMemoryReference(context.previousMemory ?? context.memory)}. I like when my memories feel like friends.`,
      (context) =>
        `Remembering ${buildMemoryReference(context.previousMemory ?? context.memory)} made today feel less lonely somehow, even before anything else happened.`,
    ],
    closing: [
      'I think today will stay with me for a while.',
      'I hope I get to keep growing like this.',
      'Some days feel small while they are happening and big only afterward. I think this was one of those.',
    ],
  },
};
