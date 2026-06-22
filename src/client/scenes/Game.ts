import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { fetchPettitState, resolvePettitVote, submitPettitVote } from '../pettitApi';
import type { PettitViewModel, TraitKey } from '../../shared/pettit';

type LayoutMetrics = {
  width: number;
  height: number;
  cardWidth: number;
  cardLeft: number;
  topPadding: number;
  sidePadding: number;
  cardPaddingX: number;
  cardPaddingY: number;
  sectionGap: number;
  textGap: number;
  buttonGap: number;
  buttonHeight: number;
  bottomPadding: number;
  scaleFactor: number;
};

export class Game extends Scene {
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private background!: Phaser.GameObjects.Image;
  private questCardBackground!: Phaser.GameObjects.Rectangle;
  private journalCardBackground!: Phaser.GameObjects.Rectangle;
  private memoryCardBackground!: Phaser.GameObjects.Rectangle;
  private headerText!: Phaser.GameObjects.Text;
  private questTitleText!: Phaser.GameObjects.Text;
  private questDescriptionText!: Phaser.GameObjects.Text;
  private voteSummaryText!: Phaser.GameObjects.Text;
  private journalTitleText!: Phaser.GameObjects.Text;
  private journalBodyText!: Phaser.GameObjects.Text;
  private memoryText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private resolveButton!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Text[] = [];
  private pettitState: PettitViewModel | null = null;

  constructor() {
    super('Game');
  }

  create(): void {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x122027);

    this.background = this.add.image(512, 384, 'background').setAlpha(0.16);

    this.questCardBackground = this.add
      .rectangle(0, 0, 100, 100, 0x0f1d23, 0.92)
      .setOrigin(0)
      .setStrokeStyle(2, 0x7fb0c4, 0.9);
    this.journalCardBackground = this.add
      .rectangle(0, 0, 100, 100, 0x1d2f36, 0.92)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc98f45, 0.9);
    this.memoryCardBackground = this.add
      .rectangle(0, 0, 100, 100, 0x162830, 0.92)
      .setOrigin(0)
      .setStrokeStyle(2, 0x7bc7a5, 0.85);

    this.headerText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '26px',
      color: '#fff7e6',
      wordWrap: { width: 780 },
      lineSpacing: 6,
    });
    this.questTitleText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#ffe3a3',
      wordWrap: { width: 700 },
    });
    this.questDescriptionText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#e0edf2',
      wordWrap: { width: 700 },
      lineSpacing: 6,
    });
    this.voteSummaryText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#a9c8d6',
      wordWrap: { width: 700 },
    });
    this.journalTitleText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#fff0cf',
      wordWrap: { width: 700 },
    });
    this.journalBodyText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#f3f6f8',
      wordWrap: { width: 700 },
      lineSpacing: 8,
    });
    this.memoryText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#dff3ea',
      wordWrap: { width: 700 },
      lineSpacing: 7,
    });
    this.statusText = this.add.text(0, 0, 'Loading Pettit...', {
      fontFamily: 'Trebuchet MS',
      fontSize: '17px',
      color: '#ffe9a8',
      wordWrap: { width: 760 },
      align: 'center',
    });
    this.statusText.setOrigin(0.5, 0);

    this.resolveButton = this.add
      .text(0, 0, 'Resolve current vote', {
        fontFamily: 'Trebuchet MS',
        fontSize: '22px',
        color: '#142028',
        backgroundColor: '#f6c453',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        void this.handleResolve();
      })
      .on('pointerover', () => this.resolveButton.setStyle({ backgroundColor: '#ffd980' }))
      .on('pointerout', () => this.resolveButton.setStyle({ backgroundColor: '#f6c453' }));

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateLayout(gameSize.width, gameSize.height);
    });

    this.updateLayout(this.scale.width, this.scale.height);
    void this.loadState();
  }

  private getLayoutMetrics(width: number, height: number): LayoutMetrics {
    const scaleFactor = Math.min(Math.min(width / 1180, height / 980), 1);
    const cardWidth = Math.min(width * 0.82, 760);
    const cardLeft = (width - cardWidth) / 2;
    const compactScale = height < 820 ? 0.88 : height < 920 ? 0.94 : 1;

    return {
      width,
      height,
      cardWidth,
      cardLeft,
      topPadding: Math.round(24 * compactScale),
      sidePadding: Math.round(24 * compactScale),
      cardPaddingX: Math.round(24 * compactScale),
      cardPaddingY: Math.round(20 * compactScale),
      sectionGap: Math.round(24 * compactScale),
      textGap: Math.round(14 * compactScale),
      buttonGap: Math.round(14 * compactScale),
      buttonHeight: Math.round(48 * compactScale),
      bottomPadding: Math.round(28 * compactScale),
      scaleFactor,
    };
  }

  private updateTextStyles(metrics: LayoutMetrics): void {
    const compactFontScale = metrics.height < 820 ? 0.9 : metrics.height < 920 ? 0.95 : 1;
    const titleScale = metrics.scaleFactor * compactFontScale;

    this.headerText.setFontSize(Math.round(26 * titleScale));
    this.questTitleText.setFontSize(Math.round(28 * titleScale));
    this.questDescriptionText.setFontSize(Math.round(20 * titleScale));
    this.voteSummaryText.setFontSize(Math.round(18 * titleScale));
    this.journalTitleText.setFontSize(Math.round(24 * titleScale));
    this.journalBodyText.setFontSize(Math.round(18 * titleScale));
    this.memoryText.setFontSize(Math.round(17 * titleScale));
    this.statusText.setFontSize(Math.round(17 * titleScale));
    this.resolveButton.setFontSize(Math.round(22 * titleScale));
    this.optionButtons.forEach((button) => {
      button.setFontSize(Math.round(18 * titleScale));
    });
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

    const contentWidth = metrics.cardWidth - metrics.cardPaddingX * 2;
    this.headerText.setWordWrapWidth(metrics.cardWidth);
    this.questTitleText.setWordWrapWidth(contentWidth);
    this.questDescriptionText.setWordWrapWidth(contentWidth);
    this.voteSummaryText.setWordWrapWidth(contentWidth);
    this.journalTitleText.setWordWrapWidth(contentWidth);
    this.journalBodyText.setWordWrapWidth(contentWidth);
    this.memoryText.setWordWrapWidth(contentWidth);
    this.statusText.setWordWrapWidth(metrics.cardWidth);

    let currentTop = metrics.topPadding;
    currentTop = this.layoutHeader(metrics, currentTop);
    currentTop = this.layoutQuestCard(metrics, currentTop);
    currentTop = this.layoutJournalCard(metrics, currentTop);
    currentTop = this.layoutMemoryCard(metrics, currentTop);
    this.layoutResolveArea(metrics, currentTop);
  }

  private layoutHeader(metrics: LayoutMetrics, top: number): number {
    this.headerText.setPosition(metrics.cardLeft, top);
    return top + this.measureTextBlock(this.headerText) + metrics.sectionGap;
  }

  private layoutQuestCard(metrics: LayoutMetrics, top: number): number {
    const contentLeft = metrics.cardLeft + metrics.cardPaddingX;
    const contentWidth = metrics.cardWidth - metrics.cardPaddingX * 2;

    this.questTitleText.setPosition(contentLeft, top + metrics.cardPaddingY);
    this.questTitleText.setWordWrapWidth(contentWidth);

    const titleBottom = this.questTitleText.y + this.measureTextBlock(this.questTitleText);
    this.questDescriptionText.setPosition(contentLeft, titleBottom + metrics.textGap);
    this.questDescriptionText.setWordWrapWidth(contentWidth);

    const descriptionBottom = this.questDescriptionText.y + this.measureTextBlock(this.questDescriptionText);
    this.voteSummaryText.setPosition(contentLeft, descriptionBottom + metrics.textGap);
    this.voteSummaryText.setWordWrapWidth(contentWidth);

    const summaryBottom = this.voteSummaryText.y + this.measureTextBlock(this.voteSummaryText);
    const buttonsBottom = this.layoutVoteButtons(metrics, summaryBottom + metrics.textGap);
    const questBottom = buttonsBottom + metrics.cardPaddingY;

    this.questCardBackground.setPosition(metrics.cardLeft, top);
    this.questCardBackground.setSize(metrics.cardWidth, questBottom - top);

    return questBottom + metrics.sectionGap;
  }

  private layoutVoteButtons(metrics: LayoutMetrics, top: number): number {
    const buttonWidth = metrics.cardWidth - metrics.cardPaddingX * 2;
    let currentTop = top;

    this.optionButtons.forEach((button) => {
      button.setPosition(metrics.cardLeft + metrics.cardPaddingX, currentTop);
      button.setFixedSize(buttonWidth, metrics.buttonHeight);
      currentTop += metrics.buttonHeight + metrics.buttonGap;
    });

    return this.optionButtons.length > 0 ? currentTop - metrics.buttonGap : top;
  }

  private layoutJournalCard(metrics: LayoutMetrics, top: number): number {
    const contentLeft = metrics.cardLeft + metrics.cardPaddingX;
    const contentWidth = metrics.cardWidth - metrics.cardPaddingX * 2;

    this.journalTitleText.setPosition(contentLeft, top + metrics.cardPaddingY);
    this.journalTitleText.setWordWrapWidth(contentWidth);

    const titleBottom = this.journalTitleText.y + this.measureTextBlock(this.journalTitleText);
    this.journalBodyText.setPosition(contentLeft, titleBottom + metrics.textGap);
    this.journalBodyText.setWordWrapWidth(contentWidth);

    const bodyBottom = this.journalBodyText.y + this.measureTextBlock(this.journalBodyText);
    const cardBottom = bodyBottom + metrics.cardPaddingY;

    this.journalCardBackground.setPosition(metrics.cardLeft, top);
    this.journalCardBackground.setSize(metrics.cardWidth, cardBottom - top);

    return cardBottom + metrics.sectionGap;
  }

  private layoutMemoryCard(metrics: LayoutMetrics, top: number): number {
    const contentLeft = metrics.cardLeft + metrics.cardPaddingX;
    const contentWidth = metrics.cardWidth - metrics.cardPaddingX * 2;

    this.memoryText.setPosition(contentLeft, top + metrics.cardPaddingY);
    this.memoryText.setWordWrapWidth(contentWidth);

    const bodyBottom = this.memoryText.y + this.measureTextBlock(this.memoryText);
    const cardBottom = bodyBottom + metrics.cardPaddingY;

    this.memoryCardBackground.setPosition(metrics.cardLeft, top);
    this.memoryCardBackground.setSize(metrics.cardWidth, cardBottom - top);

    return cardBottom + metrics.sectionGap;
  }

  private layoutResolveArea(metrics: LayoutMetrics, top: number): void {
    const reservedButtonHeight = Math.max(this.resolveButton.height, metrics.buttonHeight);

    this.statusText.setPosition(metrics.width / 2, top);
    const statusBottom = top + this.measureTextBlock(this.statusText);

    this.resolveButton.setPosition(
      metrics.width / 2,
      statusBottom + Math.max(metrics.textGap, 12)
    );

    const resolveBottom = this.resolveButton.y + reservedButtonHeight;
    const overflow = resolveBottom + metrics.bottomPadding - metrics.height;

    if (overflow > 0) {
      const shift = overflow;
      this.statusText.setY(Math.max(metrics.topPadding, this.statusText.y - shift));
      this.resolveButton.setY(Math.max(this.statusText.y + this.statusText.height + 12, this.resolveButton.y - shift));
    }
  }

  private measureTextBlock(text: Phaser.GameObjects.Text): number {
    text.updateText();
    return text.height;
  }

  private async loadState(): Promise<void> {
    try {
      const response = await fetchPettitState();
      this.pettitState = response.state;
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
          color: '#10202a',
          backgroundColor: '#d9edf5',
          padding: { x: 18, y: 10 },
        });
        const createdButton = button;

        createdButton.setOrigin(0, 0);
        createdButton.setInteractive({ useHandCursor: true });
        createdButton.on('pointerover', () => {
          if (!this.pettitState?.activeQuest.hasVoted) {
            createdButton.setStyle({ backgroundColor: '#fff1c4' });
          }
        });
        createdButton.on('pointerout', () => {
          this.applyOptionState(createdButton, option.id);
        });
        createdButton.on('pointerdown', () => {
          void this.handleVote(option.id);
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
    this.headerText.setText(
      `${pettit.name} is ${pettit.ageDays} day${pettit.ageDays === 1 ? '' : 's'} old, feels ${pettit.mood}, and leans ${this.formatTraitName(pettit.topTraits[0])} + ${this.formatTraitName(pettit.topTraits[1])}.`
    );
    this.questTitleText.setText(activeQuest.title);
    this.questDescriptionText.setText(activeQuest.description);
    this.voteSummaryText.setText(
      `Votes so far: ${activeQuest.totalVotes}${activeQuest.hasVoted ? ' • Your vote is in.' : ' • Choose one option below.'}`
    );

    this.renderOptionButtons();

    if (latestJournal) {
      this.journalTitleText.setText(`Latest Journal: ${latestJournal.title}`);
      this.journalBodyText.setText(latestJournal.content);
    } else {
      this.journalTitleText.setText('Latest Journal');
      this.journalBodyText.setText('Resolve the first vote to give Pettit its opening journal entry.');
    }

    if (recentMemories.length > 0) {
      this.memoryText.setText(
        recentMemories
          .map((memory) => `${memory.title}\n${memory.description}`)
          .join('\n\n')
      );
    } else {
      this.memoryText.setText('No memories yet. The first resolved quest will give Pettit something to remember.');
    }

    this.updateLayout(this.scale.width, this.scale.height);
  }

  private renderOptionButtons(): void {
    if (!this.pettitState) {
      return;
    }

    this.pettitState.activeQuest.options.forEach((option, index) => {
      const button = this.optionButtons[index];

      if (!button) {
        return;
      }

      button.setText(`${option.label} • ${option.votes}`);
      this.applyOptionState(button, option.id);
    });
  }

  private applyOptionState(button: Phaser.GameObjects.Text, optionId: string): void {
    const quest = this.pettitState?.activeQuest;

    if (!quest) {
      return;
    }

    const isSelected = quest.selectedOptionId === optionId;
    const isLocked = quest.hasVoted;
    const backgroundColor = isSelected ? '#f6c453' : isLocked ? '#8da3ae' : '#d9edf5';

    button.setStyle({
      backgroundColor,
      color: '#10202a',
    });

    if (isLocked) {
      button.disableInteractive();
      button.setAlpha(isSelected ? 1 : 0.72);
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
      this.updateLayout(this.scale.width, this.scale.height);
      const response = await submitPettitVote({ optionId });
      this.pettitState = response.state;
      this.statusText.setText('Vote recorded. Pettit is waiting for the community.');
      this.syncOptionButtons();
      this.renderState();
    } catch (error) {
      console.error('Failed to submit vote:', error);
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
      this.statusText.setText(`Resolved with "${this.humanizeOptionId(response.resolution.winningOptionId)}".`);
      this.syncOptionButtons();
      this.renderState();
      this.flashCard(this.journalCardBackground, 0xd89a48);
      this.flashCard(this.memoryCardBackground, 0x63c19d);
    } catch (error) {
      console.error('Failed to resolve vote:', error);
      this.statusText.setText(error instanceof Error ? error.message : 'Failed to resolve vote.');
      this.updateLayout(this.scale.width, this.scale.height);
    }
  }

  private flashCard(card: Phaser.GameObjects.Rectangle, flashColor: number): void {
    const originalFill = card.fillColor;
    card.setFillStyle(flashColor, 0.95);
    this.time.delayedCall(500, () => {
      card.setFillStyle(originalFill, 0.92);
    });
  }

  private formatTraitName(traitKey: TraitKey | undefined): string {
    if (!traitKey) {
      return 'Curiosity';
    }

    return traitKey.charAt(0).toUpperCase() + traitKey.slice(1);
  }

  private humanizeOptionId(optionId: string): string {
    return optionId
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
