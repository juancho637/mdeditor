'use client';

import type { ReactNode, Ref } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/common/components/ui/resizable';

interface SplitViewProps {
  editorContent: ReactNode;
  previewContent: ReactNode;
  previewRef?: Ref<HTMLDivElement>;
}

export function SplitView({ editorContent, previewContent, previewRef }: SplitViewProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full overflow-hidden">{editorContent}</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <div ref={previewRef} className="h-full overflow-y-auto" data-testid="preview-scroll">{previewContent}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
