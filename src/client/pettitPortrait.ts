import type { PettitAppearanceDna, PettitViewModel } from '../shared/pettit';

type Palette = {
  body: string;
  belly: string;
  bellyOutline: string;
  outline: string;
  accent: string;
  blush: string;
};

const getCreaturePalette = (paletteKey: PettitAppearanceDna['paletteKey']): Palette => {
  const palettes: Record<PettitAppearanceDna['paletteKey'], Palette> = {
    sunrise: {
      body: '#fff1d8',
      belly: '#fff9ee',
      bellyOutline: '#e4d7c3',
      outline: '#4e3a2f',
      accent: '#ff9a48',
      blush: '#ffb58f',
    },
    meadow: {
      body: '#f3f6dc',
      belly: '#fbfff0',
      bellyOutline: '#d4dfc5',
      outline: '#3c4736',
      accent: '#8fca63',
      blush: '#f2c5a2',
    },
    berry: {
      body: '#ffe3ef',
      belly: '#fff2f7',
      bellyOutline: '#f1ccd8',
      outline: '#56384a',
      accent: '#c8678f',
      blush: '#f7a8bd',
    },
    twilight: {
      body: '#e8e7ff',
      belly: '#f5f3ff',
      bellyOutline: '#d6d1f2',
      outline: '#3d4161',
      accent: '#8aa7ff',
      blush: '#d9b8f2',
    },
    moss: {
      body: '#e7f0de',
      belly: '#f5fbef',
      bellyOutline: '#d0dfc8',
      outline: '#445443',
      accent: '#6eb28e',
      blush: '#e6b89d',
    },
  };

  return palettes[paletteKey] ?? palettes.sunrise;
};

const findRecentGift = (state: PettitViewModel, giftIds: readonly string[]) => {
  return [...state.inventory].reverse().find((item) => giftIds.includes(item.giftId)) ?? null;
};

const escapeSvg = (value: string): string => {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

export const getPettitPortraitSignature = (state: PettitViewModel): string => {
  return JSON.stringify({
    mood: state.pettit.mood,
    traits: state.pettit.traits,
    dna: state.pettit.appearanceDna,
    wearable: findRecentGift(state, [
      'birthday-hat',
      'wizard-hat',
      'straw-hat',
      'wool-hat',
      'explorer-hat',
      'flower-crown',
      'hand-knitted-scarf',
      'small-backpack',
      'tiny-cape',
    ])?.giftId,
    handheld: findRecentGift(state, ['lantern', 'walking-stick', 'adventure-book', 'story-book', 'star-map', 'compass'])
      ?.giftId,
  });
};

export const buildPettitPortraitDataUrl = (state: PettitViewModel): string => {
  const dna = state.pettit.appearanceDna;
  const palette = getCreaturePalette(dna.paletteKey);
  const traits = state.pettit.traits;
  const curiosityWeight = traits.curiosity / 100;
  const trustWeight = traits.trust / 100;
  const courageWeight = traits.courage / 100;
  const chaosWeight = traits.chaos / 100;
  const mood = state.pettit.mood;

  const bodyWidth = 102 * (dna.bodyWidthScale + trustWeight * 0.08);
  const bodyHeight = Math.min(118, bodyWidth * 1.12) * (dna.bodyHeightScale + courageWeight * 0.06);
  const centerX = 120;
  const centerY = 132 + Math.round((0.5 - courageWeight) * 5);
  const earWidth = bodyWidth * (dna.earStyle === 'leaf' ? 0.16 : 0.18);
  const earHeight = bodyHeight * (dna.earStyle === 'round' ? 0.24 : dna.earStyle === 'leaf' ? 0.34 : 0.28);
  const earRotation = dna.earStyle === 'leaf' ? 16 : dna.earStyle === 'tilt' ? 26 : 10;
  const eyeWidth = dna.eyeStyle === 'dot' ? bodyWidth * 0.055 : dna.eyeStyle === 'sleepy' ? bodyWidth * 0.078 : bodyWidth * 0.065;
  const eyeHeight = dna.eyeStyle === 'sleepy' ? bodyHeight * 0.075 : dna.eyeStyle === 'dot' ? bodyHeight * 0.09 : bodyHeight * 0.1;
  const eyeOffsetX = bodyWidth * 0.16 * dna.eyeSpacing * (1 + curiosityWeight * 0.08);
  const eyeY = centerY - bodyHeight * (0.12 + curiosityWeight * 0.03);
  const blushWidth = bodyWidth * (dna.blushStyle === 'soft' ? 0.16 : 0.14);
  const blushHeight = bodyHeight * (dna.blushStyle === 'soft' ? 0.07 : 0.08);
  const blushOffsetX = bodyWidth * 0.22;
  const blushY = centerY + bodyHeight * 0.04;
  const bellyWidth = bodyWidth * (0.52 + trustWeight * 0.06);
  const bellyHeight = bodyHeight * 0.4;
  const sparkX = centerX + bodyWidth * 0.16;
  const sparkY = centerY - bodyHeight * 0.52;
  const sparkR = bodyWidth * (dna.sparkStyle === 'leaf' ? 0.05 : 0.06);

  const wearable = findRecentGift(state, [
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
  const handheld = findRecentGift(state, ['lantern', 'walking-stick', 'adventure-book', 'story-book', 'star-map', 'compass']);

  let wearableSvg = '';
  let backSvg = '';
  let frontSvg = '';
  let handSvg = '';

  if (wearable?.giftId === 'small-backpack') {
    backSvg = `
      <rect x="${centerX + bodyWidth * 0.04}" y="${centerY - bodyHeight * 0.12}" width="${bodyWidth * 0.32}" height="${bodyHeight * 0.34}" rx="${bodyWidth * 0.08}" fill="#7f5d43" />
      <rect x="${centerX + bodyWidth * 0.18}" y="${centerY - bodyHeight * 0.12}" width="${bodyWidth * 0.06}" height="${bodyHeight * 0.34}" rx="${bodyWidth * 0.02}" fill="#d7c4a3" />
    `;
  } else if (wearable?.giftId === 'tiny-cape') {
    backSvg = `
      <ellipse cx="${centerX}" cy="${centerY + bodyHeight * 0.14}" rx="${bodyWidth * 0.28}" ry="${bodyHeight * 0.22}" fill="#b24d56" />
      <rect x="${centerX - bodyWidth * 0.09}" y="${centerY - bodyHeight * 0.08}" width="${bodyWidth * 0.18}" height="${bodyHeight * 0.05}" rx="${bodyWidth * 0.02}" fill="#f6d07a" />
    `;
  } else if (wearable?.giftId === 'hand-knitted-scarf') {
    frontSvg = `
      <rect x="${centerX - bodyWidth * 0.22}" y="${centerY + bodyHeight * 0.02}" width="${bodyWidth * 0.44}" height="${bodyHeight * 0.07}" rx="${bodyHeight * 0.03}" fill="#c75d68" />
      <rect x="${centerX - bodyWidth * 0.13}" y="${centerY + bodyHeight * 0.06}" width="${bodyWidth * 0.08}" height="${bodyHeight * 0.14}" rx="${bodyWidth * 0.03}" fill="#f0d8a6" />
    `;
  } else if (wearable?.giftId === 'flower-crown') {
    wearableSvg = `
      <rect x="${centerX - bodyWidth * 0.17}" y="${centerY - bodyHeight * 0.5}" width="${bodyWidth * 0.34}" height="${bodyHeight * 0.05}" rx="${bodyHeight * 0.025}" fill="#74ba78" />
      <circle cx="${centerX + bodyWidth * 0.08}" cy="${centerY - bodyHeight * 0.49}" r="${bodyWidth * 0.04}" fill="#ffb7d2" />
    `;
  } else if (wearable) {
    let top = '#d2b06f';
    let brim = '#a7854e';
    let accent = '#f7e0ad';

    if (wearable.giftId === 'wizard-hat') {
      top = '#5d4ab8';
      brim = '#3d2d89';
      accent = '#ffd67a';
    } else if (wearable.giftId === 'birthday-hat') {
      top = '#f29b57';
      brim = '#c45b62';
      accent = '#fff1a6';
    } else if (wearable.giftId === 'wool-hat') {
      top = '#6d7bb0';
      brim = '#4a5a87';
      accent = '#dfe5ff';
    } else if (wearable.giftId === 'explorer-hat') {
      top = '#94744f';
      brim = '#6d5538';
      accent = '#e7c67b';
    }

    wearableSvg = `
      <rect x="${centerX - bodyWidth * 0.13}" y="${centerY - bodyHeight * 0.56}" width="${bodyWidth * 0.26}" height="${bodyHeight * 0.16}" rx="${bodyWidth * 0.05}" fill="${top}" />
      <rect x="${centerX - bodyWidth * 0.21}" y="${centerY - bodyHeight * 0.44}" width="${bodyWidth * 0.42}" height="${bodyHeight * 0.05}" rx="${bodyHeight * 0.025}" fill="${brim}" />
      <circle cx="${centerX + bodyWidth * 0.08}" cy="${centerY - bodyHeight * 0.48}" r="${bodyWidth * 0.04}" fill="${accent}" />
    `;
  }

  if (handheld?.giftId === 'walking-stick') {
    handSvg = `<rect x="${centerX + bodyWidth * 0.31}" y="${centerY - bodyHeight * 0.08}" width="${bodyWidth * 0.05}" height="${bodyHeight * 0.42}" rx="${bodyWidth * 0.02}" fill="#8a6b52" />`;
  } else if (handheld?.giftId === 'compass') {
    handSvg = `<circle cx="${centerX + bodyWidth * 0.24}" cy="${centerY + bodyHeight * 0.14}" r="${bodyWidth * 0.07}" fill="#7bc4da" />`;
  } else if (handheld?.giftId === 'lantern') {
    handSvg = `
      <rect x="${centerX + bodyWidth * 0.22}" y="${centerY + bodyHeight * 0.06}" width="${bodyWidth * 0.12}" height="${bodyHeight * 0.16}" rx="${bodyWidth * 0.03}" fill="#e6c075" />
      <circle cx="${centerX + bodyWidth * 0.28}" cy="${centerY + bodyHeight * 0.12}" r="${bodyWidth * 0.04}" fill="#7fd7f0" />
      <rect x="${centerX + bodyWidth * 0.27}" y="${centerY - bodyHeight * 0.01}" width="${bodyWidth * 0.018}" height="${bodyHeight * 0.14}" rx="${bodyWidth * 0.01}" fill="#6d5538" />
    `;
  } else if (handheld) {
    const main =
      handheld.giftId === 'star-map'
        ? '#6d87d1'
        : handheld.giftId === 'story-book' || handheld.giftId === 'adventure-book'
          ? '#b86952'
          : '#e6c075';
    const accent =
      handheld.giftId === 'star-map'
        ? '#ffde8f'
        : handheld.giftId === 'story-book' || handheld.giftId === 'adventure-book'
          ? '#f9e2ac'
          : '#fff2cf';
    handSvg = `
      <rect x="${centerX + bodyWidth * 0.2}" y="${centerY + bodyHeight * 0.11}" width="${bodyWidth * 0.16}" height="${bodyHeight * 0.14}" rx="${bodyWidth * 0.03}" fill="${main}" />
      <circle cx="${centerX + bodyWidth * 0.28}" cy="${centerY + bodyHeight * 0.14}" r="${bodyWidth * 0.025}" fill="${accent}" />
    `;
  }

  let accentSvg = '';
  if (dna.accentPattern === 'patch' || dna.accentPattern === 'speck') {
    accentSvg = `<ellipse cx="${centerX - bodyWidth * 0.14}" cy="${centerY - bodyHeight * 0.2}" rx="${bodyWidth * 0.09}" ry="${bodyHeight * 0.06}" fill="${palette.accent}" opacity="0.92" />`;
  } else if (dna.accentPattern === 'band') {
    accentSvg = `<rect x="${centerX - bodyWidth * 0.31}" y="${centerY - bodyHeight * 0.12}" width="${bodyWidth * 0.62}" height="${bodyHeight * 0.08}" rx="${bodyHeight * 0.04}" fill="${palette.accent}" opacity="0.72" transform="rotate(${-4 + chaosWeight * 3} ${centerX} ${centerY - bodyHeight * 0.08})" />`;
  }

  const mouthSvg =
    mood === 'excited'
      ? `<path d="M ${centerX - bodyWidth * 0.09} ${centerY + bodyHeight * 0.08} Q ${centerX} ${centerY + bodyHeight * 0.16} ${centerX + bodyWidth * 0.09} ${centerY + bodyHeight * 0.08}" fill="none" stroke="#1a2026" stroke-width="5" stroke-linecap="round" />`
      : mood === 'nervous'
        ? `<path d="M ${centerX - bodyWidth * 0.08} ${centerY + bodyHeight * 0.08} Q ${centerX} ${centerY + bodyHeight * 0.13} ${centerX + bodyWidth * 0.08} ${centerY + bodyHeight * 0.08}" fill="none" stroke="#1a2026" stroke-width="4" stroke-linecap="round" transform="rotate(8 ${centerX} ${centerY + bodyHeight * 0.08})" />`
        : mood === 'thoughtful'
          ? `<path d="M ${centerX - bodyWidth * 0.1} ${centerY + bodyHeight * 0.09} Q ${centerX} ${centerY + bodyHeight * 0.02} ${centerX + bodyWidth * 0.1} ${centerY + bodyHeight * 0.09}" fill="none" stroke="#1a2026" stroke-width="5" stroke-linecap="round" />`
          : `<path d="M ${centerX - bodyWidth * 0.09} ${centerY + bodyHeight * 0.08} Q ${centerX} ${centerY + bodyHeight * 0.14} ${centerX + bodyWidth * 0.09} ${centerY + bodyHeight * 0.08}" fill="none" stroke="#1a2026" stroke-width="5" stroke-linecap="round" />`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" aria-label="${escapeSvg(
      state.pettit.name
    )}">
      <g transform="rotate(${(chaosWeight - 0.5) * 4} 120 120)">
        ${backSvg}
        <ellipse cx="${centerX - bodyWidth * 0.24}" cy="${centerY - bodyHeight * 0.42}" rx="${earWidth / 2}" ry="${earHeight / 2}" fill="${palette.body}" stroke="${palette.outline}" stroke-width="3" transform="rotate(${-earRotation} ${centerX - bodyWidth * 0.24} ${centerY - bodyHeight * 0.42})" />
        <ellipse cx="${centerX + bodyWidth * (0.24 + chaosWeight * 0.03)}" cy="${centerY - bodyHeight * 0.42}" rx="${(earWidth * (1 + chaosWeight * 0.08)) / 2}" ry="${earHeight / 2}" fill="${palette.body}" stroke="${palette.outline}" stroke-width="3" transform="rotate(${earRotation} ${centerX + bodyWidth * (0.24 + chaosWeight * 0.03)} ${centerY - bodyHeight * 0.42})" />
        <ellipse cx="${centerX}" cy="${centerY + bodyHeight * 0.34}" rx="${bodyWidth * 0.39}" ry="${bodyHeight * 0.09}" fill="#091017" opacity="0.45" />
        <ellipse cx="${centerX}" cy="${centerY}" rx="${bodyWidth / 2}" ry="${bodyHeight / 2}" fill="${palette.body}" stroke="${palette.outline}" stroke-width="4" />
        ${accentSvg}
        <ellipse cx="${centerX}" cy="${centerY + bodyHeight * 0.16}" rx="${bellyWidth / 2}" ry="${bellyHeight / 2}" fill="${palette.belly}" stroke="${palette.bellyOutline}" stroke-width="2" opacity="0.96" />
        <ellipse cx="${centerX - eyeOffsetX}" cy="${eyeY}" rx="${eyeWidth / 2}" ry="${eyeHeight / 2}" fill="#1a2026" />
        <ellipse cx="${centerX + eyeOffsetX + chaosWeight * 3}" cy="${eyeY - chaosWeight * 2}" rx="${eyeWidth / 2}" ry="${eyeHeight / 2}" fill="#1a2026" />
        ${
          dna.blushStyle === 'none'
            ? ''
            : `
          <ellipse cx="${centerX - blushOffsetX}" cy="${blushY}" rx="${blushWidth / 2}" ry="${blushHeight / 2}" fill="${palette.blush}" opacity="0.85" />
          <ellipse cx="${centerX + blushOffsetX}" cy="${blushY}" rx="${blushWidth / 2}" ry="${blushHeight / 2}" fill="${palette.blush}" opacity="0.85" />
        `
        }
        ${mouthSvg}
        ${frontSvg}
        ${handSvg}
        ${wearableSvg}
        <circle cx="${sparkX}" cy="${sparkY}" r="${sparkR}" fill="${palette.accent}" stroke="${palette.outline}" stroke-width="2" />
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
