import React from 'react';

/**
 * Highlights sales-related keywords in bot messages with an amber styling.
 */
export function highlightKeywords(text: string) {
  const keywords = [
    'demo', 'trial', 'pricing', 'roi', 'close', 'discount', 'contract', 
    'implementation', 'budget', 'authority', 'timeline', 'decision', 
    'priority', 'value', 'benefit', 'feature', 'competitor', 'onboarding'
  ];

  if (!text) return text;

  // Create regex pattern for all keywords (case insensitive, whole word)
  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  
  const parts = text.split(pattern);
  
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <span key={i} className="text-[#D6C2A8] font-black underline decoration-[#D6C2A8]/30">
            {part}
          </span>
        ) : (
          part
        );
      })}
    </>
  );
}
