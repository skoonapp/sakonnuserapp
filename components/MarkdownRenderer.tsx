
import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  // Split by markdown delimiters, keeping the delimiters
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);

  const renderedParts = parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });

  return <>{renderedParts}</>;
};

export default React.memo(MarkdownRenderer);
