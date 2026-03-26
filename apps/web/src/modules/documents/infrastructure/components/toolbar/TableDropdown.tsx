'use client';

import { useState, useCallback } from 'react';
import type { EditorView } from '@codemirror/view';
import { Popover, PopoverTrigger, PopoverContent } from '@/common/components/ui/popover';
import { ToolbarAction } from '../../../domain/enums/toolbar-actions.enum';
import { executeToolbarAction } from './toolbar-actions';

const MAX_ROWS = 6;
const MAX_COLS = 6;

interface TableDropdownProps {
  editorView: EditorView | null;
  children: React.ReactNode;
}

export function TableDropdown({ editorView, children }: TableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  const handleSelect = useCallback(
    (rows: number, cols: number) => {
      if (editorView) {
        executeToolbarAction(editorView, ToolbarAction.TABLE, {
          rows: String(rows),
          cols: String(cols),
        });
        setOpen(false);
      }
    },
    [editorView],
  );

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) { setHoverRow(0); setHoverCol(0); }
    }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" data-testid="table-dropdown">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground mb-1">
            {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : 'Seleccionar tamaño'}
          </span>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}>
            {Array.from({ length: MAX_ROWS }, (_, r) =>
              Array.from({ length: MAX_COLS }, (_, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`w-5 h-5 border rounded-sm transition-colors ${
                    r < hoverRow && c < hoverCol
                      ? 'bg-primary/20 border-primary'
                      : 'bg-muted border-border'
                  }`}
                  onMouseEnter={() => {
                    setHoverRow(r + 1);
                    setHoverCol(c + 1);
                  }}
                  onClick={() => handleSelect(r + 1, c + 1)}
                  data-testid={`table-cell-${r}-${c}`}
                />
              )),
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
