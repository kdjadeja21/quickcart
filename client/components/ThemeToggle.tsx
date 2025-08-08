import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  onChanged?: () => void;
}

export function ThemeToggle({ onChanged }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const currentTheme = themeOptions.find(option => option.value === theme);
  const Icon = currentTheme?.icon || Monitor;

  return (
    <Select
      value={theme}
      onValueChange={(value: 'light' | 'dark' | 'system') => {
        setTheme(value);
        onChanged?.();
      }}
    >
      <SelectTrigger className="w-full sm:w-24">
        <div className="flex items-center gap-2">
          {/* <Icon className="h-4 w-4" /> */}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {themeOptions.map(({ value, label, icon: IconComponent }) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
