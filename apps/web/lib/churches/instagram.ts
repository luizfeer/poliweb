export function formatInstagramHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

export function getInstagramUrl(value: string): string {
  return `https://www.instagram.com/${formatInstagramHandle(value)}`;
}
