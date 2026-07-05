import { context, requestExpandedMode } from '@devvit/web/client';
import { fetchPettitState } from './pettitApi';
import { buildPettitPortraitDataUrl } from './pettitPortrait';
import redditPlazaMain from '../../assets/backgrounds/reddit plaza/reddit_plaza_main.png';

const titleElement = document.getElementById('title');
const descriptionElement = document.getElementById('description');
const moodElement = document.getElementById('mood');
const startButton = document.getElementById('start-button');
const backdropElement = document.getElementById('backdrop');
const creaturePreviewElement = document.getElementById('creature-preview');

if (
  !(titleElement instanceof HTMLHeadingElement) ||
  !(descriptionElement instanceof HTMLParagraphElement) ||
  !(moodElement instanceof HTMLParagraphElement) ||
  !(startButton instanceof HTMLButtonElement) ||
  !(backdropElement instanceof HTMLDivElement) ||
  !(creaturePreviewElement instanceof HTMLDivElement)
) {
  throw new Error('Splash UI is missing required elements.');
}

startButton.addEventListener('click', (event) => {
  requestExpandedMode(event, 'game');
});

const renderSplashCreature = (state: Awaited<ReturnType<typeof fetchPettitState>>['state']): void => {
  backdropElement.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.1), rgba(220,235,240,0.1)), url("${redditPlazaMain}")`;
  creaturePreviewElement.dataset.mood = state.pettit.mood;
  creaturePreviewElement.dataset.render = 'snapshot';
  creaturePreviewElement.style.backgroundImage = `url("${buildPettitPortraitDataUrl(state)}")`;
};

const init = async (): Promise<void> => {
  titleElement.textContent = `Hello ${context.username ?? 'friend'}, meet Pettit.`;
  descriptionElement.textContent = 'The subreddit is raising one shared little creature together.';
  moodElement.textContent = "Loading today's mood...";
  backdropElement.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.1), rgba(220,235,240,0.1)), url("${redditPlazaMain}")`;

  try {
    const response = await fetchPettitState();
    titleElement.textContent = `Hello ${context.username ?? 'friend'}, meet ${response.state.pettit.name}.`;
    descriptionElement.textContent = `${context.subredditName ? `r/${context.subredditName}` : 'The subreddit'} is raising one shared little creature together.`;
    moodElement.textContent = `Right now ${response.state.pettit.name} feels ${response.state.pettit.mood}, and the community is deciding what happens next.`;
    renderSplashCreature(response.state);
  } catch {
    moodElement.textContent = 'Pettit is waiting for the next community choice.';
  }
};

void init();
