import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { fetchPettitMemories, fetchPettitState, resolvePettitVote, submitPettitVote } from '../pettitApi';
import { buildPettitPortraitDataUrl, getPettitPortraitSignature } from '../pettitPortrait';
import type {
  GiftCategory,
  HallOfMemoriesDetailView,
  PettitAppearanceDna,
  PettitMemory,
  PettitViewModel,
  TraitKey,
} from '../../shared/pettit';
import type { ResolveVoteResponse } from '../../shared/api';

const VIEWPORT_REFRESH_EVENT = 'devvit:viewport-refresh';

type LayoutMode = 'desktop' | 'mobile';
type OverlayView = 'journal' | 'inventory' | 'stats';

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
  private static readonly optionBaseColorDataKey = 'optionBaseColor';
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private background!: Phaser.GameObjects.Image;
  private rootPanel!: Phaser.GameObjects.Rectangle;
  private mobileRootSkin!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private summaryText!: Phaser.GameObjects.Text;
  private creaturePanel!: Phaser.GameObjects.Rectangle;
  private mobileCreatureSkin!: Phaser.GameObjects.Image;
  private creatureArtFrame!: Phaser.GameObjects.Rectangle;
  private creatureSnapshot!: Phaser.GameObjects.Image;
  private creatureEarLeft!: Phaser.GameObjects.Ellipse;
  private creatureEarRight!: Phaser.GameObjects.Ellipse;
  private creatureShadow!: Phaser.GameObjects.Ellipse;
  private creatureBody!: Phaser.GameObjects.Ellipse;
  private creatureBelly!: Phaser.GameObjects.Ellipse;
  private creatureBlushLeft!: Phaser.GameObjects.Ellipse;
  private creatureBlushRight!: Phaser.GameObjects.Ellipse;
  private creatureEyeLeft!: Phaser.GameObjects.Ellipse;
  private creatureEyeRight!: Phaser.GameObjects.Ellipse;
  private creatureAccentPatch!: Phaser.GameObjects.Ellipse;
  private creatureAccentBand!: Phaser.GameObjects.Rectangle;
  private creatureSpark!: Phaser.GameObjects.Ellipse;
  private creatureMouth!: Phaser.GameObjects.Arc;
  private creatureBackAccessoryMain!: Phaser.GameObjects.Rectangle;
  private creatureBackAccessoryAccent!: Phaser.GameObjects.Rectangle;
  private creatureWearableTop!: Phaser.GameObjects.Rectangle;
  private creatureWearableBrim!: Phaser.GameObjects.Rectangle;
  private creatureWearableAccent!: Phaser.GameObjects.Ellipse;
  private creatureFrontAccessoryMain!: Phaser.GameObjects.Rectangle;
  private creatureFrontAccessoryAccent!: Phaser.GameObjects.Ellipse;
  private creatureHeldAccessoryMain!: Phaser.GameObjects.Rectangle;
  private creatureHeldAccessoryAccent!: Phaser.GameObjects.Ellipse;
  private creatureHeldAccessoryStem!: Phaser.GameObjects.Rectangle;
  private creatureCaptionText!: Phaser.GameObjects.Text;
  private moodBadgeText!: Phaser.GameObjects.Text;
  private futureSlotText!: Phaser.GameObjects.Text;
  private actionPanel!: Phaser.GameObjects.Rectangle;
  private mobileActionSkin!: Phaser.GameObjects.Image;
  private actionTitleText!: Phaser.GameObjects.Text;
  private voteSummaryText!: Phaser.GameObjects.Text;
  private traitPanel!: Phaser.GameObjects.Rectangle;
  private mobileTraitSkin!: Phaser.GameObjects.Image;
  private traitPanelTitle!: Phaser.GameObjects.Text;
  private topActionPanel!: Phaser.GameObjects.Rectangle;
  private topActionTitle!: Phaser.GameObjects.Text;
  private topActionBody!: Phaser.GameObjects.Text;
  private seasonalPanel!: Phaser.GameObjects.Rectangle;
  private seasonalTitleText!: Phaser.GameObjects.Text;
  private seasonalBodyText!: Phaser.GameObjects.Text;
  private achievementPanel!: Phaser.GameObjects.Rectangle;
  private achievementTitleText!: Phaser.GameObjects.Text;
  private achievementBodyText!: Phaser.GameObjects.Text;
  private journalPanel!: Phaser.GameObjects.Rectangle;
  private journalTitleText!: Phaser.GameObjects.Text;
  private journalBodyText!: Phaser.GameObjects.Text;
  private resolvePanel!: Phaser.GameObjects.Rectangle;
  private memoryPanel!: Phaser.GameObjects.Rectangle;
  private memoryTitleText!: Phaser.GameObjects.Text;
  private memoryBodyText!: Phaser.GameObjects.Text;
  private hallPanel!: Phaser.GameObjects.Rectangle;
  private hallTitleText!: Phaser.GameObjects.Text;
  private hallBodyText!: Phaser.GameObjects.Text;
  private hallButton!: Phaser.GameObjects.Text;
  private namesPanel!: Phaser.GameObjects.Rectangle;
  private namesTitleText!: Phaser.GameObjects.Text;
  private namesBodyText!: Phaser.GameObjects.Text;
  private inventoryPanel!: Phaser.GameObjects.Rectangle;
  private inventoryTitleText!: Phaser.GameObjects.Text;
  private inventoryBodyText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private traitFeedbackText!: Phaser.GameObjects.Text;
  private resolveButton!: Phaser.GameObjects.Text;
  private hallOverlayBackdrop!: Phaser.GameObjects.Rectangle;
  private hallOverlayPanel!: Phaser.GameObjects.Rectangle;
  private hallOverlayTitleText!: Phaser.GameObjects.Text;
  private hallOverlayCloseButton!: Phaser.GameObjects.Text;
  private hallOverlayHighlightedTitleText!: Phaser.GameObjects.Text;
  private hallOverlayHighlightedBodyText!: Phaser.GameObjects.Text;
  private hallOverlayArchiveTitleText!: Phaser.GameObjects.Text;
  private hallOverlayArchiveBodyText!: Phaser.GameObjects.Text;
  private hallOverlayPageText!: Phaser.GameObjects.Text;
  private hallOverlayPrevButton!: Phaser.GameObjects.Text;
  private hallOverlayNextButton!: Phaser.GameObjects.Text;
  private navRailPanel!: Phaser.GameObjects.Rectangle;
  private mobileNavRailPanel!: Phaser.GameObjects.Rectangle;
  private mobileNavSkin!: Phaser.GameObjects.Image;
  private navBrandText!: Phaser.GameObjects.Text;
  private navBrandSubText!: Phaser.GameObjects.Text;
  private desktopNavButtons: Phaser.GameObjects.Text[] = [];
  private mobileNavButtons: Phaser.GameObjects.Text[] = [];
  private overlayInventoryButtons: Phaser.GameObjects.Text[] = [];
  private optionButtons: Phaser.GameObjects.Text[] = [];
  private traitBars: Record<TraitKey, TraitBarVisual> | null = null;
  private pettitState: PettitViewModel | null = null;
  private latestTraitFeedback: ResolveVoteResponse['traitFeedback'] | null = null;
  private hallDetail: HallOfMemoriesDetailView | null = null;
  private hallArchivePage = 0;
  private hallOverlayVisible = false;
  private activeOverlayView: OverlayView | null = null;
  private selectedOverlayGiftId: string | null = null;
  private creatureSnapshotTextureKey: string | null = null;
  private creatureSnapshotSignature: string | null = null;
  private creatureSnapshotLoadVersion = 0;
  private readonly handleScaleResize = (gameSize: Phaser.Structs.Size): void => {
    this.updateLayout(gameSize.width, gameSize.height);
  };

  constructor() {
    super('Game');
  }

  create(): void {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x0b1218);

    this.background = this.add.image(512, 384, 'background').setAlpha(0.12);

    this.rootPanel = this.add
      .rectangle(0, 0, 100, 100, 0x10171f, 0.98)
      .setOrigin(0)
      .setStrokeStyle(2, 0x263846, 0.48);
    this.mobileRootSkin = this.add.image(0, 0, 'ui-panel-grey').setOrigin(0).setDepth(-3).setVisible(false);

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
      fontSize: '16px',
      color: '#b8c7d3',
    });
    this.navRailPanel = this.createPanel(0x111821, 0x263846);
    this.mobileNavRailPanel = this.createPanel(0x111821, 0x263846);
    this.mobileNavSkin = this.add.image(0, 0, 'ui-panel-grey').setOrigin(0).setDepth(-2).setVisible(false);
    this.navBrandText = this.add.text(0, 0, 'PETTIT', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#fff2cf',
    });
    this.navBrandSubText = this.add.text(0, 0, 'Community Creature', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#d7e7f0',
    });

    this.creaturePanel = this.createPanel(0x17202a, 0x324759);
    this.mobileCreatureSkin = this.add.image(0, 0, 'ui-panel-grey').setOrigin(0).setDepth(-2).setVisible(false);
    this.creatureArtFrame = this.createPanel(0x223243, 0x48657b);
    this.creatureSnapshot = this.add.image(0, 0, 'background').setVisible(false).setDepth(4);
    this.creatureEarLeft = this.add.ellipse(0, 0, 32, 56, 0xfff1d8, 1).setStrokeStyle(2, 0x4e3a2f, 0.9).setDepth(-0.5);
    this.creatureEarRight = this.add.ellipse(0, 0, 32, 56, 0xfff1d8, 1).setStrokeStyle(2, 0x4e3a2f, 0.9).setDepth(-0.5);
    this.creatureBackAccessoryMain = this.add.rectangle(0, 0, 40, 40, 0x7f5d43, 1).setDepth(-1);
    this.creatureBackAccessoryAccent = this.add.rectangle(0, 0, 20, 20, 0xd2c3ab, 1).setDepth(-1);
    this.creatureShadow = this.add.ellipse(0, 0, 100, 30, 0x091017, 0.45);
    this.creatureBody = this.add.ellipse(0, 0, 160, 190, 0xfff1d8, 1).setStrokeStyle(3, 0x4e3a2f, 0.9);
    this.creatureBelly = this.add.ellipse(0, 0, 88, 78, 0xfff9ee, 0.95).setStrokeStyle(2, 0xe4d7c3, 0.8);
    this.creatureBlushLeft = this.add.ellipse(0, 0, 22, 14, 0xffb58f, 0.85);
    this.creatureBlushRight = this.add.ellipse(0, 0, 22, 14, 0xffb58f, 0.85);
    this.creatureEyeLeft = this.add.ellipse(0, 0, 12, 18, 0x1a2026, 1);
    this.creatureEyeRight = this.add.ellipse(0, 0, 12, 18, 0x1a2026, 1);
    this.creatureAccentPatch = this.add.ellipse(0, 0, 18, 14, 0xffd47e, 0.92);
    this.creatureAccentBand = this.add.rectangle(0, 0, 40, 12, 0xffd47e, 0.9);
    this.creatureSpark = this.add.ellipse(0, 0, 20, 20, 0xff8f3f, 1).setStrokeStyle(2, 0x5d3421, 0.85);
    this.creatureMouth = this.add.arc(0, 0, 18, 160, 20, false).setStrokeStyle(3, 0x1a2026, 1);
    this.creatureWearableTop = this.add.rectangle(0, 0, 40, 24, 0x8b6fd4, 1).setDepth(1);
    this.creatureWearableBrim = this.add.rectangle(0, 0, 56, 10, 0x6a4fa8, 1).setDepth(1);
    this.creatureWearableAccent = this.add.ellipse(0, 0, 12, 12, 0xffd67a, 1).setDepth(1);
    this.creatureFrontAccessoryMain = this.add.rectangle(0, 0, 40, 16, 0xa84d53, 1).setDepth(1);
    this.creatureFrontAccessoryAccent = this.add.ellipse(0, 0, 14, 14, 0xf6d07a, 1).setDepth(1);
    this.creatureHeldAccessoryMain = this.add.rectangle(0, 0, 18, 24, 0xe7c17c, 1).setDepth(1);
    this.creatureHeldAccessoryAccent = this.add.ellipse(0, 0, 12, 12, 0x7bd3f0, 1).setDepth(1);
    this.creatureHeldAccessoryStem = this.add.rectangle(0, 0, 8, 36, 0x8a6b52, 1).setDepth(1);
    this.hideLegacyCreatureShapes();
    this.creatureCaptionText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#fff1d2',
      align: 'left',
    });
    this.moodBadgeText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#13202a',
      backgroundColor: '#ffd67a',
      padding: { x: 10, y: 5 },
      align: 'center',
    });
    this.futureSlotText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#d1dfeb',
      align: 'right',
      wordWrap: { width: 280 },
    });

    this.actionPanel = this.createPanel(0x1a222c, 0x2d3f4d);
    this.mobileActionSkin = this.add.image(0, 0, 'ui-panel-grey').setOrigin(0).setDepth(-2).setVisible(false);
    this.actionTitleText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#ffe7a8',
    });
    this.voteSummaryText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#d8e1e8',
      wordWrap: { width: 500 },
      lineSpacing: 8,
    });

    this.traitPanel = this.createPanel(0x162029, 0x2b3d49);
    this.mobileTraitSkin = this.add.image(0, 0, 'ui-panel-grey-inlay').setOrigin(0).setDepth(-2).setVisible(false);
    this.traitPanelTitle = this.add.text(0, 0, 'Traits', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#fff2cf',
    });

    this.topActionPanel = this.createPanel(0x1a222b, 0x2b3d49);
    this.topActionTitle = this.add.text(0, 0, 'Community Progress', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#fff2cf',
    });
    this.topActionBody = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#d7e7f0',
      wordWrap: { width: 240 },
      lineSpacing: 8,
    });

    this.seasonalPanel = this.createPanel(0x1a222b, 0x2b3d49);
    this.seasonalTitleText = this.add.text(0, 0, 'Seasonal', {
      fontFamily: 'Georgia',
      fontSize: '21px',
      color: '#fff2cf',
    });
    this.seasonalBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#d7e7f0',
      wordWrap: { width: 240 },
      lineSpacing: 7,
    });

    this.achievementPanel = this.createPanel(0x1a222b, 0x2b3d49);
    this.achievementTitleText = this.add.text(0, 0, 'Milestones', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#fff2cf',
    });
    this.achievementBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#d7e7f0',
      wordWrap: { width: 240 },
      lineSpacing: 7,
    });

    this.journalPanel = this.createPanel(0x1a212a, 0x334756);
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
    this.resolvePanel = this.createPanel(0x182029, 0x314554);

    this.memoryPanel = this.createPanel(0x18212a, 0x2b3c48);
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
    this.hallPanel = this.createPanel(0x18212a, 0x2b3c48);
    this.hallTitleText = this.add.text(0, 0, 'Memory Book', {
      fontFamily: 'Georgia',
      fontSize: '21px',
      color: '#f2ead7',
    });
    this.hallBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '13px',
      color: '#d7e7f0',
      wordWrap: { width: 220 },
      lineSpacing: 6,
    });
    this.hallButton = this.add
      .text(0, 0, 'Open memory book', {
        fontFamily: 'Trebuchet MS',
        fontSize: '14px',
        color: '#13202a',
        backgroundColor: '#9ed2c7',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        void this.openHallOverlay();
      })
      .on('pointerover', () => this.hallButton.setStyle({ backgroundColor: '#b8e3da' }))
      .on('pointerout', () => this.hallButton.setStyle({ backgroundColor: '#9ed2c7' }));
    this.namesPanel = this.createPanel(0x18212a, 0x2b3c48);
    this.namesTitleText = this.add.text(0, 0, 'Community Names', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f2ead7',
    });
    this.namesBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#d7e7f0',
      wordWrap: { width: 220 },
      lineSpacing: 7,
    });
    this.inventoryPanel = this.createPanel(0x18212a, 0x2b3c48);
    this.inventoryTitleText = this.add.text(0, 0, 'Keepsakes', {
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
      color: '#f6ddb0',
      align: 'left',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    });
    this.traitFeedbackText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#d7e3ea',
      align: 'left',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    });

    this.resolveButton = this.add
      .text(0, 0, 'Resolve current vote', {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#142028',
        backgroundColor: '#f6c453',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        void this.handleResolve();
      })
      .on('pointerover', () => this.resolveButton.setStyle({ backgroundColor: '#ffd980' }))
      .on('pointerout', () => this.resolveButton.setStyle({ backgroundColor: '#f6c453' }));

    this.hallOverlayBackdrop = this.add
      .rectangle(0, 0, 100, 100, 0x081017, 0.78)
      .setOrigin(0)
      .setDepth(40)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeHallOverlay());
    this.hallOverlayPanel = this.add
      .rectangle(0, 0, 100, 100, 0x111a22, 0.98)
      .setOrigin(0)
      .setStrokeStyle(1, 0x314554, 0.5)
      .setDepth(41);
    this.hallOverlayTitleText = this.add.text(0, 0, 'Memory Book', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#fff1d2',
    }).setDepth(42);
    this.hallOverlayCloseButton = this.add
      .text(0, 0, 'Close', {
        fontFamily: 'Trebuchet MS',
        fontSize: '15px',
        color: '#13202a',
        backgroundColor: '#f6c453',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(1, 0)
      .setDepth(42)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeHallOverlay());
    this.hallOverlayHighlightedTitleText = this.add.text(0, 0, 'Cherished Pages', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#ffe7a8',
    }).setDepth(42);
    this.hallOverlayHighlightedBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#d7e7f0',
      wordWrap: { width: 520 },
      lineSpacing: 7,
    }).setDepth(42);
    this.hallOverlayArchiveTitleText = this.add.text(0, 0, 'Earlier Pages', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#dff3ea',
    }).setDepth(42);
    this.hallOverlayArchiveBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#d7e7f0',
      wordWrap: { width: 520 },
      lineSpacing: 6,
    }).setDepth(42);
    this.hallOverlayPageText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '13px',
      color: '#a9bac7',
    }).setDepth(42);
    this.hallOverlayPrevButton = this.add
      .text(0, 0, 'Previous', {
        fontFamily: 'Trebuchet MS',
        fontSize: '14px',
        color: '#13202a',
        backgroundColor: '#91b2d9',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0, 0)
      .setDepth(42)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeHallArchivePage(-1));
    this.hallOverlayNextButton = this.add
      .text(0, 0, 'Next', {
        fontFamily: 'Trebuchet MS',
        fontSize: '14px',
        color: '#13202a',
        backgroundColor: '#91b2d9',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(1, 0)
      .setDepth(42)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeHallArchivePage(1));

    const desktopNavConfig: Array<{ label: string; view: OverlayView; color: string }> = [
      { label: 'Journal', view: 'journal', color: '#8d6a3f' },
      { label: 'Inventory', view: 'inventory', color: '#7c5b39' },
      { label: 'Stats', view: 'stats', color: '#4b6a9d' },
    ];
    desktopNavConfig.forEach(({ label, view, color }) => {
      const button = this.add
        .text(0, 0, label, {
          fontFamily: 'Trebuchet MS',
          fontSize: '16px',
          color: '#f7f3e8',
          backgroundColor: color,
          padding: { x: 16, y: 12 },
        })
        .setOrigin(0, 0)
        .setDepth(5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          void this.openOverlay(view);
        });
      this.desktopNavButtons.push(button);
    });

    const mobileNavConfig: Array<{ label: string; view: OverlayView; color: string }> = [
      { label: 'Journal', view: 'journal', color: '#8d6a3f' },
      { label: 'Inventory', view: 'inventory', color: '#7c5b39' },
      { label: 'Stats', view: 'stats', color: '#4b6a9d' },
    ];
    mobileNavConfig.forEach(({ label, view, color }) => {
      const button = this.add
        .text(0, 0, label, {
          fontFamily: 'Trebuchet MS',
          fontSize: '15px',
          color: '#f7f3e8',
          backgroundColor: color,
          padding: { x: 14, y: 10 },
          align: 'center',
        })
        .setOrigin(0, 0)
        .setDepth(5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          void this.openOverlay(view);
        });
      this.mobileNavButtons.push(button);
    });

    for (let index = 0; index < 8; index += 1) {
      const itemButton = this.add
        .text(0, 0, '', {
          fontFamily: 'Trebuchet MS',
          fontSize: '14px',
          color: '#f7f3e8',
          backgroundColor: '#1e2832',
          padding: { x: 10, y: 10 },
          align: 'center',
        })
        .setOrigin(0, 0)
        .setDepth(42)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          const giftId = itemButton.getData('giftId') as string | undefined;
          if (giftId) {
            this.selectedOverlayGiftId = giftId;
            this.renderHallOverlayContent();
            this.updateLayout(this.scale.width, this.scale.height);
          }
        });
      this.overlayInventoryButtons.push(itemButton);
    }
    this.setHallOverlayVisible(false);

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
      .rectangle(0, 0, 100, 100, fillColor, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, strokeColor, 0.42);
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

  private setObjectVisibility(
    objects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible>,
    visible: boolean
  ): void {
    objects.forEach((object) => {
      object.setVisible(visible);
      if ('disableInteractive' in object && typeof object.disableInteractive === 'function' && !visible) {
        object.disableInteractive();
      }
    });
  }

  private setMainLayoutVisibility(mode: LayoutMode): void {
    const baseVisibleObjects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible> = [
      this.creaturePanel,
      this.creatureArtFrame,
      this.creatureSnapshot,
      this.creatureCaptionText,
      this.moodBadgeText,
      this.futureSlotText,
      this.actionPanel,
      this.actionTitleText,
      this.voteSummaryText,
      this.traitPanel,
      this.traitPanelTitle,
    ];
    this.setObjectVisibility(baseVisibleObjects, true);
    this.setObjectVisibility(this.optionButtons, true);

    const desktopOnly: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible> = [
      this.topActionPanel,
      this.topActionTitle,
      this.topActionBody,
      this.memoryPanel,
      this.memoryTitleText,
      this.memoryBodyText,
    ];
    const alwaysOverlayOnly: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible> = [
      this.seasonalPanel,
      this.seasonalTitleText,
      this.seasonalBodyText,
      this.achievementPanel,
      this.achievementTitleText,
      this.achievementBodyText,
      this.journalPanel,
      this.journalTitleText,
      this.journalBodyText,
      this.hallPanel,
      this.hallTitleText,
      this.hallBodyText,
      this.hallButton,
      this.namesPanel,
      this.namesTitleText,
      this.namesBodyText,
      this.inventoryPanel,
      this.inventoryTitleText,
      this.inventoryBodyText,
      this.resolvePanel,
      this.statusText,
      this.traitFeedbackText,
      this.resolveButton,
    ];

    this.setObjectVisibility(desktopOnly, mode === 'desktop');
    this.setObjectVisibility(alwaysOverlayOnly, false);

    if (this.traitBars) {
      Object.values(this.traitBars).forEach((bar) => {
        this.setObjectVisibility([bar.label, bar.track, bar.fill, bar.value], true);
      });
    }
  }

  private handleViewportRefresh(): void {
    if (this.pettitState) {
      this.renderState();
      return;
    }

    this.updateLayout(this.scale.width, this.scale.height);
  }

  private getLayoutMetrics(width: number, height: number): LayoutMetrics {
    const mode: LayoutMode = width >= 620 && height >= 430 ? 'desktop' : 'mobile';
    const scaleFactor =
      mode === 'desktop'
        ? clamp(Math.min(width / 1280, height / 900), 0.72, 1)
        : clamp(Math.min(width / 430, height / 820), 0.92, 1);
    const padding = Math.round((mode === 'desktop' ? 24 : 12) * scaleFactor);
    const gap = Math.round((mode === 'desktop' ? 22 : 16) * scaleFactor);
    const frameWidth = Math.min(width - padding * 2, mode === 'desktop' ? 1320 : 860);
    const frameHeight =
      mode === 'desktop'
        ? Math.min(height - padding * 2, 900)
        : Math.min(height - Math.max(8, Math.round(padding * 0.6)), 980);
    const frameLeft = (width - frameWidth) / 2;
    const frameTop = mode === 'desktop' ? (height - frameHeight) / 2 : Math.max(6, Math.round(padding * 0.45));
    const contentTop = frameTop + (mode === 'desktop' ? 98 : 70) * scaleFactor;
    const contentBottom = frameTop + frameHeight - padding;
    const leftColumnWidth = mode === 'desktop' ? Math.round(frameWidth * 0.54) : frameWidth - padding * 2;
    const rightColumnWidth =
      mode === 'desktop'
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
      titleGap: Math.round(10 * scaleFactor),
      cardInsetX: Math.round(18 * scaleFactor),
      cardInsetY: Math.round(18 * scaleFactor),
      buttonGap: Math.round(14 * scaleFactor),
      actionButtonHeight: Math.round((mode === 'desktop' ? 58 : 42) * scaleFactor),
      scaleFactor,
      contentTop,
      contentBottom,
      leftColumnWidth,
      rightColumnWidth,
    };
  }

  private updateTextStyles(metrics: LayoutMetrics): void {
    const compact = metrics.mode === 'desktop' ? 1 : 0.9;
    const scale = metrics.scaleFactor * compact;
    const useReflowDesktop = this.shouldUseReflowDesktopLayout(metrics);

    this.titleText.setFontSize(Math.round((metrics.mode === 'desktop' ? 38 : 24) * scale));
    this.subtitleText.setFontSize(Math.round((metrics.mode === 'desktop' ? 15 : 12) * scale));
    this.summaryText.setFontSize(Math.round((metrics.mode === 'desktop' ? 16 : 11) * scale));
    this.navBrandText.setFontSize(Math.round(26 * scale));
    this.navBrandSubText.setFontSize(Math.round((metrics.mode === 'desktop' ? 12 : 13) * scale));
    this.creatureCaptionText.setFontSize(Math.round((metrics.mode === 'desktop' ? 30 : 18) * scale));
    this.moodBadgeText.setFontSize(Math.round((metrics.mode === 'desktop' ? 13 : 11) * scale));
    this.futureSlotText.setFontSize(Math.round((useReflowDesktop ? 14 : 13) * scale));
    this.actionTitleText.setFontSize(Math.round((metrics.mode === 'desktop' ? 27 : 20) * scale));
    this.voteSummaryText.setFontSize(Math.round((metrics.mode === 'desktop' ? 18 : 13) * scale));
    this.traitPanelTitle.setFontSize(Math.round(21 * scale));
    this.topActionTitle.setFontSize(Math.round(18 * scale));
    this.topActionBody.setFontSize(Math.round((useReflowDesktop ? 14 : 13) * scale));
    this.seasonalTitleText.setFontSize(Math.round(18 * scale));
    this.seasonalBodyText.setFontSize(Math.round(13 * scale));
    this.achievementTitleText.setFontSize(Math.round(18 * scale));
    this.achievementBodyText.setFontSize(Math.round(13 * scale));
    this.journalTitleText.setFontSize(Math.round(27 * scale));
    this.journalBodyText.setFontSize(Math.round(17 * scale));
    this.memoryTitleText.setFontSize(Math.round(21 * scale));
    this.memoryBodyText.setFontSize(Math.round(14 * scale));
    this.hallTitleText.setFontSize(Math.round(18 * scale));
    this.hallBodyText.setFontSize(Math.round(12 * scale));
    this.hallButton.setFontSize(Math.round(13 * scale));
    this.namesTitleText.setFontSize(Math.round(19 * scale));
    this.namesBodyText.setFontSize(Math.round(13 * scale));
    this.inventoryTitleText.setFontSize(Math.round(19 * scale));
    this.inventoryBodyText.setFontSize(Math.round(13 * scale));
    this.statusText.setFontSize(Math.round((metrics.mode === 'desktop' ? 14 : 12) * scale));
    this.traitFeedbackText.setFontSize(Math.round((metrics.mode === 'desktop' ? 13 : 11) * scale));
    this.resolveButton.setFontSize(Math.round((metrics.mode === 'desktop' ? 17 : 14) * scale));
    this.hallOverlayTitleText.setFontSize(Math.round(26 * scale));
    this.hallOverlayCloseButton.setFontSize(Math.round(14 * scale));
    this.hallOverlayHighlightedTitleText.setFontSize(Math.round(18 * scale));
    this.hallOverlayHighlightedBodyText.setFontSize(Math.round(14 * scale));
    this.hallOverlayArchiveTitleText.setFontSize(Math.round(18 * scale));
    this.hallOverlayArchiveBodyText.setFontSize(Math.round(13 * scale));
    this.hallOverlayPageText.setFontSize(Math.round(13 * scale));
    this.hallOverlayPrevButton.setFontSize(Math.round(13 * scale));
    this.hallOverlayNextButton.setFontSize(Math.round(13 * scale));
    this.desktopNavButtons.forEach((button) => button.setFontSize(Math.round(15 * scale)));
    this.mobileNavButtons.forEach((button) => button.setFontSize(Math.round(12 * scale)));
    this.overlayInventoryButtons.forEach((button) => button.setFontSize(Math.round(13 * scale)));

    this.optionButtons.forEach((button) => {
      button.setFontSize(Math.round((metrics.mode === 'desktop' ? 18 : 14) * scale));
    });

    if (this.traitBars) {
      Object.values(this.traitBars).forEach((bar) => {
        bar.label.setFontSize(Math.round((metrics.mode === 'desktop' ? 15 : 12) * scale));
        bar.value.setFontSize(Math.round((metrics.mode === 'desktop' ? 13 : 11) * scale));
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
    this.layoutHallOverlay(metrics);
  }

  private layoutDashboard(metrics: LayoutMetrics): void {
    this.rootPanel.setPosition(metrics.frameLeft, metrics.frameTop);
    this.rootPanel.setSize(metrics.frameWidth, metrics.frameHeight);
    this.mobileRootSkin.setVisible(false);
    this.mobileCreatureSkin.setVisible(false);
    this.mobileActionSkin.setVisible(false);
    this.mobileTraitSkin.setVisible(false);
    this.mobileNavSkin.setVisible(false);
    if (metrics.mode === 'desktop') {
      this.rootPanel.setAlpha(1);
      this.creaturePanel.setAlpha(1);
      this.actionPanel.setAlpha(1);
      this.traitPanel.setAlpha(1);
      this.mobileNavRailPanel.setAlpha(1);
      this.rootPanel.setFillStyle(0x10171f, 0.96).setStrokeStyle(1, 0x263846, 0.42);
      this.navRailPanel.setFillStyle(0x111821, 0.96).setStrokeStyle(1, 0x263846, 0.42);
      this.mobileNavRailPanel.setFillStyle(0x111821, 0.96).setStrokeStyle(1, 0x263846, 0.42);
      this.creaturePanel.setFillStyle(0x17202a, 0.96).setStrokeStyle(1, 0x324759, 0.42);
      this.creatureArtFrame.setFillStyle(0x223243, 0.96).setStrokeStyle(1, 0x48657b, 0.42);
      this.actionPanel.setFillStyle(0x1a222c, 0.96).setStrokeStyle(1, 0x2d3f4d, 0.42);
      this.traitPanel.setFillStyle(0x162029, 0.96).setStrokeStyle(1, 0x2b3d49, 0.42);
      this.topActionPanel.setFillStyle(0x1a222b, 0.96).setStrokeStyle(1, 0x2b3d49, 0.42);
      this.memoryPanel.setFillStyle(0x18212a, 0.96).setStrokeStyle(1, 0x2b3c48, 0.42);
      this.titleText.setColor('#f6ecd1');
      this.summaryText.setColor('#cfd9e3');
      this.subtitleText.setColor('#f0e4ff');
    } else {
      this.rootPanel.setAlpha(0.1);
      this.creaturePanel.setAlpha(0.12);
      this.actionPanel.setAlpha(0.12);
      this.traitPanel.setAlpha(0.08);
      this.mobileNavRailPanel.setAlpha(0.08);
      this.mobileRootSkin.setPosition(metrics.frameLeft, metrics.frameTop).setDisplaySize(metrics.frameWidth, metrics.frameHeight);
      this.rootPanel.setFillStyle(0x0d1017, 0.985).setStrokeStyle(2, 0x45364e, 0.74);
      this.navRailPanel.setFillStyle(0x111821, 0.96).setStrokeStyle(1, 0x263846, 0.42);
      this.mobileNavRailPanel.setFillStyle(0x131118, 0.99).setStrokeStyle(2, 0x504657, 0.78);
      this.creaturePanel.setFillStyle(0x18141b, 0.985).setStrokeStyle(2, 0x4b3958, 0.7);
      this.creatureArtFrame.setFillStyle(0x6b92bf, 0.99).setStrokeStyle(2, 0x775783, 0.8);
      this.actionPanel.setFillStyle(0x1b1820, 0.985).setStrokeStyle(2, 0x493a4f, 0.64);
      this.traitPanel.setFillStyle(0x17161b, 0.985).setStrokeStyle(1, 0x463c49, 0.64);
      this.topActionPanel.setFillStyle(0x17161b, 0.985).setStrokeStyle(1, 0x463c49, 0.64);
      this.memoryPanel.setFillStyle(0x17161b, 0.985).setStrokeStyle(1, 0x463c49, 0.64);
      this.titleText.setColor('#f6ecd1');
      this.summaryText.setColor('#d7d0c3');
      this.subtitleText.setColor('#f0e4ff');
    }
    this.setMainLayoutVisibility(metrics.mode);

    const railWidth =
      metrics.mode === 'desktop'
        ? metrics.frameWidth < 980
          ? clamp(Math.round(metrics.frameWidth * 0.11), 108, 128)
          : clamp(Math.round(metrics.frameWidth * 0.14), 160, 200)
        : 0;
    const headerLeft = metrics.frameLeft + metrics.padding + railWidth + (metrics.mode === 'desktop' ? metrics.gap : 0);
    const headerTop = metrics.frameTop + metrics.padding;

    this.titleText.setPosition(headerLeft, headerTop);
    if (metrics.mode === 'desktop') {
      this.subtitleText.setVisible(true);
      this.subtitleText.setPosition(headerLeft + this.titleText.width + metrics.titleGap, headerTop + 7);
      this.summaryText.setPosition(headerLeft, headerTop + this.titleText.height + 10);
    } else {
      this.subtitleText.setVisible(false);
      this.summaryText.setWordWrapWidth(
        Math.max(140, metrics.frameWidth - metrics.padding * 2 - this.moodBadgeText.width - metrics.gap - 6)
      );
      this.summaryText.setPosition(headerLeft, headerTop + this.titleText.height + 6);
      this.moodBadgeText.setPosition(
        metrics.frameLeft + metrics.frameWidth - metrics.padding - this.moodBadgeText.width,
        headerTop + 8
      );
    }

    this.layoutNavigation(metrics, railWidth);
    const contentStartY = Math.max(metrics.contentTop, this.summaryText.y + this.summaryText.height + metrics.gap);

    if (metrics.mode === 'desktop') {
      this.layoutDesktopDashboard(metrics, railWidth, contentStartY);
    } else {
      this.layoutMobileDashboard(metrics);
    }
  }

  private layoutNavigation(metrics: LayoutMetrics, railWidth: number): void {
    const desktopVisible = metrics.mode === 'desktop';
    this.navRailPanel.setVisible(desktopVisible).setAlpha(desktopVisible ? 1 : 0);
    this.mobileNavRailPanel.setVisible(!desktopVisible).setAlpha(!desktopVisible ? 1 : 0);
    this.navBrandText.setVisible(desktopVisible).setAlpha(desktopVisible ? 1 : 0);
    this.navBrandSubText.setVisible(desktopVisible).setAlpha(desktopVisible ? 1 : 0);
    this.desktopNavButtons.forEach((button) => {
      button.setVisible(desktopVisible);
      button.setAlpha(desktopVisible ? 1 : 0);
      if (desktopVisible && !button.input?.enabled) {
        button.setInteractive({ useHandCursor: true });
      } else if (!desktopVisible) {
        button.disableInteractive();
      }
    });
    this.mobileNavButtons.forEach((button) => {
      button.setVisible(!desktopVisible);
      button.setAlpha(!desktopVisible ? 1 : 0);
      if (!desktopVisible && !button.input?.enabled) {
        button.setInteractive({ useHandCursor: true });
      } else if (desktopVisible) {
        button.disableInteractive();
      }
    });

    if (desktopVisible) {
      const railX = metrics.frameLeft + metrics.padding;
      const railY = metrics.contentTop - 38;
      const railHeight = metrics.contentBottom - railY;
      this.navRailPanel.setPosition(railX, railY);
      this.navRailPanel.setSize(railWidth, railHeight);
      this.navBrandText.setPosition(railX + 18, railY + 22);
      this.navBrandSubText.setWordWrapWidth(railWidth - 32);
      this.navBrandSubText.setPosition(railX + 16, railY + railHeight - this.navBrandSubText.height - 18);
      this.desktopNavButtons.forEach((button, index) => {
        button.setPosition(railX + 16, railY + 92 + index * (button.height + 12));
        button.setFixedSize(railWidth - 32, button.height);
        button.setAlign('center');
      });
      this.mobileNavRailPanel.setPosition(-2000, -2000);
      return;
    }

    const railX = metrics.frameLeft + metrics.padding;
    const railY = metrics.frameTop + metrics.frameHeight - metrics.padding - 64;
    const railWidthMobile = metrics.frameWidth - metrics.padding * 2;
    const railHeight = 64;
    const innerPadding = 10;
    const buttonWidth = Math.floor((railWidthMobile - innerPadding * 2 - metrics.gap * 2) / 3);
    const buttonY = railY + 11;
    this.mobileNavRailPanel.setPosition(railX, railY);
    this.mobileNavRailPanel.setSize(railWidthMobile, railHeight);
    this.mobileNavButtons.forEach((button, index) => {
      const color = index === 2 ? '#586f97' : '#8c6b43';
      button.setStyle({
        backgroundColor: color,
        color: '#f7efda',
      });
      button.setPosition(railX + innerPadding + index * (buttonWidth + metrics.gap), buttonY);
      button.setFixedSize(buttonWidth, 42);
      button.setAlign('center');
    });
    this.navRailPanel.setPosition(-2000, -2000);
  }

  private shouldUseReflowDesktopLayout(metrics: LayoutMetrics): boolean {
    return metrics.mode === 'desktop' && metrics.frameWidth < 1180;
  }

  private shouldUseSingleRowActionButtons(metrics: LayoutMetrics, panelWidth: number): boolean {
    return metrics.mode === 'desktop' && !this.shouldUseReflowDesktopLayout(metrics) && panelWidth >= 720;
  }

  private layoutDesktopDashboard(metrics: LayoutMetrics, railWidth: number, contentStartY: number): void {
    const compactDesktop = metrics.frameWidth < 980;
    const resolvedRailWidth = compactDesktop ? clamp(Math.round(metrics.frameWidth * 0.11), 108, 128) : railWidth;
    const usableWidth = metrics.frameWidth - metrics.padding * 2 - resolvedRailWidth - metrics.gap;
    const leftX = metrics.frameLeft + metrics.padding + resolvedRailWidth + metrics.gap;
    const top = contentStartY;
    const topAreaHeight = metrics.contentBottom - top;

    if (this.shouldUseReflowDesktopLayout(metrics)) {
      const topRowHeight = clamp(Math.round(topAreaHeight * 0.26), 154, 194);
      const summaryHeight = clamp(Math.round(topAreaHeight * 0.05), 34, 40);
      const heroWidth = clamp(Math.round(usableWidth * 0.64), 400, usableWidth - 280);
      const traitWidth = usableWidth - heroWidth - metrics.gap;
      const actionHeight = topAreaHeight - topRowHeight - summaryHeight - metrics.gap * 2;
      const creatureFrame: PanelFrame = {
        x: leftX,
        y: top,
        width: heroWidth,
        height: topRowHeight,
      };
      const traitFrame: PanelFrame = {
        x: leftX + heroWidth + metrics.gap,
        y: top,
        width: traitWidth,
        height: topRowHeight,
      };
      const actionFrame: PanelFrame = {
        x: leftX,
        y: top + topRowHeight + metrics.gap,
        width: usableWidth,
        height: actionHeight,
      };
      const topActionFrame: PanelFrame = {
        x: leftX,
        y: actionFrame.y + actionFrame.height + metrics.gap,
        width: usableWidth,
        height: summaryHeight,
      };

      this.layoutCreaturePanel(metrics, creatureFrame);
      this.layoutTraitPanel(metrics, traitFrame);
      this.layoutActionPanel(metrics, actionFrame);
      this.layoutResolveArea(metrics, {
        x: leftX,
        y: actionFrame.y + actionFrame.height,
        width: usableWidth,
        height: 0,
      });
      this.layoutTopActionPanel(metrics, topActionFrame);

      this.traitPanel.setVisible(true);
      this.traitPanelTitle.setVisible(true);
      this.topActionPanel.setVisible(true);
      this.topActionTitle.setVisible(false);
      this.topActionBody.setVisible(true);
      this.memoryPanel.setVisible(false);
      this.memoryTitleText.setVisible(false);
      this.memoryBodyText.setVisible(false);
      return;
    }

    const mainWidth = compactDesktop ? usableWidth : Math.round(usableWidth * 0.6);
    const rightWidth = compactDesktop ? 0 : usableWidth - mainWidth - metrics.gap;
    const rightX = leftX + mainWidth + metrics.gap;
    const creatureHeight = clamp(Math.round(topAreaHeight * (compactDesktop ? 0.23 : 0.31)), compactDesktop ? 126 : 170, compactDesktop ? 176 : 254);
    const measuredActionHeight = this.measureActionPanelHeight(metrics, mainWidth);
    const actionHeight = compactDesktop
      ? clamp(Math.max(measuredActionHeight, Math.round(topAreaHeight * 0.3)), 216, 306)
      : Math.max(measuredActionHeight, topAreaHeight - creatureHeight - metrics.gap);

    const creatureFrame: PanelFrame = { x: leftX, y: top, width: mainWidth, height: creatureHeight };
    const actionFrame: PanelFrame = {
      x: leftX,
      y: creatureFrame.y + creatureFrame.height + metrics.gap,
      width: mainWidth,
      height: actionHeight,
    };
    const resolveFrame: PanelFrame = {
      x: leftX,
      y: actionFrame.y + actionFrame.height,
      width: mainWidth,
      height: 0,
    };

    this.layoutCreaturePanel(metrics, creatureFrame);
    this.layoutActionPanel(metrics, actionFrame);
    this.layoutResolveArea(metrics, resolveFrame);

    if (compactDesktop) {
      const summaryTop = actionFrame.y + actionFrame.height + metrics.gap;
      const summaryWidth = Math.floor((mainWidth - metrics.gap) / 2);
      const summaryHeight = Math.max(metrics.contentBottom - summaryTop, 96);
      const traitFrame: PanelFrame = {
        x: leftX,
        y: summaryTop,
        width: summaryWidth,
        height: summaryHeight,
      };
      const topActionFrame: PanelFrame = {
        x: leftX + summaryWidth + metrics.gap,
        y: summaryTop,
        width: mainWidth - summaryWidth - metrics.gap,
        height: summaryHeight,
      };

      this.traitPanel.setVisible(true);
      this.traitPanelTitle.setVisible(true);
      this.topActionPanel.setVisible(true);
      this.topActionTitle.setVisible(true);
      this.topActionBody.setVisible(true);
      this.memoryPanel.setVisible(false);
      this.memoryTitleText.setVisible(false);
      this.memoryBodyText.setVisible(false);
      this.layoutTraitPanel(metrics, traitFrame);
      this.layoutTopActionPanel(metrics, topActionFrame);
      return;
    }

    const traitHeight = clamp(Math.round(topAreaHeight * 0.31), 150, 214);
    const topActionHeight = clamp(Math.round(topAreaHeight * 0.24), 124, 176);
    const memoryHeight = Math.max(topAreaHeight - traitHeight - topActionHeight - metrics.gap * 2, 120);
    const traitFrame: PanelFrame = { x: rightX, y: top, width: rightWidth, height: traitHeight };
    const topActionFrame: PanelFrame = {
      x: rightX,
      y: traitFrame.y + traitFrame.height + metrics.gap,
      width: rightWidth,
      height: topActionHeight,
    };
    const memoryFrame: PanelFrame = {
      x: rightX,
      y: topActionFrame.y + topActionFrame.height + metrics.gap,
      width: rightWidth,
      height: memoryHeight,
    };

    this.traitPanel.setVisible(true);
    this.traitPanelTitle.setVisible(true);
    this.topActionPanel.setVisible(true);
    this.topActionTitle.setVisible(true);
    this.topActionBody.setVisible(true);
    this.memoryPanel.setVisible(true);
    this.memoryTitleText.setVisible(true);
    this.memoryBodyText.setVisible(true);
    this.layoutTraitPanel(metrics, traitFrame);
    this.layoutTopActionPanel(metrics, topActionFrame);
    this.layoutMemoryPanel(metrics, memoryFrame);
  }

  private layoutMobileDashboard(metrics: LayoutMetrics): void {
    const mobileInset = Math.max(10, metrics.padding - 10);
    const contentX = metrics.frameLeft + mobileInset;
    const contentWidth = metrics.frameWidth - mobileInset * 2;
    const frameBottom = metrics.frameTop + metrics.frameHeight - mobileInset;
    const mobileContentTop = this.summaryText.y + this.summaryText.height + metrics.gap;
    const gap = Math.max(6, metrics.gap - 6);
    const availableHeight = frameBottom - mobileContentTop;
    const traitWidth = clamp(Math.round(contentWidth * 0.4), 118, 152);
    const heroWidth = contentWidth - traitWidth - gap;
    let topRowHeight = 122;
    let traitHeight = topRowHeight;
    const measuredActionHeight = this.measureActionPanelHeight(metrics, contentWidth);
    let actionHeight = measuredActionHeight;

    let requiredHeight = topRowHeight + actionHeight + 64 + gap;
    if (requiredHeight > availableHeight) {
      topRowHeight = 104;
      traitHeight = topRowHeight;
      requiredHeight = topRowHeight + actionHeight + 60 + gap;
    }

    if (requiredHeight > availableHeight) {
      topRowHeight = 96;
      traitHeight = topRowHeight;
      actionHeight = availableHeight - topRowHeight - 58 - gap;
    }

    actionHeight = clamp(actionHeight, 160, Math.max(160, availableHeight - topRowHeight - 58 - gap));

    const creatureFrame: PanelFrame = {
      x: contentX,
      y: mobileContentTop,
      width: heroWidth,
      height: topRowHeight,
    };
    const traitFrame: PanelFrame = {
      x: contentX + heroWidth + gap,
      y: mobileContentTop,
      width: traitWidth,
      height: traitHeight,
    };
    const actionFrame: PanelFrame = {
      x: contentX,
      y: mobileContentTop + topRowHeight + gap,
      width: contentWidth,
      height: actionHeight,
    };

    this.layoutCreaturePanel(metrics, creatureFrame);
    this.layoutTraitPanel(metrics, traitFrame);
    this.layoutActionPanel(metrics, actionFrame);
    this.layoutResolveArea(metrics, {
      x: contentX,
      y: actionFrame.y + actionFrame.height,
      width: contentWidth,
      height: 0,
    });

    const railY = actionFrame.y + actionFrame.height;
    const railHeight = Math.max(54, frameBottom - railY);
    const innerPadding = 8;
    const buttonWidth = Math.floor((contentWidth - innerPadding * 2 - gap * 2) / 3);
    const buttonY = railY + Math.max(6, Math.floor((railHeight - 42) / 2));
    this.mobileNavSkin.setPosition(contentX, railY).setDisplaySize(contentWidth, railHeight);
    this.mobileNavRailPanel.setPosition(contentX, railY);
    this.mobileNavRailPanel.setSize(contentWidth, railHeight);
    this.mobileNavButtons.forEach((button, index) => {
      button.setPosition(contentX + innerPadding + index * (buttonWidth + gap), buttonY);
      button.setFixedSize(buttonWidth, 42);
    });
  }

  private measureActionPanelHeight(metrics: LayoutMetrics, panelWidth: number): number {
    const innerWidth = panelWidth - metrics.cardInsetX * 2;
    this.actionTitleText.setWordWrapWidth(innerWidth);
    this.voteSummaryText.setWordWrapWidth(innerWidth);
    const useSingleRow = this.shouldUseSingleRowActionButtons(metrics, panelWidth);
    const columns = useSingleRow ? Math.max(this.optionButtons.length, 1) : Math.min(2, Math.max(this.optionButtons.length, 1));
    const buttonRows = Math.ceil(Math.max(this.optionButtons.length, 1) / columns);
    const buttonHeight = buttonRows * metrics.actionButtonHeight + (buttonRows - 1) * metrics.buttonGap;
    return Math.ceil(
      metrics.cardInsetY * 2 +
        this.actionTitleText.height +
        20 +
        this.voteSummaryText.height +
        24 +
        buttonHeight +
        14
    );
  }

  private layoutCreaturePanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    if (metrics.mode === 'mobile') {
      this.mobileCreatureSkin.setPosition(frame.x, frame.y).setDisplaySize(frame.width, frame.height);
    }
    this.creaturePanel.setPosition(frame.x, frame.y);
    this.creaturePanel.setSize(frame.width, frame.height);

    const insetX = metrics.mode === 'desktop' ? metrics.cardInsetX : 14;
    const insetY = metrics.mode === 'desktop' ? metrics.cardInsetY : 14;
    const innerX = frame.x + insetX;
    const innerY = frame.y + insetY;
    const innerWidth = frame.width - insetX * 2;
    const artHeight = frame.height - insetY * 2;
    const dna = this.pettitState?.pettit.appearanceDna ?? this.getFallbackAppearanceDna();
    const traits = this.pettitState?.pettit.traits ?? {
      curiosity: 50,
      chaos: 50,
      trust: 50,
      courage: 50,
    };
    const palette = this.getCreaturePalette(dna.paletteKey);
    const curiosityWeight = traits.curiosity / 100;
    const trustWeight = traits.trust / 100;
    const courageWeight = traits.courage / 100;
    const chaosWeight = traits.chaos / 100;
    const useReflowDesktop = this.shouldUseReflowDesktopLayout(metrics);

    this.creatureArtFrame.setPosition(innerX, innerY);
    this.creatureArtFrame.setSize(innerWidth, artHeight);
    const creatureCenterX =
      innerX +
      innerWidth * (useReflowDesktop ? 0.5 : metrics.mode === 'desktop' ? 0.48 : 0.5) +
      (chaosWeight - 0.5) * 8;
    const creatureCenterY =
      innerY + artHeight * ((useReflowDesktop ? 0.58 : metrics.mode === 'desktop' ? 0.6 : 0.52) - courageWeight * 0.04);
    const bodyWidth = Math.min(innerWidth * (metrics.mode === 'desktop' ? 0.26 : 0.34), artHeight * (metrics.mode === 'desktop' ? 0.72 : 0.82)) * (dna.bodyWidthScale + trustWeight * 0.08);
    const bodyHeight = Math.min(artHeight * (metrics.mode === 'desktop' ? 0.7 : 0.8), bodyWidth * 1.12) * (dna.bodyHeightScale + courageWeight * 0.06);
    const eyeOffsetX = bodyWidth * 0.16 * dna.eyeSpacing * (1 + curiosityWeight * 0.08);
    const eyeY = creatureCenterY - bodyHeight * (0.12 + curiosityWeight * 0.03);
    const blushOffsetX = bodyWidth * 0.22;
    const blushY = creatureCenterY + bodyHeight * 0.04;
    const mood = this.pettitState?.pettit.mood ?? 'curious';
    const earWidth = bodyWidth * (dna.earStyle === 'leaf' ? 0.16 : 0.18);
    const earHeight = bodyHeight * (dna.earStyle === 'round' ? 0.24 : dna.earStyle === 'leaf' ? 0.34 : 0.28);
    const earRotation = dna.earStyle === 'leaf' ? 0.28 : dna.earStyle === 'tilt' ? 0.45 : 0.12;

    this.creatureEarLeft.setFillStyle(palette.body, 1).setStrokeStyle(2, palette.outline, 0.9);
    this.creatureEarRight.setFillStyle(palette.body, 1).setStrokeStyle(2, palette.outline, 0.9);
    this.creatureEarLeft.setPosition(creatureCenterX - bodyWidth * 0.24, creatureCenterY - bodyHeight * 0.42);
    this.creatureEarRight.setPosition(
      creatureCenterX + bodyWidth * (0.24 + chaosWeight * 0.03),
      creatureCenterY - bodyHeight * 0.42
    );
    this.creatureEarLeft.setSize(earWidth, earHeight).setRotation(-earRotation);
    this.creatureEarRight.setSize(earWidth * (1 + chaosWeight * 0.08), earHeight).setRotation(earRotation);
    this.creatureShadow.setPosition(creatureCenterX, creatureCenterY + bodyHeight * 0.34);
    this.creatureShadow.setSize(bodyWidth * 0.78, bodyHeight * 0.18);
    this.creatureBody.setFillStyle(palette.body, 1).setStrokeStyle(3, palette.outline, 0.9);
    this.creatureBody.setPosition(creatureCenterX, creatureCenterY);
    this.creatureBody.setSize(bodyWidth, bodyHeight);
    this.creatureBelly.setFillStyle(palette.belly, 0.95).setStrokeStyle(2, palette.bellyOutline, 0.8);
    this.creatureBelly.setPosition(creatureCenterX, creatureCenterY + bodyHeight * 0.16);
    this.creatureBelly.setSize(bodyWidth * (0.52 + trustWeight * 0.06), bodyHeight * 0.4);
    this.creatureEyeLeft.setPosition(creatureCenterX - eyeOffsetX, eyeY);
    this.creatureEyeRight.setPosition(creatureCenterX + eyeOffsetX + chaosWeight * 3, eyeY - chaosWeight * 2);
    this.creatureBlushLeft.setPosition(creatureCenterX - blushOffsetX, blushY);
    this.creatureBlushRight.setPosition(creatureCenterX + blushOffsetX, blushY);
    this.creatureBlushLeft.setFillStyle(palette.blush, 0.85);
    this.creatureBlushRight.setFillStyle(palette.blush, 0.85);
    this.creatureSpark.setPosition(creatureCenterX + bodyWidth * 0.16, creatureCenterY - bodyHeight * 0.52);
    this.creatureSpark.setSize(
      bodyWidth * (dna.sparkStyle === 'leaf' ? 0.1 : 0.12),
      bodyWidth * (dna.sparkStyle === 'star' ? 0.12 : 0.14)
    );
    this.creatureSpark.setFillStyle(palette.accent, 1).setStrokeStyle(2, palette.outline, 0.65);
    this.layoutCreatureFace(mood, dna, creatureCenterX, creatureCenterY, bodyWidth, bodyHeight);
    this.layoutCreaturePattern(dna, creatureCenterX, creatureCenterY, bodyWidth, bodyHeight, palette.accent, chaosWeight);
    this.layoutCreatureAccessories(creatureCenterX, creatureCenterY, bodyWidth, bodyHeight);
    const compactDesktop = metrics.mode === 'desktop' && frame.width < 620;
    const portraitSize = Math.min(
      innerWidth * (useReflowDesktop ? 0.7 : metrics.mode === 'desktop' ? (compactDesktop ? 0.36 : 0.46) : 0.64),
      artHeight * (useReflowDesktop ? 1.12 : metrics.mode === 'desktop' ? (compactDesktop ? 0.78 : 0.92) : 1.04)
    );
    this.creatureSnapshot.setPosition(creatureCenterX, creatureCenterY - bodyHeight * 0.02);
    this.creatureSnapshot.setDisplaySize(portraitSize, portraitSize);

    this.creatureCaptionText.setPosition(innerX + 18, innerY + 14);
    this.creatureCaptionText.setWordWrapWidth(
      innerWidth * (metrics.mode === 'desktop' ? (compactDesktop ? 0.34 : 0.44) : 0.5)
    );
    if (metrics.mode === 'desktop') {
      this.moodBadgeText.setPosition(innerX + innerWidth - this.moodBadgeText.width - 18, innerY + 14);
    }
    if (useReflowDesktop) {
      this.futureSlotText.setWordWrapWidth(Math.max(170, innerWidth * 0.34));
      this.futureSlotText.setPosition(creatureCenterX, innerY + artHeight * 0.8);
      this.futureSlotText.setOrigin(0.5, 0.5);
      this.creatureCaptionText.setVisible(false);
      this.futureSlotText.setVisible(this.futureSlotText.text.trim().length > 0);
    } else {
      this.futureSlotText.setWordWrapWidth(
        Math.max(metrics.mode === 'desktop' ? 180 : 128, innerWidth * (metrics.mode === 'desktop' ? 0.28 : 0.24))
      );
      this.futureSlotText.setPosition(innerX + innerWidth - 18, this.moodBadgeText.y + this.moodBadgeText.height + 10);
      this.futureSlotText.setOrigin(1, 0);
      this.creatureCaptionText.setVisible(false);
      this.futureSlotText.setVisible(false);
    }
  }

  private layoutCreatureFace(
    mood: PettitViewModel['pettit']['mood'],
    dna: PettitAppearanceDna,
    centerX: number,
    centerY: number,
    bodyWidth: number,
    bodyHeight: number
  ): void {
    const mouthY = centerY + bodyHeight * 0.08;
    const eyeWidth =
      dna.eyeStyle === 'dot' ? bodyWidth * 0.055 : dna.eyeStyle === 'sleepy' ? bodyWidth * 0.078 : bodyWidth * 0.065;
    const eyeHeight =
      dna.eyeStyle === 'sleepy'
        ? bodyHeight * 0.075
        : dna.eyeStyle === 'dot'
          ? bodyHeight * 0.09
          : bodyHeight * 0.1;

    this.creatureEyeLeft.setSize(eyeWidth, eyeHeight);
    this.creatureEyeRight.setSize(eyeWidth, eyeHeight);
    this.creatureMouth.setPosition(centerX, mouthY);
    this.creatureMouth.setRadius(bodyWidth * 0.12);
    this.creatureMouth.setRotation(0);
    this.creatureBlushLeft.setVisible(dna.blushStyle !== 'none');
    this.creatureBlushRight.setVisible(dna.blushStyle !== 'none');

    if (dna.blushStyle === 'soft') {
      this.creatureBlushLeft.setSize(bodyWidth * 0.16, bodyHeight * 0.07);
      this.creatureBlushRight.setSize(bodyWidth * 0.16, bodyHeight * 0.07);
    } else {
      this.creatureBlushLeft.setSize(bodyWidth * 0.14, bodyHeight * 0.08);
      this.creatureBlushRight.setSize(bodyWidth * 0.14, bodyHeight * 0.08);
    }

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
    if (metrics.mode === 'mobile') {
      this.mobileActionSkin.setPosition(frame.x, frame.y).setDisplaySize(frame.width, frame.height);
    }
    this.actionPanel.setPosition(frame.x, frame.y);
    this.actionPanel.setSize(frame.width, frame.height);

    const mobileInsetX = metrics.mode === 'desktop' ? metrics.cardInsetX : metrics.cardInsetX + 2;
    const mobileInsetY = metrics.mode === 'desktop' ? metrics.cardInsetY : metrics.cardInsetY + 2;
    const innerX = frame.x + mobileInsetX;
    const innerY = frame.y + mobileInsetY;
    const innerWidth = frame.width - mobileInsetX * 2;
    const buttonCount = Math.max(this.optionButtons.length, 1);
    const useSingleRow = this.shouldUseSingleRowActionButtons(metrics, frame.width);
    const columns = useSingleRow ? buttonCount : Math.min(2, buttonCount);
    const buttonGap = metrics.mode === 'desktop' ? metrics.buttonGap : Math.max(10, metrics.buttonGap - 2);

    this.actionTitleText.setPosition(innerX, innerY + 4);
    this.actionTitleText.setWordWrapWidth(innerWidth);
    this.voteSummaryText.setPosition(innerX, innerY + this.actionTitleText.height + (metrics.mode === 'desktop' ? 20 : 14));
    this.voteSummaryText.setWordWrapWidth(innerWidth);

    const buttonTop = this.voteSummaryText.y + this.voteSummaryText.height + (metrics.mode === 'desktop' ? 24 : 18);
    const buttonWidth = Math.floor((innerWidth - buttonGap * (columns - 1)) / columns);

    this.optionButtons.forEach((button, index) => {
      const column = useSingleRow ? index : index % columns;
      const row = useSingleRow ? 0 : Math.floor(index / columns);
      const buttonX = innerX + column * (buttonWidth + buttonGap);
      const buttonY = buttonTop + row * (metrics.actionButtonHeight + buttonGap);
      button.setPosition(buttonX, buttonY);
      button.setFixedSize(buttonWidth, metrics.actionButtonHeight);
      button.setWordWrapWidth(button.width - 16);
    });
  }

  private layoutTraitPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    if (metrics.mode === 'mobile') {
      this.mobileTraitSkin.setPosition(frame.x, frame.y).setDisplaySize(frame.width, frame.height);
    }
    this.traitPanel.setPosition(frame.x, frame.y);
    this.traitPanel.setSize(frame.width, frame.height);
    this.traitPanelTitle.setVisible(metrics.mode === 'desktop');
    this.traitPanelTitle.setPosition(frame.x + metrics.cardInsetX, frame.y + metrics.cardInsetY);

    if (!this.traitBars || !this.pettitState) {
      return;
    }

    const barKeys: TraitKey[] = ['curiosity', 'chaos', 'trust', 'courage'];
    const useStackedTraitBars = metrics.mode === 'mobile' || this.shouldUseReflowDesktopLayout(metrics);

    if (useStackedTraitBars) {
      const innerX = frame.x + metrics.cardInsetX;
      const innerWidth = frame.width - metrics.cardInsetX * 2;
      const valueWidth = metrics.mode === 'mobile' ? 28 : 34;
      const trackHeight = metrics.mode === 'mobile' ? 7 : 8;
      const labelToBarGap = metrics.mode === 'mobile' ? 4 : 3;
      const groupGap = metrics.mode === 'mobile' ? 6 : 4;
      const startY =
        metrics.mode === 'mobile'
          ? frame.y + metrics.cardInsetY
          : this.traitPanelTitle.y + this.traitPanelTitle.height + 6;

      barKeys.forEach((traitKey, index) => {
        const bar = this.traitBars?.[traitKey];
        if (!bar) {
          return;
        }

        const value = this.pettitState?.pettit.traits[traitKey] ?? 0;
        const rowTop = startY + index * (bar.label.height + trackHeight + labelToBarGap + groupGap);
        const fillWidth = Math.max(18, Math.round((innerWidth * value) / 100));

        bar.label.setPosition(innerX, rowTop - 2);
        bar.value.setPosition(innerX + innerWidth - valueWidth, rowTop - 2);
        bar.track.setPosition(innerX, rowTop + bar.label.height + labelToBarGap);
        bar.track.setSize(innerWidth, trackHeight);
        bar.fill.setPosition(innerX, rowTop + bar.label.height + labelToBarGap);
        bar.fill.setSize(fillWidth, trackHeight);
      });

      return;
    }

    const labelWidth = clamp(Math.round(frame.width * 0.24), 52, 100);
    const valueWidth = 34;
    const barTrackWidth = frame.width - metrics.cardInsetX * 2 - labelWidth - valueWidth - 14;
    const startY = this.traitPanelTitle.y + this.traitPanelTitle.height + 16;
    const rowGap = clamp(Math.round(frame.height * 0.16), 26, 34);
    const trackHeight = 10;

    barKeys.forEach((traitKey, index) => {
      const bar = this.traitBars?.[traitKey];
      if (!bar) {
        return;
      }

      const rowY = startY + index * rowGap;
      bar.label.setPosition(frame.x + metrics.cardInsetX, rowY - 10);
      bar.track.setPosition(frame.x + metrics.cardInsetX + labelWidth, rowY);
      bar.track.setSize(barTrackWidth, trackHeight);
      bar.value.setPosition(frame.x + frame.width - metrics.cardInsetX - valueWidth, rowY - 12);

      const value = this.pettitState?.pettit.traits[traitKey] ?? 0;
      const fillWidth = Math.max(18, Math.round((barTrackWidth * value) / 100));
      bar.fill.setPosition(bar.track.x, rowY);
      bar.fill.setSize(fillWidth, trackHeight);
    });
  }

  private layoutTopActionPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.topActionPanel.setPosition(frame.x, frame.y);
    this.topActionPanel.setSize(frame.width, frame.height);
    const useReflowDesktop = this.shouldUseReflowDesktopLayout(metrics);
    this.topActionTitle.setVisible(!useReflowDesktop);
    if (!useReflowDesktop) {
      this.topActionTitle.setPosition(frame.x + metrics.cardInsetX, frame.y + metrics.cardInsetY);
      this.topActionBody.setPosition(frame.x + metrics.cardInsetX, this.topActionTitle.y + this.topActionTitle.height + 6);
      this.topActionBody.setWordWrapWidth(frame.width - metrics.cardInsetX * 2);
      return;
    }

    this.topActionBody.setWordWrapWidth(frame.width - metrics.cardInsetX * 2);
    this.topActionBody.setPosition(
      frame.x + metrics.cardInsetX,
      frame.y + Math.max(12, Math.floor((frame.height - this.topActionBody.height) / 2))
    );
  }

  private layoutMemoryPanel(metrics: LayoutMetrics, frame: PanelFrame): void {
    this.memoryPanel.setPosition(frame.x, frame.y);
    this.memoryPanel.setSize(frame.width, frame.height);

    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const innerWidth = frame.width - metrics.cardInsetX * 2;

    this.memoryTitleText.setPosition(innerX, innerY);
    this.memoryBodyText.setPosition(innerX, innerY + this.memoryTitleText.height + 10);
    this.memoryBodyText.setWordWrapWidth(innerWidth);
  }

  private layoutResolveArea(metrics: LayoutMetrics, frame: PanelFrame): void {
    if (frame.height <= 1) {
      this.resolvePanel.setVisible(false);
      this.statusText.setVisible(false);
      this.traitFeedbackText.setVisible(false);
      this.resolveButton.setVisible(false);
      this.resolveButton.disableInteractive();
      return;
    }

    const canResolveCurrentEncounter = this.pettitState?.viewer.canResolveCurrentEncounter ?? false;
    this.resolvePanel.setVisible(true);
    this.statusText.setVisible(true);
    this.traitFeedbackText.setVisible(true);
    this.resolveButton.setVisible(canResolveCurrentEncounter);
    if (canResolveCurrentEncounter) {
      this.resolveButton.setInteractive({ useHandCursor: true });
    } else {
      this.resolveButton.disableInteractive();
    }
    this.resolvePanel.setPosition(frame.x, frame.y);
    this.resolvePanel.setSize(frame.width, frame.height);

    const statusWidth = frame.width - metrics.cardInsetX * 2;
    const innerX = frame.x + metrics.cardInsetX;
    const innerY = frame.y + metrics.cardInsetY;
    const buttonWidth =
      metrics.mode === 'desktop'
        ? Math.max(220, Math.min(frame.width - metrics.cardInsetX * 2, 320))
        : Math.max(180, Math.min(frame.width - metrics.cardInsetX * 2, 260));

    this.statusText.setWordWrapWidth(statusWidth);
    this.statusText.setPosition(innerX, innerY);
    this.traitFeedbackText.setWordWrapWidth(statusWidth);
    this.traitFeedbackText.setPosition(innerX, this.statusText.y + this.statusText.height + (metrics.mode === 'desktop' ? 10 : 6));
    if (canResolveCurrentEncounter) {
      this.resolveButton.setPosition(
        frame.x + (frame.width - buttonWidth) / 2,
        Math.max(
          this.traitFeedbackText.y + this.traitFeedbackText.height + (metrics.mode === 'desktop' ? 20 : 14),
          frame.y + frame.height - this.resolveButton.height - metrics.cardInsetY
        )
      );
      this.resolveButton.setFixedSize(buttonWidth, this.resolveButton.height);
      this.resolveButton.setAlign('center');
    }
  }

  private layoutHallOverlay(metrics: LayoutMetrics): void {
    this.hallOverlayBackdrop.setPosition(0, 0);
    this.hallOverlayBackdrop.setSize(metrics.width, metrics.height);

    const panelWidth = Math.min(metrics.width - metrics.padding * 2, metrics.mode === 'desktop' ? 920 : 760);
    const panelHeight = Math.min(metrics.height - metrics.padding * 2, metrics.mode === 'desktop' ? 760 : 820);
    const panelX = (metrics.width - panelWidth) / 2;
    const panelY = (metrics.height - panelHeight) / 2;
    const innerX = panelX + metrics.cardInsetX;
    const innerY = panelY + metrics.cardInsetY;
    const innerWidth = panelWidth - metrics.cardInsetX * 2;

    this.hallOverlayPanel.setPosition(panelX, panelY);
    this.hallOverlayPanel.setSize(panelWidth, panelHeight);
    this.hallOverlayTitleText.setPosition(innerX, innerY);
    this.hallOverlayCloseButton.setPosition(panelX + panelWidth - metrics.cardInsetX, innerY);
    this.hallOverlayHighlightedTitleText.setPosition(innerX, innerY + this.hallOverlayTitleText.height + 18);
    this.hallOverlayHighlightedBodyText.setPosition(
      innerX,
      this.hallOverlayHighlightedTitleText.y + this.hallOverlayHighlightedTitleText.height + 10
    );
    this.hallOverlayHighlightedBodyText.setWordWrapWidth(innerWidth);
    this.hallOverlayArchiveTitleText.setPosition(
      innerX,
      this.hallOverlayHighlightedBodyText.y + this.hallOverlayHighlightedBodyText.height + 22
    );
    this.hallOverlayArchiveBodyText.setPosition(
      innerX,
      this.hallOverlayArchiveTitleText.y + this.hallOverlayArchiveTitleText.height + 10
    );
    this.hallOverlayArchiveBodyText.setWordWrapWidth(innerWidth);

    if (this.activeOverlayView === 'inventory') {
      const columns = metrics.mode === 'desktop' ? 4 : 2;
      const buttonWidth = Math.floor((innerWidth - metrics.gap * (columns - 1)) / columns);
      const buttonHeight = 52;
      const buttonTop = this.hallOverlayArchiveBodyText.y + this.hallOverlayArchiveBodyText.height + 18;
      this.overlayInventoryButtons.forEach((button, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        button.setPosition(innerX + column * (buttonWidth + metrics.gap), buttonTop + row * (buttonHeight + 12));
        button.setFixedSize(buttonWidth, buttonHeight);
        button.setAlign('center');
      });
      this.hallOverlayPageText.setPosition(innerX, panelY + panelHeight - this.hallOverlayPageText.height - metrics.cardInsetY);
      this.hallOverlayPrevButton.setPosition(innerX, this.hallOverlayPageText.y - this.hallOverlayPrevButton.height - 10);
      this.hallOverlayNextButton.setPosition(panelX + panelWidth - metrics.cardInsetX, this.hallOverlayPrevButton.y);
      return;
    }

    this.hallOverlayPageText.setPosition(
      innerX,
      panelY + panelHeight - this.hallOverlayPageText.height - metrics.cardInsetY
    );
    this.hallOverlayPrevButton.setPosition(innerX, this.hallOverlayPageText.y - this.hallOverlayPrevButton.height - 10);
    this.hallOverlayNextButton.setPosition(
      panelX + panelWidth - metrics.cardInsetX,
      this.hallOverlayPrevButton.y
    );
  }

  private async loadState(): Promise<void> {
    try {
      const response = await fetchPettitState();
      this.pettitState = response.state;
      this.latestTraitFeedback = null;
      this.hallDetail = null;
      this.hallArchivePage = 0;
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
    const options = this.pettitState?.activeEncounter.options ?? [];

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
          const currentOptionId = createdButton.getData(Game.optionIdDataKey) as string | undefined;
          const activeEncounter = this.pettitState?.activeEncounter;

          if (!currentOptionId || !activeEncounter || activeEncounter.hasVoted) {
            return;
          }

          if (activeEncounter.selectedOptionId !== currentOptionId) {
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

  private hideLegacyCreatureShapes(): void {
    [
      this.creatureEarLeft,
      this.creatureEarRight,
      this.creatureBackAccessoryMain,
      this.creatureBackAccessoryAccent,
      this.creatureShadow,
      this.creatureBody,
      this.creatureBelly,
      this.creatureBlushLeft,
      this.creatureBlushRight,
      this.creatureEyeLeft,
      this.creatureEyeRight,
      this.creatureAccentPatch,
      this.creatureAccentBand,
      this.creatureSpark,
      this.creatureMouth,
      this.creatureWearableTop,
      this.creatureWearableBrim,
      this.creatureWearableAccent,
      this.creatureFrontAccessoryMain,
      this.creatureFrontAccessoryAccent,
      this.creatureHeldAccessoryMain,
      this.creatureHeldAccessoryAccent,
      this.creatureHeldAccessoryStem,
    ].forEach((shape) => shape.setAlpha(0));
  }

  private refreshCreatureSnapshot(): void {
    if (!this.pettitState) {
      return;
    }

    const signature = getPettitPortraitSignature(this.pettitState);
    if (signature === this.creatureSnapshotSignature) {
      return;
    }

    this.creatureSnapshotSignature = signature;
    const dataUrl = buildPettitPortraitDataUrl(this.pettitState);
    const loadVersion = ++this.creatureSnapshotLoadVersion;
    const nextTextureKey = `pettit-portrait-${loadVersion}`;
    const portraitImage = new Image();

    portraitImage.onload = () => {
      if (loadVersion !== this.creatureSnapshotLoadVersion) {
        return;
      }

      if (this.creatureSnapshotTextureKey && this.textures.exists(this.creatureSnapshotTextureKey)) {
        this.textures.remove(this.creatureSnapshotTextureKey);
      }

      this.textures.addImage(nextTextureKey, portraitImage);
      this.creatureSnapshotTextureKey = nextTextureKey;
      this.creatureSnapshot.setTexture(nextTextureKey).setVisible(true);
      this.updateLayout(this.scale.width, this.scale.height);
    };

    portraitImage.src = dataUrl;
  }

  private renderState(): void {
    if (!this.pettitState) {
      return;
    }

    const metrics = this.getLayoutMetrics(this.scale.width, this.scale.height);
    const useReflowDesktop = this.shouldUseReflowDesktopLayout(metrics);
    const { pettit, activeEncounter, recentMemories } = this.pettitState;
    this.titleText.setText('Pettit Together');
    this.subtitleText.setText('Community Creature • Raised by the community');
    this.navBrandSubText.setText(
      'Use the Reddit app menu to suggest names for Pettit and community gifts.\n\nVoting runs on a 24-hour cycle.'
    );
    this.summaryText.setText(
      `Day ${pettit.ageDays} - ${pettit.birthdaySummary} - Mood: ${this.capitalize(pettit.mood)} - Top traits: ${pettit.topTraits
        .map((trait) => this.formatTraitName(trait))
        .join(' + ')}`
    );

    this.creatureCaptionText.setText(pettit.name);
    this.moodBadgeText.setText(this.formatMoodBadge(pettit.mood));
    this.applyMoodBadgeStyle(pettit.mood);
    this.futureSlotText.setText(
      metrics.mode === 'desktop'
        ? ''
        : pettit.canReceiveCommunityName
          ? `Raised by the community.\n${pettit.birthdaySummary}.\nUse the subreddit menu to submit name ideas for Pettit.`
          : `Raised by the community.\n${pettit.birthdaySummary}.`
    );

    this.actionTitleText.setText(activeEncounter.title);
    const compactVoteSummary =
      `Votes: ${activeEncounter.totalVotes}${activeEncounter.hasVoted ? " - Your vote is in today's story." : ' - Choose what Pettit does next.'}`;
    this.voteSummaryText.setText(
      this.scale.width < 620
        ? `${activeEncounter.description}\n\n${compactVoteSummary}`
        : `${activeEncounter.description}\n\nVotes so far: ${activeEncounter.totalVotes}${activeEncounter.hasVoted ? " - Your choice is part of today's story." : ' - Choose what Pettit does next.'}`
    );

    this.topActionTitle.setText('Today & Community');
    this.topActionBody.setText(this.buildTopActionSummary(useReflowDesktop));

    this.applySeasonalAccent(this.pettitState.seasonal.activeEvent?.accentColor ?? null);

    this.renderTraitBars();
    this.renderOptionButtons();
    this.renderTraitFeedback();
    this.refreshCreatureSnapshot();

    if (recentMemories.length > 0) {
      this.memoryBodyText.setText(
        recentMemories
          .map((memory) => this.formatMemoryPreview(memory.title))
          .join('\n')
      );
    } else {
      this.memoryBodyText.setText(`No memories yet. The first resolved encounter will give ${pettit.name} a first page worth keeping.`);
    }

    this.renderHallOverlayContent();
    this.updateLayout(this.scale.width, this.scale.height);
  }

  private buildTopActionSummary(useReflowDesktop: boolean): string {
    if (!this.pettitState) {
      return '';
    }

    const { activeEncounter, communityStats, communityContributions, pendingNamingTargets, pettit } =
      this.pettitState;

    if (useReflowDesktop) {
      const summaryBits = [
        `Votes today: ${activeEncounter.totalVotes}`,
        `Stories: ${communityStats.encountersCompleted}`,
        `Memories: ${communityStats.memoriesCreated}`,
        `Day: ${pettit.ageDays}`,
      ];

      if (communityContributions.pendingGiftBallot?.isReady) {
        summaryBits.push('Gift vote ready');
      } else if (pendingNamingTargets.length > 0) {
        summaryBits.push(`Names waiting: ${pendingNamingTargets.length}`);
      }

      return summaryBits.join('  |  ');
    }

    return [
      `${this.formatCount(activeEncounter.totalVotes)} votes on today's encounter`,
      `${this.formatCount(communityStats.encountersCompleted)} shared stories so far`,
      `${this.formatCount(communityStats.memoriesCreated)} keepsakes and memories held`,
      communityContributions.pendingGiftBallot
        ? communityContributions.pendingGiftBallot.isReady
          ? 'A community gift vote is ready.'
          : `${communityContributions.pendingGiftBallot.submissionCount}/3 gift ideas are waiting.`
        : 'No community gift ballot yet.',
      pendingNamingTargets.length > 0
        ? `${this.formatCount(pendingNamingTargets.length)} naming stories are waiting.`
        : 'No naming stories are waiting yet.',
    ].join('\n');
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

    this.pettitState.activeEncounter.options.forEach((option, index) => {
      const button = this.optionButtons[index];

      if (!button) {
        return;
      }

      button.setData(Game.optionIdDataKey, option.id);
      button.setData(Game.optionBaseColorDataKey, palette[index] ?? '#53647a');
      button.setText(option.label);
      button.setStyle({
        backgroundColor: (button.getData(Game.optionBaseColorDataKey) as string | undefined) ?? '#53647a',
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

  private setHallOverlayVisible(visible: boolean): void {
    this.hallOverlayVisible = visible;
    const objects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible> = [
      this.hallOverlayBackdrop,
      this.hallOverlayPanel,
      this.hallOverlayTitleText,
      this.hallOverlayCloseButton,
      this.hallOverlayHighlightedTitleText,
      this.hallOverlayHighlightedBodyText,
      this.hallOverlayArchiveTitleText,
      this.hallOverlayArchiveBodyText,
      this.hallOverlayPageText,
      this.hallOverlayPrevButton,
      this.hallOverlayNextButton,
    ];

    objects.forEach((object) => {
      object.setVisible(visible);
    });
    this.overlayInventoryButtons.forEach((button) => button.setVisible(visible && this.activeOverlayView === 'inventory'));
  }

  private async openHallOverlay(): Promise<void> {
    await this.openOverlay('journal');
  }

  private async openOverlay(view: OverlayView): Promise<void> {
    this.activeOverlayView = view;
    this.setHallOverlayVisible(true);
    this.renderHallOverlayContent();
    this.updateLayout(this.scale.width, this.scale.height);

    if (view !== 'journal' || this.hallDetail) {
      return;
    }

    try {
      const response = await fetchPettitMemories();
      this.hallDetail = response.hallOfMemories;
      this.hallArchivePage = 0;
    } catch (error) {
      console.error('Failed to load Hall of Memories:', error);
      this.hallDetail = {
        highlighted: [],
        archive: [],
        highlightedCount: 0,
      };
      this.hallOverlayArchiveBodyText.setText(
        error instanceof Error ? error.message : 'Unable to load Hall of Memories.'
      );
    }

    this.renderHallOverlayContent();
    this.updateLayout(this.scale.width, this.scale.height);
  }

  private closeHallOverlay(): void {
    this.activeOverlayView = null;
    this.setHallOverlayVisible(false);
  }

  private changeHallArchivePage(delta: number): void {
    if (!this.hallDetail) {
      return;
    }

    const pageCount = this.getHallArchivePageCount(this.hallDetail);
    this.hallArchivePage = clamp(this.hallArchivePage + delta, 0, pageCount - 1);
    this.renderHallOverlayContent();
    this.updateLayout(this.scale.width, this.scale.height);
  }

  private getHallArchivePageCount(hall: HallOfMemoriesDetailView): number {
    return Math.max(1, Math.ceil(hall.archive.length / 12));
  }

  private setHallOverlayPagingControls(options: {
    showPageText: boolean;
    pageText?: string;
    showPrevious: boolean;
    showNext: boolean;
  }): void {
    this.hallOverlayPageText.setVisible(options.showPageText);
    this.hallOverlayPageText.setText(options.pageText ?? '');

    this.hallOverlayPrevButton.setVisible(options.showPrevious);
    if (options.showPrevious) {
      this.hallOverlayPrevButton.setInteractive({ useHandCursor: true }).setAlpha(1);
    } else {
      this.hallOverlayPrevButton.disableInteractive().setAlpha(0.45);
    }

    this.hallOverlayNextButton.setVisible(options.showNext);
    if (options.showNext) {
      this.hallOverlayNextButton.setInteractive({ useHandCursor: true }).setAlpha(1);
    } else {
      this.hallOverlayNextButton.disableInteractive().setAlpha(0.45);
    }
  }

  private renderHallOverlayContent(): void {
    if (!this.hallOverlayVisible) {
      return;
    }

    if (this.activeOverlayView === 'inventory') {
      this.renderInventoryOverlayContent();
      return;
    }

    if (this.activeOverlayView === 'stats') {
      this.renderStatsOverlayContent();
      return;
    }

    if (!this.hallDetail) {
      this.hallOverlayTitleText.setText('Journal & Memory Book');
      this.hallOverlayHighlightedTitleText.setText('Latest Journal');
      this.hallOverlayArchiveTitleText.setText('Memory Book');
      this.hallOverlayHighlightedBodyText.setText('Loading today’s journal...');
      this.hallOverlayArchiveBodyText.setText('Loading the rest of the memory book...');
      this.setHallOverlayPagingControls({
        showPageText: false,
        showPrevious: false,
        showNext: false,
      });
      return;
    }

    const archiveStart = this.hallArchivePage * 12;
    const archivePage = this.hallDetail.archive.slice(archiveStart, archiveStart + 12);
    const pageCount = this.getHallArchivePageCount(this.hallDetail);
    const latestJournal = this.pettitState?.latestJournal;
    const journalTitle = latestJournal ? `Journal - ${latestJournal.title}` : 'Journal';
    const journalBody = latestJournal
      ? this.truncateJournalPreview(latestJournal.content)
      : `Resolve the first community choice to open ${this.pettitState?.pettit.name ?? 'Pettit'}'s journal.`;
    const milestones = this.pettitState?.recentAchievements.length
      ? this.pettitState.recentAchievements
          .slice(0, 3)
          .map((achievement) => `- ${achievement.title}`)
          .join('\n')
      : 'No new milestones yet.';

    this.hallOverlayTitleText.setText('Journal & Memory Book');
    this.hallOverlayHighlightedTitleText.setText(journalTitle);
    this.hallOverlayHighlightedBodyText.setText(
      `${journalBody}\n\nMilestones:\n${milestones}`
    );
    this.hallOverlayArchiveTitleText.setText('Memory Book');
    this.hallOverlayArchiveBodyText.setText(
      archivePage.length > 0
        ? archivePage.map((memory) => this.formatHallDetailLine(memory, 52)).join('\n')
        : 'No earlier pages yet.'
    );
    this.setHallOverlayPagingControls({
      showPageText: pageCount > 1,
      pageText: `Volume ${this.hallArchivePage + 1} of ${pageCount}`,
      showPrevious: this.hallArchivePage > 0,
      showNext: this.hallArchivePage < pageCount - 1,
    });
  }

  private renderInventoryOverlayContent(): void {
    const inventory = this.pettitState?.inventory ?? [];
    const selected =
      inventory.find((item) => item.id === this.selectedOverlayGiftId) ??
      [...inventory].slice(-1)[0] ??
      null;

    this.selectedOverlayGiftId = selected?.id ?? null;
    this.hallOverlayTitleText.setText('Keepsakes & Inventory');
    this.hallOverlayHighlightedTitleText.setText(
      selected ? `Selected: ${selected.canonName ?? selected.name}` : 'Keepsakes'
    );
    this.hallOverlayHighlightedBodyText.setText(
      selected
        ? `${selected.source === 'Community Contribution' ? 'Community gift idea' : this.formatGiftCategory(selected.category)}\n${this.getInventoryItemDisplayDescription(selected)}\nUnlocked ${selected.obtainedAt.slice(0, 10)}`
        : `${this.pettitState?.pettit.name ?? 'Pettit'} has not collected any keepsakes yet.`
    );
    this.hallOverlayArchiveTitleText.setText('Collected Keepsakes');
    this.hallOverlayArchiveBodyText.setText(
      inventory.length > 0
        ? 'Choose a keepsake below to see its details.'
        : 'A future gift vote will fill this collection.'
    );
    this.setHallOverlayPagingControls({
      showPageText: false,
      showPrevious: false,
      showNext: false,
    });

    this.overlayInventoryButtons.forEach((button, index) => {
      const item = [...inventory].reverse()[index];
      if (!item) {
        button.setVisible(false);
        return;
      }

      button.setData('giftId', item.id);
      button.setText(this.truncateText(item.canonName ?? item.name, 18));
      button.setStyle({
        backgroundColor: selected?.id === item.id ? '#f6c453' : '#1e2832',
        color: selected?.id === item.id ? '#142028' : '#f7f3e8',
      });
      button.setVisible(true);
    });
  }

  private getInventoryItemDisplayDescription(
    item: PettitViewModel['inventory'][number]
  ): string {
    if (!item.canonName) {
      return item.description;
    }

    const originalName = item.name.trim();
    const renamedName = item.canonName.trim();
    if (!originalName || !renamedName) {
      return item.description;
    }

    if (item.description.toLowerCase().includes(renamedName.toLowerCase())) {
      return item.description;
    }

    const escapedOriginalName = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacedDescription = item.description.replace(
      new RegExp(escapedOriginalName, 'gi'),
      renamedName
    );

    if (replacedDescription !== item.description) {
      return replacedDescription;
    }

    return this.buildRenamedInventoryDescription(item.category, renamedName);
  }

  private buildRenamedInventoryDescription(category: GiftCategory, renamedName: string): string {
    switch (category) {
      case 'clothing':
        return `A tiny ${renamedName} that now feels completely part of Pettit's story.`;
      case 'tools':
        return `A trusty ${renamedName} that helps Pettit explore with a little more confidence.`;
      case 'toys':
        return `A playful ${renamedName} that brings a little extra joy to the day.`;
      case 'books':
        return `A well-loved ${renamedName} that fills Pettit's day with new ideas.`;
      case 'community':
        return `A community keepsake called ${renamedName}, cherished as part of Pettit's story.`;
      case 'funny':
        return `A silly little ${renamedName} that always makes the moment feel brighter.`;
      default:
        return `A keepsake called ${renamedName}, now part of Pettit's growing story.`;
    }
  }

  private renderStatsOverlayContent(): void {
    if (!this.pettitState) {
      return;
    }

    const { pettit, communityStats, seasonal, pendingNamingTargets, communityContributions } = this.pettitState;
    this.hallOverlayTitleText.setText('Stats & Community');
    this.hallOverlayHighlightedTitleText.setText('Pettit’s Traits');
    this.hallOverlayHighlightedBodyText.setText(
      [
        `Curiosity: ${pettit.traits.curiosity}%`,
        `Chaos: ${pettit.traits.chaos}%`,
        `Trust: ${pettit.traits.trust}%`,
        `Courage: ${pettit.traits.courage}%`,
        `Mood: ${this.capitalize(pettit.mood)}`,
      ].join('\n')
    );
    this.hallOverlayArchiveTitleText.setText('Community Snapshot');
    this.hallOverlayArchiveBodyText.setText(
      [
        `${communityStats.totalVotes} votes cast`,
        `${communityStats.encountersCompleted} shared stories`,
        `${communityStats.memoriesCreated} memories kept`,
        seasonal.activeEvent ? `${seasonal.activeEvent.title} is shaping today.` : 'No holiday is shaping today.',
        communityContributions.pendingGiftBallot
          ? communityContributions.pendingGiftBallot.isReady
            ? 'A community gift vote is ready.'
            : `${communityContributions.pendingGiftBallot.submissionCount}/3 gift ideas waiting.`
          : 'No community gift ballot yet.',
        pendingNamingTargets.length > 0
          ? `${pendingNamingTargets.length} naming stories are waiting.`
          : 'No naming stories are waiting right now.',
      ].join('\n')
    );
    this.setHallOverlayPagingControls({
      showPageText: false,
      showPrevious: false,
      showNext: false,
    });
    this.overlayInventoryButtons.forEach((button) => button.setVisible(false));
  }

  private applyOptionState(button: Phaser.GameObjects.Text, optionId: string): void {
    const encounter = this.pettitState?.activeEncounter;

    if (!encounter) {
      return;
    }

    const isSelected = encounter.selectedOptionId === optionId;
    const isLocked = encounter.hasVoted;
    const baseColor = (button.getData(Game.optionBaseColorDataKey) as string | undefined) ?? '#53647a';

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
    if (this.pettitState?.activeEncounter.hasVoted) {
      return;
    }

    try {
      this.statusText.setText('Adding your choice to today’s vote...');
      this.latestTraitFeedback = null;
      this.updateLayout(this.scale.width, this.scale.height);
      const response = await submitPettitVote({ optionId });
      this.pettitState = response.state;
      this.statusText.setText('Your vote is in. Now the community’s story can keep unfolding.');
      this.syncOptionButtons();
      this.renderState();
    } catch (error) {
      console.error('Failed to submit vote:', error);

      if (error instanceof Error && error.message === 'The selected option is no longer valid') {
        this.statusText.setText('That encounter changed just in time. Refreshing Pettit...');
        this.updateLayout(this.scale.width, this.scale.height);
        await this.loadState();
        this.statusText.setText('That encounter moved before your vote landed. Please choose again.');
        this.updateLayout(this.scale.width, this.scale.height);
        return;
      }

      this.statusText.setText(error instanceof Error ? error.message : 'Failed to submit vote.');
      this.updateLayout(this.scale.width, this.scale.height);
    }
  }

  private async handleResolve(): Promise<void> {
    try {
      this.statusText.setText('Turning today’s choice into Pettit’s next story...');
      this.updateLayout(this.scale.width, this.scale.height);
      const response = await resolvePettitVote();
      this.pettitState = response.state;
      this.latestTraitFeedback = response.traitFeedback;
      this.hallDetail = null;
      this.hallArchivePage = 0;
      this.statusText.setText(
        response.unlockedAchievements.length > 0
          ? `New milestone: ${response.unlockedAchievements[0]?.title}.`
          : response.outcome === 'advanced'
          ? 'No votes came in today, so Pettit wandered onward to a fresh encounter.'
          : `Today’s choice became "${this.humanizeOptionId(response.resolution.winningOptionId ?? '')}".`
      );
      this.syncOptionButtons();
      this.renderState();
      if (response.outcome === 'resolved') {
        this.flashPanel(this.resolvePanel, 0xd89a48);
        this.flashPanel(this.topActionPanel, 0x63c19d);
        if (response.unlockedAchievements.length > 0) {
          this.flashPanel(this.rootPanel, 0x8fa95d);
        }
      }
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

  private getFallbackAppearanceDna(): PettitAppearanceDna {
    return {
      seedVersion: 1,
      paletteKey: 'sunrise',
      bodyWidthScale: 1,
      bodyHeightScale: 1,
      earStyle: 'round',
      eyeStyle: 'oval',
      eyeSpacing: 1,
      blushStyle: 'round',
      sparkStyle: 'orb',
      accentPattern: 'plain',
    };
  }

  private getCreaturePalette(paletteKey: PettitAppearanceDna['paletteKey']): {
    body: number;
    belly: number;
    bellyOutline: number;
    outline: number;
    accent: number;
    blush: number;
  } {
    const palettes: Record<PettitAppearanceDna['paletteKey'], { body: number; belly: number; bellyOutline: number; outline: number; accent: number; blush: number }> =
      {
        sunrise: {
          body: 0xfff1d8,
          belly: 0xfff9ee,
          bellyOutline: 0xe4d7c3,
          outline: 0x4e3a2f,
          accent: 0xff9a48,
          blush: 0xffb58f,
        },
        meadow: {
          body: 0xf3f6dc,
          belly: 0xfbfff0,
          bellyOutline: 0xd4dfc5,
          outline: 0x3c4736,
          accent: 0x8fca63,
          blush: 0xf2c5a2,
        },
        berry: {
          body: 0xffe3ef,
          belly: 0xfff2f7,
          bellyOutline: 0xf1ccd8,
          outline: 0x56384a,
          accent: 0xc8678f,
          blush: 0xf7a8bd,
        },
        twilight: {
          body: 0xe8e7ff,
          belly: 0xf5f3ff,
          bellyOutline: 0xd6d1f2,
          outline: 0x3d4161,
          accent: 0x8aa7ff,
          blush: 0xd9b8f2,
        },
        moss: {
          body: 0xe7f0de,
          belly: 0xf5fbef,
          bellyOutline: 0xd0dfc8,
          outline: 0x445443,
          accent: 0x6eb28e,
          blush: 0xe6b89d,
        },
      };

    return palettes[paletteKey] ?? palettes.sunrise;
  }

  private layoutCreaturePattern(
    dna: PettitAppearanceDna,
    centerX: number,
    centerY: number,
    bodyWidth: number,
    bodyHeight: number,
    accentColor: number,
    chaosWeight: number
  ): void {
    this.creatureAccentPatch.setVisible(false);
    this.creatureAccentBand.setVisible(false);

    if (dna.accentPattern === 'patch' || dna.accentPattern === 'speck') {
      this.creatureAccentPatch.setVisible(true);
      this.creatureAccentPatch.setFillStyle(accentColor, dna.accentPattern === 'speck' ? 0.72 : 0.9);
      this.creatureAccentPatch.setPosition(
        centerX + bodyWidth * (dna.accentPattern === 'speck' ? 0.18 : -0.14) + chaosWeight * 4,
        centerY - bodyHeight * (dna.accentPattern === 'speck' ? 0.04 : 0.18)
      );
      this.creatureAccentPatch.setSize(
        bodyWidth * (dna.accentPattern === 'speck' ? 0.08 : 0.18),
        bodyHeight * (dna.accentPattern === 'speck' ? 0.06 : 0.12)
      );
    }

    if (dna.accentPattern === 'band') {
      this.creatureAccentBand.setVisible(true);
      this.creatureAccentBand.setFillStyle(accentColor, 0.72);
      this.creatureAccentBand.setPosition(centerX, centerY - bodyHeight * 0.08);
      this.creatureAccentBand.setSize(bodyWidth * 0.62, bodyHeight * 0.08);
      this.creatureAccentBand.setRotation(-0.08 + chaosWeight * 0.06);
    }
  }

  private layoutCreatureAccessories(centerX: number, centerY: number, bodyWidth: number, bodyHeight: number): void {
    const wearableItem = this.findRecentGift([
      'birthday-hat',
      'wizard-hat',
      'straw-hat',
      'wool-hat',
      'explorer-hat',
      'flower-crown',
      'hand-knitted-scarf',
      'small-backpack',
      'tiny-cape',
    ]);
    const handheldItem = this.findRecentGift([
      'lantern',
      'walking-stick',
      'adventure-book',
      'story-book',
      'star-map',
      'compass',
    ]);

    this.creatureBackAccessoryMain.setVisible(false);
    this.creatureBackAccessoryAccent.setVisible(false);
    this.creatureWearableTop.setVisible(false);
    this.creatureWearableBrim.setVisible(false);
    this.creatureWearableAccent.setVisible(false);
    this.creatureFrontAccessoryMain.setVisible(false);
    this.creatureFrontAccessoryAccent.setVisible(false);
    this.creatureHeldAccessoryMain.setVisible(false);
    this.creatureHeldAccessoryAccent.setVisible(false);
    this.creatureHeldAccessoryStem.setVisible(false);

    if (wearableItem) {
      switch (wearableItem.giftId) {
        case 'small-backpack':
          this.creatureBackAccessoryMain.setVisible(true).setFillStyle(0x7f5d43, 1);
          this.creatureBackAccessoryAccent.setVisible(true).setFillStyle(0xd7c4a3, 1);
          this.creatureBackAccessoryMain.setPosition(centerX + bodyWidth * 0.14, centerY + bodyHeight * 0.06);
          this.creatureBackAccessoryMain.setSize(bodyWidth * 0.32, bodyHeight * 0.34);
          this.creatureBackAccessoryAccent.setPosition(centerX + bodyWidth * 0.26, centerY + bodyHeight * 0.06);
          this.creatureBackAccessoryAccent.setSize(bodyWidth * 0.06, bodyHeight * 0.34);
          break;
        case 'tiny-cape':
          this.creatureBackAccessoryMain.setVisible(true).setFillStyle(0xb24d56, 1);
          this.creatureBackAccessoryAccent.setVisible(true).setFillStyle(0xf6d07a, 1);
          this.creatureBackAccessoryMain.setPosition(centerX, centerY + bodyHeight * 0.12);
          this.creatureBackAccessoryMain.setSize(bodyWidth * 0.56, bodyHeight * 0.42);
          this.creatureBackAccessoryAccent.setPosition(centerX, centerY - bodyHeight * 0.04);
          this.creatureBackAccessoryAccent.setSize(bodyWidth * 0.18, bodyHeight * 0.05);
          break;
        case 'hand-knitted-scarf':
          this.creatureFrontAccessoryMain.setVisible(true).setFillStyle(0xc75d68, 1);
          this.creatureFrontAccessoryAccent.setVisible(true).setFillStyle(0xf0d8a6, 1);
          this.creatureFrontAccessoryMain.setPosition(centerX, centerY + bodyHeight * 0.05);
          this.creatureFrontAccessoryMain.setSize(bodyWidth * 0.44, bodyHeight * 0.07);
          this.creatureFrontAccessoryAccent.setPosition(centerX - bodyWidth * 0.08, centerY + bodyHeight * 0.12);
          this.creatureFrontAccessoryAccent.setSize(bodyWidth * 0.08, bodyHeight * 0.14);
          break;
        case 'flower-crown':
          this.creatureWearableBrim.setVisible(true).setFillStyle(0x74ba78, 1);
          this.creatureWearableAccent.setVisible(true).setFillStyle(0xffb7d2, 1);
          this.creatureWearableBrim.setPosition(centerX, centerY - bodyHeight * 0.48);
          this.creatureWearableBrim.setSize(bodyWidth * 0.34, bodyHeight * 0.05);
          this.creatureWearableAccent.setPosition(centerX + bodyWidth * 0.08, centerY - bodyHeight * 0.49);
          this.creatureWearableAccent.setSize(bodyWidth * 0.08, bodyWidth * 0.08);
          break;
        default:
          this.creatureWearableTop.setVisible(true);
          this.creatureWearableBrim.setVisible(true);
          this.creatureWearableAccent.setVisible(true);
          this.creatureWearableTop.setPosition(centerX, centerY - bodyHeight * 0.48);
          this.creatureWearableTop.setSize(bodyWidth * 0.26, bodyHeight * 0.16);
          this.creatureWearableBrim.setPosition(centerX, centerY - bodyHeight * 0.41);
          this.creatureWearableBrim.setSize(bodyWidth * 0.42, bodyHeight * 0.05);
          this.creatureWearableAccent.setPosition(centerX + bodyWidth * 0.08, centerY - bodyHeight * 0.48);
          this.creatureWearableAccent.setSize(bodyWidth * 0.08, bodyWidth * 0.08);

          if (wearableItem.giftId === 'wizard-hat') {
            this.creatureWearableTop.setFillStyle(0x5d4ab8, 1);
            this.creatureWearableBrim.setFillStyle(0x3d2d89, 1);
            this.creatureWearableAccent.setFillStyle(0xffd67a, 1);
          } else if (wearableItem.giftId === 'birthday-hat') {
            this.creatureWearableTop.setFillStyle(0xf29b57, 1);
            this.creatureWearableBrim.setFillStyle(0xc45b62, 1);
            this.creatureWearableAccent.setFillStyle(0xfff1a6, 1);
          } else if (wearableItem.giftId === 'wool-hat') {
            this.creatureWearableTop.setFillStyle(0x6d7bb0, 1);
            this.creatureWearableBrim.setFillStyle(0x4a5a87, 1);
            this.creatureWearableAccent.setFillStyle(0xdfe5ff, 1);
          } else if (wearableItem.giftId === 'explorer-hat') {
            this.creatureWearableTop.setFillStyle(0x94744f, 1);
            this.creatureWearableBrim.setFillStyle(0x6d5538, 1);
            this.creatureWearableAccent.setFillStyle(0xe7c67b, 1);
          } else {
            this.creatureWearableTop.setFillStyle(0xd2b06f, 1);
            this.creatureWearableBrim.setFillStyle(0xa7854e, 1);
            this.creatureWearableAccent.setFillStyle(0xf7e0ad, 1);
          }
          break;
      }
    }

    if (handheldItem) {
      switch (handheldItem.giftId) {
        case 'walking-stick':
          this.creatureHeldAccessoryStem.setVisible(true).setFillStyle(0x8a6b52, 1);
          this.creatureHeldAccessoryStem.setPosition(centerX + bodyWidth * 0.34, centerY + bodyHeight * 0.1);
          this.creatureHeldAccessoryStem.setSize(bodyWidth * 0.05, bodyHeight * 0.42);
          break;
        case 'compass':
          this.creatureHeldAccessoryAccent.setVisible(true).setFillStyle(0x7bc4da, 1);
          this.creatureHeldAccessoryAccent.setPosition(centerX + bodyWidth * 0.24, centerY + bodyHeight * 0.14);
          this.creatureHeldAccessoryAccent.setSize(bodyWidth * 0.14, bodyWidth * 0.14);
          break;
        case 'lantern':
          this.creatureHeldAccessoryMain.setVisible(true).setFillStyle(0xe6c075, 1);
          this.creatureHeldAccessoryAccent.setVisible(true).setFillStyle(0x7fd7f0, 1);
          this.creatureHeldAccessoryStem.setVisible(true).setFillStyle(0x6d5538, 1);
          this.creatureHeldAccessoryMain.setPosition(centerX + bodyWidth * 0.28, centerY + bodyHeight * 0.14);
          this.creatureHeldAccessoryMain.setSize(bodyWidth * 0.12, bodyHeight * 0.16);
          this.creatureHeldAccessoryAccent.setPosition(centerX + bodyWidth * 0.28, centerY + bodyHeight * 0.12);
          this.creatureHeldAccessoryAccent.setSize(bodyWidth * 0.08, bodyWidth * 0.08);
          this.creatureHeldAccessoryStem.setPosition(centerX + bodyWidth * 0.28, centerY + bodyHeight * 0.01);
          this.creatureHeldAccessoryStem.setSize(bodyWidth * 0.018, bodyHeight * 0.14);
          break;
        default:
          this.creatureHeldAccessoryMain.setVisible(true);
          this.creatureHeldAccessoryAccent.setVisible(true);
          this.creatureHeldAccessoryMain.setPosition(centerX + bodyWidth * 0.28, centerY + bodyHeight * 0.18);
          this.creatureHeldAccessoryMain.setSize(bodyWidth * 0.16, bodyHeight * 0.14);
          this.creatureHeldAccessoryAccent.setPosition(centerX + bodyWidth * 0.28, centerY + bodyHeight * 0.14);
          this.creatureHeldAccessoryAccent.setSize(bodyWidth * 0.05, bodyWidth * 0.05);

          if (handheldItem.giftId === 'star-map') {
            this.creatureHeldAccessoryMain.setFillStyle(0x6d87d1, 1);
            this.creatureHeldAccessoryAccent.setFillStyle(0xffde8f, 1);
          } else if (handheldItem.giftId === 'story-book') {
            this.creatureHeldAccessoryMain.setFillStyle(0xb86952, 1);
            this.creatureHeldAccessoryAccent.setFillStyle(0xf9e2ac, 1);
          } else {
            this.creatureHeldAccessoryMain.setFillStyle(0x4b79c7, 1);
            this.creatureHeldAccessoryAccent.setFillStyle(0xf7e0a3, 1);
          }
          break;
      }
    }
  }

  private findRecentGift(giftIds: readonly string[]): PettitViewModel['inventory'][number] | null {
    const inventory = this.pettitState?.inventory ?? [];

    for (const item of [...inventory].reverse()) {
      if (giftIds.includes(item.giftId)) {
        return item;
      }
    }

    return null;
  }

  private formatTraitName(traitKey: TraitKey | undefined): string {
    if (!traitKey) {
      return 'Curiosity';
    }

    return this.capitalize(traitKey);
  }

  private truncateJournalPreview(content: string): string {
    const compact = this.scale.width < 1060;
    const maxLength = compact ? 200 : 150;
    const normalized = content.replace(/\s+/g, ' ').trim();

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trimEnd()}...`;
  }

  private formatMemoryPreview(title: string): string {
    const normalized = title.trim();
    const compactTitle = normalized.length > 34 ? `${normalized.slice(0, 34).trimEnd()}...` : normalized;
    return `${this.getMemoryIcon(normalized)} ${compactTitle}`;
  }

  private formatHallDetailLine(memory: PettitMemory, maxLength: number): string {
    return `${this.getMemoryIcon(memory.title)} ${this.truncateText(memory.title, 28)} - ${this.truncateText(
      memory.description,
      maxLength
    )}`;
  }

  private truncateText(value: string, maxLength: number): string {
    const normalized = value.replace(/\s+/g, ' ').trim();

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trimEnd()}...`;
  }

  private getMemoryIcon(title: string): string {
    const lowercaseTitle = title.toLowerCase();

    if (lowercaseTitle.includes('backpack') || lowercaseTitle.includes('gift')) {
      return '🎒';
    }

    if (lowercaseTitle.includes('book') || lowercaseTitle.includes('story') || lowercaseTitle.includes('journal')) {
      return '📖';
    }

    if (lowercaseTitle.includes('meal') || lowercaseTitle.includes('supplies') || lowercaseTitle.includes('packed')) {
      return '📦';
    }

    if (lowercaseTitle.includes('star') || lowercaseTitle.includes('sky') || lowercaseTitle.includes('lantern')) {
      return '✨';
    }

    return '•';
  }

  private formatMoodBadge(mood: PettitViewModel['pettit']['mood']): string {
    return `${this.capitalize(mood)} Mood`;
  }

  private parseHexColor(value: string | null): number {
    if (!value) {
      return 0x324759;
    }

    return Number.parseInt(value.replace('#', ''), 16);
  }

  private applySeasonalAccent(accentColor: string | null): void {
    const accent = this.parseHexColor(accentColor);

    if (!accentColor) {
      this.rootPanel.setStrokeStyle(2, 0x263846, 0.48);
      this.creatureArtFrame.setFillStyle(0x223243, 0.96);
      this.topActionPanel.setStrokeStyle(1, 0x2b3d49, 0.42);
      return;
    }

    this.rootPanel.setStrokeStyle(2, accent, 0.22);
    this.creatureArtFrame.setFillStyle(accent, 0.16);
    this.topActionPanel.setStrokeStyle(1, accent, 0.32);
  }

  private applyMoodBadgeStyle(mood: PettitViewModel['pettit']['mood']): void {
    if (this.scale.width < 620) {
      this.moodBadgeText.setBackgroundColor('#5c3d88');
      this.moodBadgeText.setColor('#f8edc8');
      return;
    }

    switch (mood) {
      case 'excited':
        this.moodBadgeText.setBackgroundColor('#f6b14b');
        this.moodBadgeText.setColor('#1f1e1a');
        return;
      case 'thoughtful':
        this.moodBadgeText.setBackgroundColor('#8aa7ff');
        this.moodBadgeText.setColor('#10203f');
        return;
      case 'nervous':
        this.moodBadgeText.setBackgroundColor('#f28a9e');
        this.moodBadgeText.setColor('#341723');
        return;
      default:
        this.moodBadgeText.setBackgroundColor('#7cd4a7');
        this.moodBadgeText.setColor('#103026');
        return;
    }
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
