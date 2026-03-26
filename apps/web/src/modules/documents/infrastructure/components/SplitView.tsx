'use client';

import type { ReactNode } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/common/components/ui/resizable';

interface SplitViewProps {
  editorContent: ReactNode;
  previewContent: ReactNode;
}

export function SplitView({ editorContent, previewContent }: SplitViewProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full overflow-hidden">{editorContent}</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full overflow-y-auto">{previewContent}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
