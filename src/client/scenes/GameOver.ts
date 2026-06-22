import { Scene } from 'phaser';
import * as Phaser from 'phaser';

const VIEWPORT_REFRESH_EVENT = 'devvit:viewport-refresh';

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameover_text: Phaser.GameObjects.Text;
  private readonly handleScaleResize = (gameSize: Phaser.Structs.Size): void => {
    this.updateLayout(gameSize.width, gameSize.height);
  };

  constructor() {
    super('GameOver');
  }

  create() {
    // Configure camera
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xff0000);

    // Background – create once, full-screen
    this.background = this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.5);

    // "Game Over" text – created once and scaled responsively
    this.gameover_text = this.add
      .text(0, 0, 'Game Over', {
        fontFamily: 'Arial Black',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Initial responsive layout
    this.updateLayout(this.scale.width, this.scale.height);

    // Update layout on canvas resize / orientation change
    this.scale.on('resize', this.handleScaleResize, this);
    this.events.on(VIEWPORT_REFRESH_EVENT, this.handleViewportRefresh, this);
    const cleanupSceneListeners = (): void => {
      this.scale.off('resize', this.handleScaleResize, this);
      this.events.off(VIEWPORT_REFRESH_EVENT, this.handleViewportRefresh, this);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupSceneListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupSceneListeners);

    // Return to Main Menu on tap / click
    this.input.once('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }

  private handleViewportRefresh(): void {
    this.updateLayout(this.scale.width, this.scale.height);
  }

  private updateLayout(width: number, height: number): void {
    // Resize camera viewport to prevent black bars
    this.cameras.resize(width, height);

    // Stretch background to fill entire screen
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }

    // Compute scale factor (never enlarge above 1×)
    const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

    // Centre and scale the game-over text
    if (this.gameover_text) {
      this.gameover_text.setPosition(width / 2, height / 2);
      this.gameover_text.setScale(scaleFactor);
    }
  }
}
