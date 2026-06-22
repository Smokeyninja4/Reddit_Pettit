import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';

const VIEWPORT_REFRESH_EVENT = 'devvit:viewport-refresh';

export class MainMenu extends Scene {
  private background: GameObjects.Image | null = null;
  private title: GameObjects.Text | null = null;
  private subtitle: GameObjects.Text | null = null;
  private prompt: GameObjects.Text | null = null;
  private panel: GameObjects.Rectangle | null = null;
  private readonly handleScaleResize = (): void => {
    this.refreshLayout();
  };

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.background = null;
    this.title = null;
    this.subtitle = null;
    this.prompt = null;
    this.panel = null;
  }

  create(): void {
    this.refreshLayout();
    this.scale.on('resize', this.handleScaleResize, this);
    this.events.on(VIEWPORT_REFRESH_EVENT, this.refreshLayout, this);
    const cleanupSceneListeners = (): void => {
      this.scale.off('resize', this.handleScaleResize, this);
      this.events.off(VIEWPORT_REFRESH_EVENT, this.refreshLayout, this);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupSceneListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupSceneListeners);
    this.input.once('pointerdown', () => {
      this.scene.start('Game');
    });
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;
    const scaleFactor = Math.min(width / 1024, height / 768);
    const panelWidth = Math.min(width * 0.82, 760);
    const panelHeight = Math.min(height * 0.44, 320);

    this.cameras.resize(width, height);

    if (!this.background) {
      this.background = this.add.image(0, 0, 'background').setOrigin(0);
    }
    this.background.setDisplaySize(width, height);

    if (!this.panel) {
      this.panel = this.add
        .rectangle(0, 0, panelWidth, panelHeight, 0x101820, 0.78)
        .setStrokeStyle(2, 0xf4ede1, 0.7);
    }
    this.panel.setPosition(width / 2, height / 2);
    this.panel.setSize(panelWidth, panelHeight);

    if (!this.title) {
      this.title = this.add
        .text(0, 0, 'Pettit', {
          fontFamily: 'Georgia',
          fontSize: '52px',
          color: '#fff8e8',
          align: 'center',
        })
        .setOrigin(0.5);
    }
    this.title.setPosition(width / 2, height * 0.39);
    this.title.setScale(scaleFactor);

    if (!this.subtitle) {
      this.subtitle = this.add
        .text(0, 0, 'One pet. Thousands of owners.', {
          fontFamily: 'Trebuchet MS',
          fontSize: '24px',
          color: '#f6c453',
          align: 'center',
          wordWrap: { width: panelWidth - 60 },
        })
        .setOrigin(0.5);
    }
    this.subtitle.setPosition(width / 2, height * 0.49);
    this.subtitle.setScale(scaleFactor);
    this.subtitle.setWordWrapWidth(panelWidth - 60);

    if (!this.prompt) {
      this.prompt = this.add
        .text(0, 0, 'Tap anywhere to see what the community wants Pettit to do next.', {
          fontFamily: 'Trebuchet MS',
          fontSize: '21px',
          color: '#d9e4ec',
          align: 'center',
          wordWrap: { width: panelWidth - 80 },
        })
        .setOrigin(0.5);
    }
    this.prompt.setPosition(width / 2, height * 0.61);
    this.prompt.setScale(scaleFactor);
    this.prompt.setWordWrapWidth(panelWidth - 80);
  }
}
