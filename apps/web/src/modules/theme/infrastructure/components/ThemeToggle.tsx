'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/common/components/ui/tooltip';
import { useThemeStore } from '../state/theme.state';
import { Theme } from '../../domain';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === Theme.DARK;

  return (
    <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
          data-testid="theme-toggle"
          aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Cambiar tema</TooltipContent>
    </Tooltip>
    </TooltipProvider>
  );
}
