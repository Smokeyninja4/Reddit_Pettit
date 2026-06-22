import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#028af8',
  scale: {
    // Keep a fixed game resolution but automatically scale it to fit within the available
    // web-view / device while maintaining aspect ratio.
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const VIEWPORT_REFRESH_EVENT = 'devvit:viewport-refresh';

type RefreshableScene = Phaser.Scene & {
  events: Phaser.Events.EventEmitter;
};

const getViewportSize = (parent: HTMLElement): { width: number; height: number } => {
  const width = Math.max(1, Math.floor(parent.clientWidth || window.innerWidth || 1024));
  const height = Math.max(1, Math.floor(parent.clientHeight || window.innerHeight || 768));
  return { width, height };
};

const refreshScenes = (game: Game): void => {
  const scenes = game.scene.getScenes(true) as RefreshableScene[];
  scenes.forEach((scene) => {
    scene.events.emit(VIEWPORT_REFRESH_EVENT);
  });
};

const resizeGameToParent = (game: Game, parent: HTMLElement): void => {
  const { width, height } = getViewportSize(parent);
  game.scale.resize(width, height);
  refreshScenes(game);
  game.loop.wake();
  game.events.emit(Phaser.Core.Events.RESUME);
};

const attachViewportGuards = (game: Game, parent: HTMLElement): void => {
  let rafId = 0;

  const scheduleResize = (): void => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      resizeGameToParent(game, parent);
    });
  };

  const resizeObserver = new ResizeObserver(() => {
    scheduleResize();
  });
  resizeObserver.observe(parent);

  window.addEventListener('resize', scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  window.addEventListener('pageshow', scheduleResize);
  document.addEventListener('visibilitychange', scheduleResize);

  game.events.once(Phaser.Core.Events.DESTROY, () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', scheduleResize);
    window.removeEventListener('orientationchange', scheduleResize);
    window.removeEventListener('pageshow', scheduleResize);
    document.removeEventListener('visibilitychange', scheduleResize);

    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
    }
  });

  scheduleResize();
};

const startGame = (parentId: string): void => {
  const parent = document.getElementById(parentId);

  if (!(parent instanceof HTMLElement)) {
    throw new Error(`Missing game container: ${parentId}`);
  }

  const game = new Game({ ...config, parent: parentId });
  attachViewportGuards(game, parent);
};

const bootstrap = (): void => {
  startGame('game-container');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
