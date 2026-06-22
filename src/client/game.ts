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

const MIN_VIEWPORT_SIZE = 32;

const getViewportSize = (parent: HTMLElement): { width: number; height: number } => {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 1024;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? 768;
  const width = Math.max(1, Math.floor(parent.clientWidth || viewportWidth || 1024));
  const height = Math.max(1, Math.floor(parent.clientHeight || viewportHeight || 768));
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
  if (width < MIN_VIEWPORT_SIZE || height < MIN_VIEWPORT_SIZE) {
    return;
  }

  game.scale.resize(width, height);
  game.renderer.resize(width, height);
  refreshScenes(game);
  game.loop.wake();
  game.canvas.style.width = `${width}px`;
  game.canvas.style.height = `${height}px`;
  game.events.emit(Phaser.Core.Events.RESUME);
};

const attachViewportGuards = (game: Game, parent: HTMLElement): void => {
  let rafId = 0;
  let timeoutIds: number[] = [];

  const clearScheduledRefreshes = (): void => {
    timeoutIds.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIds = [];
  };

  const runResize = (): void => {
    resizeGameToParent(game, parent);
  };

  const scheduleResize = (withBurst: boolean = false): void => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      runResize();
    });

    if (withBurst) {
      clearScheduledRefreshes();
      timeoutIds = [80, 180, 320, 500].map((delay) =>
        window.setTimeout(() => {
          runResize();
        }, delay)
      );
    }
  };

  const scheduleRecoveryResize = (): void => {
    scheduleResize(true);
  };

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      scheduleRecoveryResize();
    }
  };

  const handleFocus = (): void => {
    scheduleRecoveryResize();
  };

  const handlePageShow = (): void => {
    scheduleRecoveryResize();
  };

  const handleOrientationChange = (): void => {
    scheduleRecoveryResize();
  };

  const visualViewport = window.visualViewport;
  const handleVisualViewportResize = (): void => {
    scheduleRecoveryResize();
  };

  const handleResize = (): void => {
    scheduleResize();
  };

  const resizeObserver = new ResizeObserver(() => {
    scheduleRecoveryResize();
  });
  resizeObserver.observe(parent);

  const appRoot = document.getElementById('app');
  if (appRoot instanceof HTMLElement) {
    resizeObserver.observe(appRoot);
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('pageshow', handlePageShow);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (visualViewport) {
    visualViewport.addEventListener('resize', handleVisualViewportResize);
    visualViewport.addEventListener('scroll', handleVisualViewportResize);
  }

  game.events.once(Phaser.Core.Events.DESTROY, () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('pageshow', handlePageShow);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    if (visualViewport) {
      visualViewport.removeEventListener('resize', handleVisualViewportResize);
      visualViewport.removeEventListener('scroll', handleVisualViewportResize);
    }

    clearScheduledRefreshes();

    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
    }
  });

  scheduleRecoveryResize();
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
