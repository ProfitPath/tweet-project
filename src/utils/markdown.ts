// Simple markdown formatting for terminal display
// In a full implementation, you would use marked + marked-terminal

export function formatMarkdown(text: string): string {
  // For now, return the text as-is
  // The marked-terminal library would handle this in a production setup
  return text
    // Bold: **text** -> text (styled)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Italic: *text* -> text
    .replace(/\*(.+?)\*/g, '$1')
    // Inline code: `code` -> code
    .replace(/`([^`]+)`/g, '$1')
    // Headers: # Header -> HEADER
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Bullet points
    .replace(/^[-*]\s+/gm, '  • ');
}

export function highlightCode(code: string, language?: string): string {
  // Placeholder for syntax highlighting
  // In production, use a library like highlight.js or prism
  return code;
}

export function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
