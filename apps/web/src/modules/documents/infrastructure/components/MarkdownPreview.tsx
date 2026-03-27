'use client';

import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { remarkSourceLines } from './remark-source-lines';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview = forwardRef<HTMLDivElement, MarkdownPreviewProps>(
  function MarkdownPreview({ content }, ref) {
    return (
      <div ref={ref} className="prose-container flex-1 overflow-y-auto">
        <article className="prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkSourceLines]}
            rehypePlugins={[rehypeHighlight]}
            skipHtml
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    );
  },
);
