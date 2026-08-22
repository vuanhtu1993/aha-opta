/**
 * Format next due date interval into human-readable Vietnamese string
 */
export function formatIntervalDays(nextDueStr?: string): string {
  if (!nextDueStr) return "";
  const due = new Date(nextDueStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return "Hôm nay";
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} giờ`;
  const days = Math.round(diffHours / 24);
  return `${days} ngày`;
}
