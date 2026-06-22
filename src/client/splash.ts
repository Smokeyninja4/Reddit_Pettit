import { context, requestExpandedMode } from '@devvit/web/client';
import { fetchPettitState } from './pettitApi';

const titleElement = document.getElementById('title');
const descriptionElement = document.getElementById('description');
const moodElement = document.getElementById('mood');
const startButton = document.getElementById('start-button');

if (
  !(titleElement instanceof HTMLHeadingElement) ||
  !(descriptionElement instanceof HTMLParagraphElement) ||
  !(moodElement instanceof HTMLParagraphElement) ||
  !(startButton instanceof HTMLButtonElement)
) {
  throw new Error('Splash UI is missing required elements.');
}

startButton.addEventListener('click', (event) => {
  requestExpandedMode(event, 'game');
});

const init = async (): Promise<void> => {
  titleElement.textContent = `Hello ${context.username ?? 'friend'}, meet Pettit.`;
  descriptionElement.textContent = 'The subreddit is raising one shared little creature together.';
  moodElement.textContent = 'Loading today’s mood...';

  try {
    const response = await fetchPettitState();
    moodElement.textContent = `Right now Pettit feels ${response.state.pettit.mood}, and the community is deciding what happens next.`;
  } catch {
    moodElement.textContent = 'Pettit is waiting for the next community choice.';
  }
};

void init();
