import { SubtitleItem } from '../types';
import { secondsToSRT } from './subtitleParser';

/**
 * Adjusts all subtitle timestamps by a given offset in milliseconds.
 * Positive offset moves subtitles forward in time.
 * Negative offset moves subtitles backward in time.
 */
export function shiftSubtitleTimestamps(
  items: SubtitleItem[],
  offsetMs: number
): SubtitleItem[] {
  if (!offsetMs || items.length === 0) return items;

  const offsetSeconds = offsetMs / 1000;

  return items.map((item) => {
    const newStartSec = Math.max(0, item.startSeconds + offsetSeconds);
    const newEndSec = Math.max(0.1, item.endSeconds + offsetSeconds);

    return {
      ...item,
      startSeconds: newStartSec,
      endSeconds: newEndSec,
      startTime: secondsToSRT(newStartSec),
      endTime: secondsToSRT(newEndSec),
    };
  });
}
