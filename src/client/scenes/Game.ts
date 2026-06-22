import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { fetchPettitState, resolvePettitVote, submitPettitVote } from '../pettitApi';
import type { PettitViewModel, TraitKey } from '../../shared/pettit';
import type { ResolveVoteResponse } from '../../shared/api';

const VIEWPORT_REFRESH_EVENT = 'devvit:viewport-refresh';

type LayoutMode = 'dashboard' | 'stacked';

type LayoutMetrics = {
  width: number;
  height: number;
  mode: LayoutMode;
  frameLeft: number;
  frameTop: number;
  frameWidth: number;
  frameHeight: number;
  padding: number;
  gap: number;
  panelRadius: number;
  titleGap: number;
  cardInsetX: number;
  cardInsetY: number;
  buttonGap: number;
  actionButtonHeight: number;
  scaleFactor: number;
  contentTop: number;
  contentBottom: number;
  leftColumnWidth: number;
  rightColumnWidth: number;
};

type PanelFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TraitBarVisual = {
  label: Phaser.GameObjects.Text;
  track: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  value: Phaser.GameObjects.Text;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(value, max));
};

export class Game extends Scene {
  private static readonly optionIdDataKey = 'optionId';
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private background!: Phaser.GameObjects.Image;
  private rootPanel!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private summaryText!: Phaser.GameObjects.Text;
  private creaturePanel!: Phaser.GameObjects.Rectangle;
  private creatureArtFrame!: Phaser.GameObjects.Rectangle;
  private creatureShadow!: Phaser.GameObjects.Ellipse;
  private creatureBody!: Phaser.GameObjects.Ellipse;
  private creatureBelly!: Phaser.GameObjects.Ellipse;
  private creatureBlushLeft!: Phaser.GameObjects.Ellipse;
  private creatureBlushRight!: Phaser.GameObjects.Ellipse;
  private creatureEyeLeft!: Phaser.GameObjects.Ellipse;
  private creatureEyeRight!: Phaser.GameObjects.Ellipse;
  private creatureSpark!: Phaser.GameObjects.Ellipse;
  private creatureMouth!: Phaser.GameObjects.Arc;
  private creatureCaptionText!: Phaser.GameObjects.Text;
  private futureSlotText!: Phaser.GameObjects.Text;
  private actionPanel!: Phaser.GameObjects.Rectangle;
  private actionTitleText!: Phaser.GameObjects.Text;
  private voteSummaryText!: Phaser.GameObjects.Text;
  private traitPanel!: Phaser.GameObjects.Rectangle;
  private traitPanelTitle!: Phaser.GameObjects.Text;
  private topActionPanel!: Phaser.GameObjects.Rectangle;
  private topActionTitle!: Phaser.GameObjects.Text;
  private topActionBody!: Phaser.GameObjects.Text;
  private journalPanel!: Phaser.GameObjects.Rectangle;
  private journalTitleText!: Phaser.GameObjects.Text;
  private journalBodyText!: Phaser.GameObjects.Text;
  private memoryPanel!: Phaser.GameObjects.Rectangle;
  private memoryTitleText!: Phaser.GameObjects.Text;
  private memoryBodyText!: Phaser.GameObjects.Text;
  private inventoryPanel!: Phaser.GameObjects.Rectangle;
  private inventoryTitleText!: Phaser.GameObjects.Text;
  private inventoryBodyText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private traitFeedbackText!: Phaser.GameObjects.Text;
  private resolveButton!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Text[] = [];
  private traitBars: Record<TraitKey, TraitBarVisual> | null = null;
  private pettitState: PettitViewModel | null = null;
  private latestTraitFeedback: ResolveVoteResponse['traitFeedback'] | null = null;
  private readonly handleScaleResize = (gameSize: Phaser.Structs.Size): void => {
    this.updateLayout(gameSize.width, gameSize.height);
  };

  constructor() {
    super('Game');
  }

  create(): void {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x11181f);

    this.background = this.add.image(512, 384, 'background').setAlpha(0.12);

    this.rootPanel = this.add
      .rectangle(0, 0, 100, 100, 0x121a22, 0.96)
      .setOrigin(0)
      .setStrokeStyle(2, 0x31414c, 0.95);

    this.titleText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '32px',
      color: '#fff8e8',
    });
    this.subtitleText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#ad87ff',
      backgroundColor: '#3e2b67',
      padding: { x: 10, y: 4 },
    });
    this.summaryText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#c9d4dd',
    });

    this.creaturePanel = this.createPanel(0x171f27, 0x273743);
    this.creatureArtFrame = this.createPanel(0x203040, 0x3f6179);
    this.creatureShadow = this.add.ellipse(0, 0, 100, 30, 0x091017, 0.45);
    this.creatureBody = this.add.ellipse(0, 0, 160, 190, 0xfff1d8, 1).setStrokeStyle(3, 0x4e3a2f, 0.9);
    this.creatureBelly = this.add.ellipse(0, 0, 88, 78, 0xfff9ee, 0.95).setStrokeStyle(2, 0xe4d7c3, 0.8);
    this.creatureBlushLeft = this.add.ellipse(0, 0, 22, 14, 0xffb58f, 0.85);
    this.creatureBlushRight = this.add.ellipse(0, 0, 22, 14, 0xffb58f, 0.85);
    this.creatureEyeLeft = this.add.ellipse(0, 0, 12, 18, 0x1a2026, 1);
    this.creatureEyeRight = this.add.ellipse(0, 0, 12, 18, 0x1a2026, 1);
    this.creatureSpark = this.add.ellipse(0, 0, 20, 20, 0xff8f3f, 1).setStrokeStyle(2, 0x5d3421, 0.85);
    this.creatureMouth = this.add.arc(0, 0, 18, 160, 20, false).setStrokeStyle(3, 0x1a2026, 1);
    this.creatureCaptionText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#fff3dc',
      align: 'center',
    });
    this.futureSlotText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#d7e7f0',
      align: 'center',
      wordWrap: { width: 280 },
    });

    this.actionPanel = this.createPanel(0x171f27, 0x273743);
    this.actionTitleText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#ffe7a8',
    });
    this.voteSummaryText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#d2dce5',
      wordWrap: { width: 500 },
      lineSpacing: 6,
    });

    this.traitPanel = this.createPanel(0x171f27, 0x273743);
    this.traitPanelTitle = this.add.text(0, 0, 'Traits', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#fff2cf',
    });

    this.topActionPanel = this.createPanel(0x171f27, 0x273743);
    this.topActionTitle = this.add.text(0, 0, 'Community Stats', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#fff2cf',
    });
    this.topActionBody = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#d7e7f0',
      wordWrap: { width: 240 },
      lineSpacing: 6,
    });

    this.journalPanel = this.createPanel(0x171f27, 0x273743);
    this.journalTitleText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '26px',
      color: '#fff0cf',
      wordWrap: { width: 520 },
    });
    this.journalBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#f3f6f8',
      wordWrap: { width: 520 },
      lineSpacing: 8,
    });

    this.memoryPanel = this.createPanel(0x171f27, 0x273743);
    this.memoryTitleText = this.add.text(0, 0, 'Recent Memories', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#dff3ea',
    });
    this.memoryBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#d7e7f0',
      wordWrap: { width: 240 },
      lineSpacing: 8,
    });
    this.inventoryPanel = this.createPanel(0x171f27, 0x273743);
    this.inventoryTitleText = this.add.text(0, 0, 'Community Gifts', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f5ead1',
    });
    this.inventoryBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#d7e7f0',
      wordWrap: { width: 240 },
      lineSpacing: 6,
    });

    this.statusText = this.add.text(0, 0, 'Loading Pettit...', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#ffe9a8',
      align: 'center',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    });
    this.statusText.setOrigin(0.5, 0);
    this.traitFeedbackText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#d9e4ec',
      align: 'center',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    });
    this.traitFeedbackText.setOrigin(0.5, 0);

    this.resolveButton = this.add
      .text(0, 0, 'Resolve current vote', {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#142028',
        backgroundColor: '#f6c453',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        void this.handleResolve();
      })
      .on('pointerover', () => this.resolveButton.setStyle({ backgroundColor: '#ffd980' }))
      .on('pointerout', () => this.resolveButton.setStyle({ backgroundColor: '#f6c453' }));

    this.createTraitBars();

    this.scale.on('resize', this.handleScaleResize, this);
    this.events.on(VIEWPORT_REFRESH_EVENT, this.handleViewportRefresh, this);
    const cleanupSceneListeners = (): void => {
      this.scale.off('resize', this.handleScaleResize, this);
      this.events.off(VIEWPORT_REFRESH_EVENT, this.handleViewportRefresh, this);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupSceneListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupSceneListeners);

    this.updateLayout(this.scale.width, this.scale.height);
    void this.loadState();
  }

  private createPanel(fillColor: number, strokeColor: number): Phaser.GameObjects.Rectangle {
    return this.add
      .rectangle(0, 0, 100, 100, fillColor, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, strokeColor, 0.95);
  }

  private createTraitBars(): void {
    this.traitBars = {
      curiosity: this.createTraitBar(),
      chaos: this.createTraitBar(),
      trust: this.createTraitBar(),
      courage: this.createTraitBar(),
    };
  }

  private createTraitBar(): TraitBarVisual {
    return {
      label: this.add.text(0, 0, '', {
        fontFamily: 'Trebuchet MS',
        fontSize: '15px',
        color: '#d9e4ec',
      }),
      track: this.add.rectangle(0, 0, 100, 12, 0x232d35, 1).setOrigin(0, 0.5),
      fill: this.add.rectangle(0, 0, 50, 12, 0x6fbf73, 1).setOrigin(0, 0.5),
      value: this.add.text(0, 0, '', {
        fontFamily: 'Trebuchet MS',
        fontSize: '14px',
        color: '#a9bac7',
      }),
    };
  }

  private handleViewportRefresh(): void {
    if (this.pettitState) {
      this.renderState();
      return;
    }

    this.updateLayout(this.scale.width, this.scale.height);
  }

  private getLayoutMetrics(width: number, height: number): LayoutMetrics {
    const mode: LayoutMode = width >= 1060 && height >= 720 ? 'dashboard' : 'stacked';
    const scaleFactor = Math.min(Math.min(width / 1320, height / 980), 1);
    const padding = Math.round((mode === 'dashboard' ? 22 : 18) * scaleFactor);
    const gap = Math.round((mode === 'dashboard' ? 18 : 14) * scaleFactor);
    const frameWidth = Math.min(width - padding * 2, mode === 'dashboard' ? 1180 : 860);
    const frameHeight = Math.min(height - padding * 2, 900);
    const frameLeft = (width - frameWidth) / 2;
    const frameTop = (height - frameHeight) / 2;
    const contentTop = frameTop + 106 * scaleFactor;
    const contentBottom = frameTop + frameHeight - padding;
    const leftColumnWidth = mode === 'dashboard' ? Math.round(frameWidth * 0.62) : frameWidth - padding * 2;
    const rightColumnWidth =
      mode === 'dashboard'
        ? frameWidth - padding * 2 - leftColumnWidth - gap
        : frameWidth - padding * 2;

    return {
      width,
      height,
      mode,
      frameLeft,
      frameTop,
      frameWidth,
      frameHeight,
      padding,
      gap,
      panelRadius: 18,
      titleGap: Math.round(8 * scaleFactor),
      cardInsetX: Math.round(18 * scaleFactor),
      cardInsetY: Math.round(16 * scaleFactor),
      buttonGap: Math.round(12 * scaleFactor),
      actionButtonHeight: Math.round((mode === 'dashboard' ? 58 : 50) * scaleFactor),
      scaleFactor,
      contentTop,
      contentBottom,
      leftColumnWidth,
      rightColumnWidth,
    };
  }

  private updateTextStyles(metrics: LayoutMetrics): void {
    const compact = metrics.mode === 'dashboard' ? 1 : 0.9;
    const scale = metrics.scaleFactor * compact;

    this.titleText.setFontSize(Math.round(34 * scale));
    this.subtitleText.setFontSize(Math.round(15 * scale));
    this.summaryText.setFontSize(Math.round(17 * scale));
    this.creatureCaptionText.setFontSize(Math.round(28 * scale));
    this.futureSlotText.setFontSize(Math.round(15 * scale));
    this.actionTitleText.setFontSize(Math.round(23 * scale));
    this.voteSummaryText.setFontSize(Math.round(17 * scale));
    this.traitPanelTitle.setFontSize(Math.round(22 * scale));
    this.topActionTitle.setFontSize(Math.round(20 * scale));
    this.topActionBody.setFontSize(Math.round(16 * scale));
    this.journalTitleText.setFontSize(Math.round(25 * scale));
    this.journalBodyText.setFontSize(Math.round(17 * scale));
    this.memoryTitleText.setFontSize(Math.round(22 * scale));
    this.memoryBodyText.setFontSize(Math.round(15 * scale));
    this.inventoryTitleText.setFontSize(Math.round(20 * scale));
    this.inventoryBodyText.setFontSize(Math.round(14 * scale));
    this.statusText.setFontSize(Math.round(15 * scale));
    this.traitFeedbackText.setFontSize(Math.round(14 * scale));
    this.resolveButton.setFontSize(Math.round(17 * scale));

    this.optionButtons.forEach((button) => {
      button.setFontSize(Math.round(18 * scale));
    });

    if (this.traitBars) {
      Object.values(this.traitBars).forEach((bar) => {
        bar.label.setFontSize(Math.round(15 * scale));
        bar.value.setFontSize(Math.round(13 * scale));
      });
    }
  }

  private updateLayout(width: number, height: number): void {
    this.cameras.resize(width, height);

    this.background.setPosition(width / 2, height / 2);
    if (this.background.width > 0 && this.background.height > 0) {
      const scale = Math.max(width / this.background.width, height / this.background.height);
      this.background.setScale(scale);
    }

    const metrics = this.getLayoutMetrics(width, height);
    this.updateTextStyles(metrics);
    this.layoutDashboard(metrics);
  }

  private layoutDashboard(metrics: LayoutMetrics): void {
    this.rootPanel.setPosition(metrics.frameLeft, metrics.frameTop);
    this.rootPanel.setSize(metrics.frameWidth, metrics.frameHeight);

    const headerLeft = metrics.frameLeft + metrics.padding;
    const headerTop = metrics.frameTop + metrics.padding;

    this.titleText.setPosition(headerLeft, headerTop);
    this.subtitleText.setPosition(headerLeft + this.titleText.width + metrics.titleGap, headerTop + 7);
    this.summaryText.setPosition(headerLeft, headerTop + this.titleText.height + 10);

    if (metrics.mode === 'dashboard') {
      this.layoutWideDashboard(metrics);
    } else {
      this.layoutStackedDashboard(metrics);
    }
  }

  private layoutWideDashboard(metrics: LayoutMetrics): void {
    const leftX = metrics.frameLeft + metrics.padding;
    const rightX = leftX + metrics.leftColumnWidth + metrics.gap;
    const top = metrics.contentTop;
    const rightWidth = metrics.rightColumnWidth;
    const leftWidth = metrics.leftColumnWidth;
    const memoryHeight = clamp(Math.round(metrics.frameHeight * 0.17), 112, 164);
    const topAreaHeight = metrics.contentBottom - top - metrics.gap - memoryHeight;
    const creatureHeight = clamp(Math.round(topAreaHeight * 0.42), 180, 238);
    const actionHeight = topAreaHeight - creatureHeight - metrics.gap;
    const traitHeight = clamp(Math.round(topAreaHeight * 0.29), 136, 188);
    const topActionHeight = clamp(Math.round(topAreaHeight * 0.12), 72, 96);
    const resolveHeight = clamp(Math.round(topAreaHeight * 0.13), 74, 98);
    const journalHeight = topAreaHeight - traitHeight - topActionHeight - resolveHeight - metrics.gap * 3;
    const bottomY = top + topAreaHeight + metrics.gap;

    const creatureFrame: PanelFrame = { x: leftX, y: top, width: leftWidth, height: creatureHeight };
    const actionFrame: PanelFrame = {
      x: leftX,
      y: creatureFrame.y + creatureFrame.height + metrics.gap,
      width: leftWidth,
      height: actionHeight,
    };
    const traitFrame: PanelFrame = { x: rightX, y: top, width: rightWidth, height: traitHeight };
    const topActionFrame: PanelFrame = {
      x: rightX,
      y: traitFrame.y + traitFrame.height + metrics.gap,
      width: rightWidth,
      height: topActionHeight,
    };
    const journalFrame: PanelFrame = {
      x: rightX,
      y: topActionFrame.y + topActionFrame.height + metrics.gap,
      width: rightWidth,
      height: Math.max(journalHeight, 92),
    };
    const resolveFrame: PanelFrame = {
      x: rightX,
      y: journalFrame.y + journalFrame.height + metrics.gap,
      width: rightWidth,
      height: resolveHeight,
    };
    const bottomWidth = leftWidth + metrics.gap + rightWidth;
    const inventoryWidth = clamp(Math.round(bottomWidth * 0.32), 220, 320);
    const memoryFrame: PanelFrame = {
      x: leftX,
      y: bottomY,
      width: bottomWidth - inventoryWidth - metrics.gap,
      height: memoryHeight,
    };
    const inventoryFrame: PanelFrame = {
      x: memoryFrame.x + memoryFrame.width + metrics.gap,
      y: bottomY,
      width: inventoryWidth,
      height: memoryHeight,
    };

    this.layoutCreaturePanel(metrics, creatureFrame);
    this.layoutActionPanel(metrics, actionFrame);
    this.layoutTraitPanel(metrics, traitFrame);
    this.layoutTopActionPanel(metrics, topActionFrame);
    this.layoutJournalPanel(metrics, journalFrame);
    this.layoutResolveArea(metrics, resolveFrame);
    this.layoutMemoryPanel(metrics, memoryFrame);
    this.layoutInventoryPanel(metrics, inventoryFrame);
  }

  private layoutStackedDashboard(metrics: LayoutMetrics): void {
    const contentX = metrics.frameLeft + metrics.padding;
    const contentWidth = metrics.leftColumnWidth;
    let currentTop = metrics.contentTop;

    const creatureHeight = Math.round(metrics.frameHeight * 0.2);
    const creatureFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: creatureHeight,
    };
    this.layoutCreaturePanel(metrics, creatureFrame);
    currentTop += creatureHeight + metrics.gap;

    const traitHeight = 176;
    const traitFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: traitHeight,
    };
    this.layoutTraitPanel(metrics, traitFrame);
    currentTop += traitHeight + metrics.gap;

    const actionHeight = metrics.actionButtonHeight * Math.max(this.optionButtons.length, 1) + 110;
    const actionFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: actionHeight,
    };
    this.layoutActionPanel(metrics, actionFrame);
    currentTop += actionHeight + metrics.gap;

    const journalHeight = Math.round(metrics.frameHeight * 0.24);
    const journalFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: journalHeight,
    };
    this.layoutJournalPanel(metrics, journalFrame);
    currentTop += journalHeight + metrics.gap;

    const memoryHeight = Math.round(metrics.frameHeight * 0.16);
    const memoryFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: memoryHeight,
    };
    this.layoutMemoryPanel(metrics, memoryFrame);
    currentTop += memoryHeight + metrics.gap;

    const inventoryHeight = Math.round(metrics.frameHeight * 0.14);
    const inventoryFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: inventoryHeight,
    };
    this.layoutInventoryPanel(metrics, inventoryFrame);
    currentTop += inventoryHeight + metrics.gap;

    const topActionHeight = 88;
    const topActionFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: topActionHeight,
    };
    this.layoutTopActionPanel(metrics, topActionFrame);
    currentTop += topActionHeight + metrics.gap;

    const resolveFrame: PanelFrame = {
      x: contentX,
      y: currentTop,
      width: contentWidth,
      height: metrics.contentBottom - currentTop,
    };
    this.layoutResolveArea(metrics, resolveFrame);
  }

  private layoutCreaturePanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.creaturePanel.setPosition(frame.x, frame.y);
    this.creaturePanel.setSize(frame.width, frame.height);

    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const innerWidth = frame.width - metrics.cardInsetX * 2;
    const artHeight = frame.height - metrics.cardInsetY * 2;

    this.creatureArtFrame.setPosition(innerX, innerY);
    this.creatureArtFrame.setSize(innerWidth, artHeight);
    const creatureCenterX = innerX + innerWidth * 0.5;
    const creatureCenterY = innerY + artHeight * 0.58;
    const bodyWidth = Math.min(innerWidth * 0.33, artHeight * 0.72);
    const bodyHeight = Math.min(artHeight * 0.7, bodyWidth * 1.12);
    const eyeOffsetX = bodyWidth * 0.16;
    const eyeY = creatureCenterY - bodyHeight * 0.12;
    const blushOffsetX = bodyWidth * 0.22;
    const blushY = creatureCenterY + bodyHeight * 0.04;
    const mood = this.pettitState?.pettit.mood ?? 'curious';

    this.creatureShadow.setPosition(creatureCenterX, creatureCenterY + bodyHeight * 0.34);
    this.creatureShadow.setSize(bodyWidth * 0.78, bodyHeight * 0.18);
    this.creatureBody.setPosition(creatureCenterX, creatureCenterY);
    this.creatureBody.setSize(bodyWidth, bodyHeight);
    this.creatureBelly.setPosition(creatureCenterX, creatureCenterY + bodyHeight * 0.16);
    this.creatureBelly.setSize(bodyWidth * 0.52, bodyHeight * 0.4);
    this.creatureEyeLeft.setPosition(creatureCenterX - eyeOffsetX, eyeY);
    this.creatureEyeRight.setPosition(creatureCenterX + eyeOffsetX, eyeY);
    this.creatureBlushLeft.setPosition(creatureCenterX - blushOffsetX, blushY);
    this.creatureBlushRight.setPosition(creatureCenterX + blushOffsetX, blushY);
    this.creatureSpark.setPosition(creatureCenterX + bodyWidth * 0.16, creatureCenterY - bodyHeight * 0.52);
    this.creatureSpark.setSize(bodyWidth * 0.12, bodyWidth * 0.12);
    this.layoutCreatureFace(mood, creatureCenterX, creatureCenterY, bodyWidth, bodyHeight);

    this.creatureCaptionText.setPosition(innerX + 20, innerY + 16);
    this.creatureCaptionText.setWordWrapWidth(innerWidth - 40);
    this.futureSlotText.setWordWrapWidth(Math.max(180, innerWidth * 0.42));
    this.futureSlotText.setPosition(innerX + innerWidth - 18, innerY + 18);
    this.futureSlotText.setOrigin(1, 0);
  }

  private layoutCreatureFace(
    mood: PettitViewModel['pettit']['mood'],
    centerX: number,
    centerY: number,
    bodyWidth: number,
    bodyHeight: number
  ): void {
    const mouthY = centerY + bodyHeight * 0.08;

    this.creatureEyeLeft.setSize(bodyWidth * 0.065, bodyHeight * 0.1);
    this.creatureEyeRight.setSize(bodyWidth * 0.065, bodyHeight * 0.1);
    this.creatureMouth.setPosition(centerX, mouthY);
    this.creatureMouth.setRadius(bodyWidth * 0.12);
    this.creatureMouth.setRotation(0);

    if (mood === 'excited') {
      this.creatureEyeLeft.setSize(bodyWidth * 0.055, bodyHeight * 0.12);
      this.creatureEyeRight.setSize(bodyWidth * 0.055, bodyHeight * 0.12);
      this.creatureMouth.setStartAngle(150);
      this.creatureMouth.setEndAngle(30);
      return;
    }

    if (mood === 'thoughtful') {
      this.creatureEyeLeft.setPosition(centerX - bodyWidth * 0.18, centerY - bodyHeight * 0.14);
      this.creatureEyeRight.setPosition(centerX + bodyWidth * 0.14, centerY - bodyHeight * 0.1);
      this.creatureMouth.setStartAngle(190);
      this.creatureMouth.setEndAngle(350);
      return;
    }

    if (mood === 'nervous') {
      this.creatureEyeLeft.setSize(bodyWidth * 0.07, bodyHeight * 0.11);
      this.creatureEyeRight.setSize(bodyWidth * 0.07, bodyHeight * 0.11);
      this.creatureMouth.setStartAngle(205);
      this.creatureMouth.setEndAngle(335);
      this.creatureMouth.setRotation(0.12);
      return;
    }

    this.creatureMouth.setStartAngle(170);
    this.creatureMouth.setEndAngle(10);
  }

  private layoutActionPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.actionPanel.setPosition(frame.x, frame.y);
    this.actionPanel.setSize(frame.width, frame.height);

    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const innerWidth = frame.width - metrics.cardInsetX * 2;
    const buttonCount = Math.max(this.optionButtons.length, 1);

    this.actionTitleText.setPosition(innerX, innerY);
    this.voteSummaryText.setPosition(innerX, innerY + this.actionTitleText.height + 10);
    this.voteSummaryText.setWordWrapWidth(innerWidth);

    const buttonTop = this.voteSummaryText.y + this.voteSummaryText.height + 18;
    const buttonWidth =
      metrics.mode === 'dashboard'
        ? Math.floor((innerWidth - metrics.buttonGap * (buttonCount - 1)) / buttonCount)
        : innerWidth;

    this.optionButtons.forEach((button, index) => {
      if (metrics.mode === 'dashboard') {
        const buttonX = innerX + index * (buttonWidth + metrics.buttonGap);
        button.setPosition(buttonX, buttonTop);
        button.setFixedSize(buttonWidth, metrics.actionButtonHeight);
      } else {
        const buttonY = buttonTop + index * (metrics.actionButtonHeight + metrics.buttonGap);
        button.setPosition(innerX, buttonY);
        button.setFixedSize(buttonWidth, metrics.actionButtonHeight);
      }
      button.setWordWrapWidth(button.width - 24);
    });
  }

  private layoutTraitPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.traitPanel.setPosition(frame.x, frame.y);
    this.traitPanel.setSize(frame.width, frame.height);
    this.traitPanelTitle.setPosition(frame.x + metrics.cardInsetX, frame.y + metrics.cardInsetY);

    if (!this.traitBars || !this.pettitState) {
      return;
    }

    const labelWidth = clamp(Math.round(frame.width * 0.22), 74, 96);
    const valueWidth = 34;
    const barTrackWidth = frame.width - metrics.cardInsetX * 2 - labelWidth - valueWidth - 10;
    const startY = this.traitPanelTitle.y + this.traitPanelTitle.height + 18;
    const rowGap = clamp(Math.round(frame.height * 0.17), 28, 36);
    const barKeys: TraitKey[] = ['curiosity', 'chaos', 'trust', 'courage'];

    barKeys.forEach((traitKey, index) => {
      const bar = this.traitBars?.[traitKey];
      if (!bar) {
        return;
      }

      const rowY = startY + index * rowGap;
      bar.label.setPosition(frame.x + metrics.cardInsetX, rowY - 10);
      bar.track.setPosition(frame.x + metrics.cardInsetX + labelWidth, rowY);
      bar.track.setSize(barTrackWidth, 12);
      bar.value.setPosition(frame.x + frame.width - metrics.cardInsetX - valueWidth, rowY - 12);

      const value = this.pettitState?.pettit.traits[traitKey] ?? 0;
      const fillWidth = Math.max(18, Math.round((barTrackWidth * value) / 100));
      bar.fill.setPosition(bar.track.x, rowY);
      bar.fill.setSize(fillWidth, 12);
    });
  }

  private layoutTopActionPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.topActionPanel.setPosition(frame.x, frame.y);
    this.topActionPanel.setSize(frame.width, frame.height);
    this.topActionTitle.setPosition(frame.x + metrics.cardInsetX, frame.y + metrics.cardInsetY);
    this.topActionBody.setPosition(
      frame.x + metrics.cardInsetX,
      this.topActionTitle.y + this.topActionTitle.height + 10
    );
    this.topActionBody.setWordWrapWidth(frame.width - metrics.cardInsetX * 2);
  }

  private layoutJournalPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.journalPanel.setPosition(frame.x, frame.y);
    this.journalPanel.setSize(frame.width, frame.height);

    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const innerWidth = frame.width - metrics.cardInsetX * 2;

    this.journalTitleText.setPosition(innerX, innerY);
    this.journalTitleText.setWordWrapWidth(innerWidth);
    this.journalBodyText.setPosition(innerX, innerY + this.journalTitleText.height + 12);
    this.journalBodyText.setWordWrapWidth(innerWidth);
  }

  private layoutMemoryPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.memoryPanel.setPosition(frame.x, frame.y);
    this.memoryPanel.setSize(frame.width, frame.height);

    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const innerWidth = frame.width - metrics.cardInsetX * 2;

    this.memoryTitleText.setPosition(innerX, innerY);
    this.memoryBodyText.setPosition(innerX, innerY + this.memoryTitleText.height + 12);
    this.memoryBodyText.setWordWrapWidth(innerWidth);
  }

  private layoutInventoryPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.inventoryPanel.setPosition(frame.x, frame.y);
    this.inventoryPanel.setSize(frame.width, frame.height);

    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const innerWidth = frame.width - metrics.cardInsetX * 2;

    this.inventoryTitleText.setPosition(innerX, innerY);
    this.inventoryBodyText.setPosition(innerX, innerY + this.inventoryTitleText.height + 10);
    this.inventoryBodyText.setWordWrapWidth(innerWidth);
  }

  private layoutResolveArea(metrics: LayoutMetrics, frame: PanelFrame): void {
    const statusWidth = frame.width - metrics.cardInsetX * 2;
    this.statusText.setWordWrapWidth(statusWidth);
    this.statusText.setPosition(frame.x + frame.width / 2, frame.y + metrics.cardInsetY);
    this.traitFeedbackText.setWordWrapWidth(statusWidth);
    this.traitFeedbackText.setPosition(
      frame.x + frame.width / 2,
      this.statusText.y + this.statusText.height + 10
    );
    this.resolveButton.setPosition(
      frame.x + frame.width / 2,
      Math.min(
        this.traitFeedbackText.y + this.traitFeedbackText.height + 14,
        frame.y + frame.height - this.resolveButton.height - 8
      )
    );
  }

  private async loadState(): Promise<void> {
    try {
      const response = await fetchPettitState();
      this.pettitState = response.state;
      this.latestTraitFeedback = null;
      this.statusText.setText('The community is deciding what Pettit should do next.');
      this.syncOptionButtons();
      this.renderState();
    } catch (error) {
      console.error('Failed to load Pettit state:', error);
      this.statusText.setText(error instanceof Error ? error.message : 'Failed to load Pettit.');
      this.updateLayout(this.scale.width, this.scale.height);
    }
  }

  private syncOptionButtons(): void {
    const options = this.pettitState?.activeQuest.options ?? [];

    while (this.optionButtons.length > options.length) {
      const button = this.optionButtons.pop();
      if (button) {
        button.destroy();
      }
    }

    options.forEach((option, index) => {
      let button = this.optionButtons[index];

      if (!button) {
        button = this.add.text(0, 0, '', {
          fontFamily: 'Trebuchet MS',
          fontSize: '18px',
          color: '#f8fafc',
          backgroundColor: '#2f6d3a',
          align: 'center',
          padding: { x: 16, y: 10 },
        });
        const createdButton = button;

        createdButton.setOrigin(0, 0);
        createdButton.setInteractive({ useHandCursor: true });
        createdButton.on('pointerover', () => {
          if (!this.pettitState?.activeQuest.hasVoted) {
            createdButton.setStyle({ backgroundColor: '#468b53' });
          }
        });
        createdButton.on('pointerout', () => {
          const currentOptionId = createdButton.getData(Game.optionIdDataKey) as string | undefined;
          this.applyOptionState(createdButton, currentOptionId ?? option.id);
        });
        createdButton.on('pointerdown', () => {
          const currentOptionId = createdButton.getData(Game.optionIdDataKey) as string | undefined;

          if (!currentOptionId) {
            return;
          }

          void this.handleVote(currentOptionId);
        });
        this.optionButtons.push(createdButton);
      }
    });

    this.renderOptionButtons();
    this.updateLayout(this.scale.width, this.scale.height);
  }

  private renderState(): void {
    if (!this.pettitState) {
      return;
    }

    const { pettit, activeQuest, latestJournal, recentMemories } = this.pettitState;
    this.titleText.setText(pettit.name);
    this.subtitleText.setText('Community Creature');
    this.summaryText.setText(
      `Day ${pettit.ageDays} • Mood: ${this.capitalize(pettit.mood)} • Top traits: ${pettit.topTraits.map((trait) => this.formatTraitName(trait)).join(' + ')}`
    );

    this.creatureCaptionText.setText(`${pettit.name}`);
    this.futureSlotText.setText(
      `Mood: ${this.capitalize(pettit.mood)}\nA tiny placeholder creature while Pettit grows into its final form.`
    );

    this.actionTitleText.setText(activeQuest.title);
    this.voteSummaryText.setText(
      `${activeQuest.description}\n\nVotes: ${activeQuest.totalVotes}${activeQuest.hasVoted ? ' • Your vote is in.' : ' • Pick one action.'}`
    );

    this.topActionBody.setText(
      [
        `Age: Day ${pettit.ageDays}`,
        `Total Votes: ${this.formatCount(this.pettitState.communityStats.totalVotes)}`,
        `Quests Completed: ${this.formatCount(this.pettitState.communityStats.questsCompleted)}`,
        `Memories Created: ${this.formatCount(this.pettitState.communityStats.memoriesCreated)}`,
      ].join('\n')
    );

    this.renderTraitBars();
    this.renderOptionButtons();
    this.renderTraitFeedback();

    if (latestJournal) {
      this.journalTitleText.setText(`Journal • ${latestJournal.title}`);
      this.journalBodyText.setText(latestJournal.content);
    } else {
      this.journalTitleText.setText('Journal');
      this.journalBodyText.setText('Resolve the first vote to give Pettit its opening journal entry.');
    }

    if (recentMemories.length > 0) {
      this.memoryBodyText.setText(
        recentMemories
          .map((memory) => `${memory.title}\n${memory.description}`)
          .join('\n\n')
      );
    } else {
      this.memoryBodyText.setText('No memories yet. The first resolved quest will give Pettit something to remember.');
    }

    if (this.pettitState.inventory.length > 0) {
      this.inventoryBodyText.setText(
        this.pettitState.inventory
          .slice(-4)
          .reverse()
          .map((item) => `${item.name}\n${this.formatGiftCategory(item.category)} • ${item.description}`)
          .join('\n\n')
      );
    } else {
      this.inventoryBodyText.setText('No gifts yet. A community gift round will let everyone choose something Pettit can keep.');
    }

    this.updateLayout(this.scale.width, this.scale.height);
  }

  private renderTraitBars(): void {
    if (!this.traitBars || !this.pettitState) {
      return;
    }

    const traitConfig: Array<{ key: TraitKey; label: string; color: number }> = [
      { key: 'curiosity', label: 'Curiosity', color: 0xf7b737 },
      { key: 'chaos', label: 'Chaos', color: 0xff6b6b },
      { key: 'trust', label: 'Trust', color: 0x5c8dff },
      { key: 'courage', label: 'Courage', color: 0x61d095 },
    ];

    traitConfig.forEach(({ key, label, color }) => {
      const bar = this.traitBars?.[key];
      if (!bar) {
        return;
      }

      const value = this.pettitState?.pettit.traits[key] ?? 0;
      bar.label.setText(label);
      bar.value.setText(String(value));
      bar.fill.setFillStyle(color, 1);
    });
  }

  private renderOptionButtons(): void {
    if (!this.pettitState) {
      return;
    }

    const palette = ['#2f6d3a', '#3f67d8', '#7241ba', '#b4533b'];

    this.pettitState.activeQuest.options.forEach((option, index) => {
      const button = this.optionButtons[index];

      if (!button) {
        return;
      }

      button.setData(Game.optionIdDataKey, option.id);
      button.setText(option.label);
      button.setStyle({
        backgroundColor: palette[index] ?? '#53647a',
      });
      this.applyOptionState(button, option.id);
    });
  }

  private renderTraitFeedback(): void {
    if (!this.latestTraitFeedback) {
      this.traitFeedbackText.setText('');
      return;
    }

    const changeLines = this.latestTraitFeedback.appliedChanges
      .slice(0, 2)
      .map((change) => `${this.formatTraitName(change.trait)} ${change.delta > 0 ? '+' : ''}${change.delta}`);

    const text = [this.latestTraitFeedback.summary, ...changeLines].join('\n');
    this.traitFeedbackText.setText(text);
  }

  private applyOptionState(button: Phaser.GameObjects.Text, optionId: string): void {
    const quest = this.pettitState?.activeQuest;

    if (!quest) {
      return;
    }

    const isSelected = quest.selectedOptionId === optionId;
    const isLocked = quest.hasVoted;
    const baseColor = (button.style.backgroundColor as string | undefined) ?? '#53647a';

    if (isSelected) {
      button.setStyle({
        backgroundColor: '#f6c453',
        color: '#142028',
      });
    } else {
      button.setStyle({
        backgroundColor: isLocked ? '#6a7686' : baseColor,
        color: '#f8fafc',
      });
    }

    if (isLocked) {
      button.disableInteractive();
      button.setAlpha(isSelected ? 1 : 0.8);
    } else {
      if (!button.input?.enabled) {
        button.setInteractive({ useHandCursor: true });
      }
      button.setAlpha(1);
    }
  }

  private async handleVote(optionId: string): Promise<void> {
    if (this.pettitState?.activeQuest.hasVoted) {
      return;
    }

    try {
      this.statusText.setText('Recording your vote...');
      this.latestTraitFeedback = null;
      this.updateLayout(this.scale.width, this.scale.height);
      const response = await submitPettitVote({ optionId });
      this.pettitState = response.state;
      this.statusText.setText('Vote recorded. Pettit is waiting for the community.');
      this.syncOptionButtons();
      this.renderState();
    } catch (error) {
      console.error('Failed to submit vote:', error);

      if (error instanceof Error && error.message === 'The selected option is no longer valid') {
        this.statusText.setText('That choice just changed. Refreshing Pettit...');
        this.updateLayout(this.scale.width, this.scale.height);
        await this.loadState();
        this.statusText.setText('That quest updated before your vote landed. Please choose again.');
        this.updateLayout(this.scale.width, this.scale.height);
        return;
      }

      this.statusText.setText(error instanceof Error ? error.message : 'Failed to submit vote.');
      this.updateLayout(this.scale.width, this.scale.height);
    }
  }

  private async handleResolve(): Promise<void> {
    try {
      this.statusText.setText('Resolving the current vote...');
      this.updateLayout(this.scale.width, this.scale.height);
      const response = await resolvePettitVote();
      this.pettitState = response.state;
      this.latestTraitFeedback = response.traitFeedback;
      this.statusText.setText(`Resolved with "${this.humanizeOptionId(response.resolution.winningOptionId)}".`);
      this.syncOptionButtons();
      this.renderState();
      this.flashPanel(this.journalPanel, 0xd89a48);
      this.flashPanel(this.memoryPanel, 0x63c19d);
    } catch (error) {
      console.error('Failed to resolve vote:', error);
      this.statusText.setText(error instanceof Error ? error.message : 'Failed to resolve vote.');
      this.updateLayout(this.scale.width, this.scale.height);
    }
  }

  private flashPanel(panel: Phaser.GameObjects.Rectangle, flashColor: number): void {
    const originalFill = panel.fillColor;
    panel.setFillStyle(flashColor, 0.95);
    this.time.delayedCall(500, () => {
      panel.setFillStyle(originalFill, 0.94);
    });
  }

  private formatTraitName(traitKey: TraitKey | undefined): string {
    if (!traitKey) {
      return 'Curiosity';
    }

    return this.capitalize(traitKey);
  }

  private humanizeOptionId(optionId: string): string {
    return optionId
      .split('-')
      .map((part) => this.capitalize(part))
      .join(' ');
  }

  private formatCount(value: number): string {
    return value.toLocaleString();
  }

  private formatGiftCategory(category: string): string {
    return category
      .split('-')
      .map((part) => this.capitalize(part))
      .join(' ');
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
