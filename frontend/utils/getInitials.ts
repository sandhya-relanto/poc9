/**
 * Fallback utility to generate initials from a name if they are missing.
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return "AI";
  
  const cleanName = name.replace(/[\[\]]/g, '').trim();
  const parts = cleanName.split(/\s+/);
  
  if (parts.length === 0) return "AI";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
