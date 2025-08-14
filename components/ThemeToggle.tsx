import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  onChanged?: () => void;
}

export function ThemeToggle({ onChanged }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    onChanged?.();
  };

  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-pressed={isDark}
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={handleToggle}
      className="relative"
    >
      <span className="relative block h-4 w-4">
        <Sun
          className={
            `absolute inset-0 h-4 w-4 transition-all duration-300 ${
              isDark
                ? 'opacity-0 scale-75 -rotate-90'
                : 'opacity-100 scale-100 rotate-0'
            }`
          }
        />
        <Moon
          className={
            `absolute inset-0 h-4 w-4 transition-all duration-300 ${
              isDark
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-75 rotate-90'
            }`
          }
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
