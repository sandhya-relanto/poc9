/**
 * Extracts and parses the hidden [INTEL: ...] metadata from a bot message.
 */
export function extractIntel(text: string) {
  const intelMatch = text.match(/\[INTEL:\s*(.*?)\]/);
  if (intelMatch) {
    try {
      return JSON.parse(intelMatch[1]);
    } catch (e) {
      console.error("Failed to parse message intel:", e);
      return null;
    }
  }
  return null;
}

/**
 * Removes the hidden [INTEL: ...] metadata block from a bot message for clean display.
 */
export function cleanBotMessage(text: string): string {
  return text.replace(/\[INTEL:.*?\]/g, '').trim();
}
