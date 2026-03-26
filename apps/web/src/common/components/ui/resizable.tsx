'use client';

import * as React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { cn } from '@/common/lib/utils';

type ResizablePanelGroupProps = Omit<React.ComponentProps<typeof Group>, 'orientation'> & {
  direction: 'horizontal' | 'vertical';
};

function ResizablePanelGroup({
  className,
  direction,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <Group
      className={cn('flex h-full w-full', className)}
      orientation={direction}
      {...props}
    />
  );
}

const ResizablePanel = Panel;

function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(
        'relative flex w-[4px] items-center justify-center bg-border transition-colors hover:bg-primary data-[resize-handle-active]:bg-primary cursor-col-resize',
        className,
      )}
      {...props}
    />
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
