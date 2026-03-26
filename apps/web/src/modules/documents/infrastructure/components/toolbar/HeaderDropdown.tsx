'use client';

import type { EditorView } from '@codemirror/view';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/common/components/ui/dropdown-menu';
import { ToolbarAction } from '../../../domain/enums/toolbar-actions.enum';
import { executeToolbarAction } from './toolbar-actions';

const HEADING_OPTIONS = [
  { action: ToolbarAction.HEADING_1, label: 'Heading 1', icon: Heading1 },
  { action: ToolbarAction.HEADING_2, label: 'Heading 2', icon: Heading2 },
  { action: ToolbarAction.HEADING_3, label: 'Heading 3', icon: Heading3 },
  { action: ToolbarAction.HEADING_4, label: 'Heading 4', icon: Heading4 },
  { action: ToolbarAction.HEADING_5, label: 'Heading 5', icon: Heading5 },
  { action: ToolbarAction.HEADING_6, label: 'Heading 6', icon: Heading6 },
] as const;

interface HeaderDropdownProps {
  editorView: EditorView | null;
  children: React.ReactNode;
}

export function HeaderDropdown({ editorView, children }: HeaderDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-testid="header-dropdown">
        {HEADING_OPTIONS.map(({ action, label, icon: Icon }) => (
          <DropdownMenuItem
            key={action}
            data-testid={`header-${action}`}
            onSelect={() => {
              if (editorView) executeToolbarAction(editorView, action);
            }}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
