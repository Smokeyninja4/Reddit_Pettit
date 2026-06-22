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
    // We handle viewport changes ourselves because the Reddit preview can briefly report
    // invalid zero-sized containers while switching platforms / modal states.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const VIEWPORT_REFRESH_EVENT = 'devvit:viewport-refresh';
const GAME_PARENT_ID = 'game-container';
const RECOVERY_BURST_DELAYS = [80, 180, 320, 500, 900];

type RefreshableScene = Phaser.Scene & {
  events: Phaser.Events.EventEmitter;
};

const MIN_VIEWPORT_SIZE = 32;
let activeGame: Game | null = null;
let restartPending = false;

const getViewportSize = (parent: HTMLElement): { width: number; height: number } => {
  const appRoot = document.getElementById('app');
  const parentRect = parent.getBoundingClientRect();
  const appRect = appRoot instanceof HTMLElement ? appRoot.getBoundingClientRect() : null;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 1024;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? 768;

  const containerWidth = Math.max(
    parent.clientWidth,
    Math.floor(parentRect.width),
    appRoot instanceof HTMLElement ? appRoot.clientWidth : 0,
    appRect ? Math.floor(appRect.width) : 0
  );
  const containerHeight = Math.max(
    parent.clientHeight,
    Math.floor(parentRect.height),
    appRoot instanceof HTMLElement ? appRoot.clientHeight : 0,
    appRect ? Math.floor(appRect.height) : 0
  );

  const boundedWidth =
    containerWidth > 0 && viewportWidth > 0 ? Math.min(containerWidth, Math.floor(viewportWidth)) : 0;
  const boundedHeight =
    containerHeight > 0 && viewportHeight > 0 ? Math.min(containerHeight, Math.floor(viewportHeight)) : 0;

  const width = Math.max(1, Math.floor(boundedWidth || viewportWidth || containerWidth || 1024));
  const height = Math.max(1, Math.floor(boundedHeight || viewportHeight || containerHeight || 768));
  return { width, height };
};

const isUsableViewport = (width: number, height: number): boolean => {
  return width >= MIN_VIEWPORT_SIZE && height >= MIN_VIEWPORT_SIZE;
};

const refreshScenes = (game: Game): void => {
  const scenes = game.scene.getScenes(true) as RefreshableScene[];
  scenes.forEach((scene) => {
    scene.events.emit(VIEWPORT_REFRESH_EVENT);
  });
};

const applyCanvasSize = (game: Game, width: number, height: number): void => {
  game.scale.resize(width, height);
  game.renderer.resize(width, height);
  game.canvas.style.width = `${width}px`;
  game.canvas.style.height = `${height}px`;
};

const hasRenderableCanvas = (game: Game): boolean => {
  return game.canvas.width >= MIN_VIEWPORT_SIZE && game.canvas.height >= MIN_VIEWPORT_SIZE;
};

const canvasMatchesSize = (game: Game, width: number, height: number): boolean => {
  return (
    Math.abs(game.canvas.width - width) <= 1 &&
    Math.abs(game.canvas.height - height) <= 1 &&
    Math.abs(game.scale.width - width) <= 1 &&
    Math.abs(game.scale.height - height) <= 1
  );
};

const resizeGameToParent = (game: Game, parent: HTMLElement): { width: number; height: number } | null => {
  const { width, height } = getViewportSize(parent);
  if (!isUsableViewport(width, height)) {
    return null;
  }

  applyCanvasSize(game, width, height);
  refreshScenes(game);
  game.loop.wake();
  game.events.emit(Phaser.Core.Events.RESUME);
  return { width, height };
};

const recreateGame = (parentId: string): void => {
  if (restartPending) {
    return;
  }

  restartPending = true;

  const gameToDestroy = activeGame;

  if (!gameToDestroy) {
    restartPending = false;
    startGame(parentId);
    return;
  }

  gameToDestroy.events.once(Phaser.Core.Events.DESTROY, () => {
    if (activeGame === gameToDestroy) {
      activeGame = null;
    }

    restartPending = false;
    startGame(parentId);
  });

  gameToDestroy.destroy(false);
};

const attachViewportGuards = (game: Game, parent: HTMLElement, parentId: string): void => {
  let rafId = 0;
  let timeoutIds: number[] = [];
  let recreateTimeoutId = 0;
  const initialSize = getViewportSize(parent);
  let lastGoodSize = isUsableViewport(initialSize.width, initialSize.height) ? initialSize : null;

  const clearScheduledRefreshes = (): void => {
    timeoutIds.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIds = [];

    if (recreateTimeoutId !== 0) {
      window.clearTimeout(recreateTimeoutId);
      recreateTimeoutId = 0;
    }
  };

  const runResize = (): void => {
    if (!game.isBooted || activeGame !== game) {
      return;
    }

    const nextSize = resizeGameToParent(game, parent);

    if (!nextSize) {
      if (lastGoodSize) {
        applyCanvasSize(game, lastGoodSize.width, lastGoodSize.height);
      }
      return;
    }

    lastGoodSize = nextSize;

    if (hasRenderableCanvas(game) && canvasMatchesSize(game, nextSize.width, nextSize.height)) {
      if (recreateTimeoutId !== 0) {
        window.clearTimeout(recreateTimeoutId);
        recreateTimeoutId = 0;
      }
      return;
    }

    if (recreateTimeoutId === 0) {
      recreateTimeoutId = window.setTimeout(() => {
        recreateTimeoutId = 0;

        if (activeGame !== game) {
          return;
        }

        const recoveredSize = resizeGameToParent(game, parent);
        if (
          !recoveredSize ||
          !hasRenderableCanvas(game) ||
          !canvasMatchesSize(game, recoveredSize.width, recoveredSize.height)
        ) {
          recreateGame(parentId);
        }
      }, 150);
    }
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
      timeoutIds = RECOVERY_BURST_DELAYS.map((delay) =>
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
    if (activeGame === game) {
      activeGame = null;
    }

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
  if (activeGame || restartPending) {
    return;
  }

  const parent = document.getElementById(parentId);

  if (!(parent instanceof HTMLElement)) {
    throw new Error(`Missing game container: ${parentId}`);
  }

  const game = new Game({ ...config, parent: parentId });
  activeGame = game;
  attachViewportGuards(game, parent, parentId);
};

const bootstrap = (): void => {
  startGame(GAME_PARENT_ID);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
