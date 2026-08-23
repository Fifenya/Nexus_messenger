export function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return 'недавно';
  
  const date = new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHours < 24) {
    return `сегодня в ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  if (diffDays === 1) {
    return `вчера в ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}
