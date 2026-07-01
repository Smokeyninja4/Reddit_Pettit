import type {
  HallOfMemoriesDetailView,
  HallOfMemoriesView,
  PettitMemory,
} from '../../shared/pettit';

const isHighlightedMemory = (memory: PettitMemory): boolean => {
  return memory.importance >= 4 || memory.type === 'community' || memory.type === 'special';
};

const compareByTimestampDesc = (left: PettitMemory, right: PettitMemory): number => {
  return Date.parse(right.timestamp) - Date.parse(left.timestamp);
};

const compareHighlighted = (left: PettitMemory, right: PettitMemory): number => {
  if (right.importance !== left.importance) {
    return right.importance - left.importance;
  }

  return compareByTimestampDesc(left, right);
};

export const buildHallOfMemoriesView = (memories: PettitMemory[]): HallOfMemoriesView => {
  const archive = [...memories].sort(compareByTimestampDesc);
  const highlighted = archive.filter(isHighlightedMemory).sort(compareHighlighted);
  const preview = (highlighted.length > 0 ? highlighted : archive).slice(0, 3);

  return {
    highlighted: preview,
    recentArchive: archive.slice(0, 12),
    highlightedCount: highlighted.length,
  };
};

export const buildHallOfMemoriesDetail = (memories: PettitMemory[]): HallOfMemoriesDetailView => {
  const archive = [...memories].sort(compareByTimestampDesc);
  const highlighted = archive.filter(isHighlightedMemory).sort(compareHighlighted);

  return {
    highlighted,
    archive,
    highlightedCount: highlighted.length,
  };
};
