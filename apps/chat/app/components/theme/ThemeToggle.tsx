import {
  IconDeviceDesktop,
  IconMoon,
  IconSun,
  type Icon,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const THEME_ORDER: ThemeChoice[] = ["light", "dark", "system"];

const THEME_ICONS: Record<ThemeChoice, Icon> = {
  light: IconSun,
  dark: IconMoon,
  system: IconDeviceDesktop,
};

const THEME_LABELS: Record<ThemeChoice, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

function normalizeTheme(theme: string | undefined): ThemeChoice {
  return theme === "light" || theme === "dark" ? theme : "system";
}

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-8" aria-hidden />;

  const current = normalizeTheme(theme);

  if (collapsed) {
    const Icon = THEME_ICONS[current];
    const next =
      THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
    const label = `Theme: ${current} - click to change`;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={label}
            onClick={() => setTheme(next)}
          >
            <Icon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={current}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      className={cn("w-full")}
    >
      {THEME_ORDER.map((choice) => {
        const Icon = THEME_ICONS[choice];
        return (
          <Tooltip key={choice}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={choice}
                aria-label={THEME_LABELS[choice]}
                className="flex-1"
              >
                <Icon className="size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="top">{THEME_LABELS[choice]}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
