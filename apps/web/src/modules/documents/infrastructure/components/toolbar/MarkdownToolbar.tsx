'use client';

import type { EditorView } from '@codemirror/view';
import {
  Heading,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Link,
  Image,
  Code,
  Table,
  Quote,
  Minus,
} from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/common/components/ui/tooltip';
import { Separator } from '@/common/components/ui/separator';
import { ToolbarAction } from '../../../domain/enums/toolbar-actions.enum';
import { executeToolbarAction } from './toolbar-actions';
import { HeaderDropdown } from './HeaderDropdown';
import { LinkPopover } from './LinkPopover';
import { TableDropdown } from './TableDropdown';

interface ToolbarButtonConfig {
  action: ToolbarAction;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  type: 'simple' | 'header' | 'link' | 'table' | 'image';
}

const TOOLBAR_GROUPS: ToolbarButtonConfig[][] = [
  // Text group
  [
    {
      action: ToolbarAction.HEADING_1,
      icon: Heading,
      label: 'Encabezado',
      type: 'header',
    },
    {
      action: ToolbarAction.BOLD,
      icon: Bold,
      label: 'Negrita',
      shortcut: 'Ctrl+B',
      type: 'simple',
    },
    {
      action: ToolbarAction.ITALIC,
      icon: Italic,
      label: 'Cursiva',
      shortcut: 'Ctrl+I',
      type: 'simple',
    },
    {
      action: ToolbarAction.STRIKETHROUGH,
      icon: Strikethrough,
      label: 'Tachado',
      shortcut: 'Ctrl+Shift+S',
      type: 'simple',
    },
  ],
  // Lists group
  [
    {
      action: ToolbarAction.BULLET_LIST,
      icon: List,
      label: 'Lista',
      type: 'simple',
    },
    {
      action: ToolbarAction.NUMBERED_LIST,
      icon: ListOrdered,
      label: 'Lista numerada',
      type: 'simple',
    },
    {
      action: ToolbarAction.CHECKLIST,
      icon: ListChecks,
      label: 'Checklist',
      type: 'simple',
    },
  ],
  // Insert group
  [
    {
      action: ToolbarAction.LINK,
      icon: Link,
      label: 'Enlace',
      shortcut: 'Ctrl+K',
      type: 'link',
    },
    {
      action: ToolbarAction.IMAGE,
      icon: Image,
      label: 'Imagen',
      type: 'image',
    },
    {
      action: ToolbarAction.CODE,
      icon: Code,
      label: 'Código',
      shortcut: 'Ctrl+E',
      type: 'simple',
    },
    { action: ToolbarAction.TABLE, icon: Table, label: 'Tabla', type: 'table' },
  ],
  // Block group
  [
    {
      action: ToolbarAction.BLOCKQUOTE,
      icon: Quote,
      label: 'Cita',
      type: 'simple',
    },
    {
      action: ToolbarAction.HORIZONTAL_RULE,
      icon: Minus,
      label: 'Línea horizontal',
      type: 'simple',
    },
  ],
];

interface MarkdownToolbarProps {
  editorView: EditorView | null;
}

const BUTTON_CLASS =
  'p-0 text-muted-foreground hover:bg-muted hover:text-foreground active:bg-primary/10 active:text-primary min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-7 md:w-8';

function ToolbarBtn({
  config,
  editorView,
}: {
  config: ToolbarButtonConfig;
  editorView: EditorView | null;
}) {
  const { icon: Icon, label, shortcut, type } = config;
  const tooltipLabel = shortcut ? `${label} (${shortcut})` : label;
  const disabled = !editorView;

  const btn = (
    <Button
      variant="ghost"
      className={BUTTON_CLASS}
      disabled={disabled}
      onClick={
        type === 'simple' || type === 'image'
          ? () => {
              if (editorView) executeToolbarAction(editorView, config.action);
            }
          : undefined
      }
      data-testid={`toolbar-${config.action}`}
    >
      <Icon className="size-4" />
    </Button>
  );

  const wrapWithDropdown = (children: React.ReactNode) => {
    switch (type) {
      case 'header':
        return (
          <HeaderDropdown editorView={editorView}>{children}</HeaderDropdown>
        );
      case 'link':
        return <LinkPopover editorView={editorView}>{children}</LinkPopover>;
      case 'table':
        return (
          <TableDropdown editorView={editorView}>{children}</TableDropdown>
        );
      default:
        return children;
    }
  };

  const hasDropdown = type === 'header' || type === 'link' || type === 'table';

  return (
    <Tooltip key={config.action}>
      {hasDropdown ? (
        wrapWithDropdown(<TooltipTrigger asChild>{btn}</TooltipTrigger>)
      ) : (
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
      )}
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

export function MarkdownToolbar({ editorView }: MarkdownToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="bg-secondary border-border flex items-center px-2 gap-1 overflow-x-auto fixed bottom-0 left-0 right-0 z-40 h-11 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:h-10 md:border-b md:border-t-0"
        data-testid="markdown-toolbar"
        role="toolbar"
        aria-label="Markdown formatting"
      >
        {TOOLBAR_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="flex items-center gap-0.5">
            {groupIdx > 0 && (
              <Separator orientation="vertical" className="mx-1 h-5" />
            )}
            {group.map((config) => (
              <ToolbarBtn
                key={config.action}
                config={config}
                editorView={editorView}
              />
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
