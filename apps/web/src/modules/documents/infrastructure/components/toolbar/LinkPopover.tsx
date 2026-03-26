'use client';

import { useState } from 'react';
import type { EditorView } from '@codemirror/view';
import { Popover, PopoverTrigger, PopoverContent } from '@/common/components/ui/popover';
import { Input } from '@/common/components/ui/input';
import { Button } from '@/common/components/ui/button';
import { ToolbarAction } from '../../../domain/enums/toolbar-actions.enum';
import { executeToolbarAction } from './toolbar-actions';

interface LinkPopoverProps {
  editorView: EditorView | null;
  children: React.ReactNode;
}

export function LinkPopover({ editorView, children }: LinkPopoverProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  const handleInsert = () => {
    if (editorView && url.trim()) {
      executeToolbarAction(editorView, ToolbarAction.LINK, { url: url.trim() });
      setUrl('');
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInsert();
    }
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setUrl('');
    }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start" data-testid="link-popover">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">URL</label>
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="link-url-input"
          />
          <Button
            size="sm"
            onClick={handleInsert}
            disabled={!url.trim()}
            data-testid="link-insert-btn"
          >
            Insertar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
