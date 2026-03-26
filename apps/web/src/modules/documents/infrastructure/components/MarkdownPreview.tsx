'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import DOMPurify from 'dompurify';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const sanitized = typeof window !== 'undefined'
    ? DOMPurify.sanitize(content)
    : content;

  return (
    <div className="prose-container flex-1 overflow-y-auto">
      <article className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {sanitized}
        </ReactMarkdown>
      </article>
    </div>
  );
}
