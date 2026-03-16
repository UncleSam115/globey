import { ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSwitcherProps {
  activeDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
  origin: string;
  destination: string;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function isPast(dateStr: string): boolean {
  return dateStr < new Date().toISOString().split("T")[0];
}

export function DateSwitcher({ activeDate, onDateChange, isLoading, origin, destination }: DateSwitcherProps) {
  const prevDate = shiftDate(activeDate, -1);
  const nextDate = shiftDate(activeDate, 1);
  const canGoPrev = !isPast(prevDate);

  return (
    <div className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded-2xl" data-testid="date-switcher">
      <button
        type="button"
        onClick={() => canGoPrev && onDateChange(prevDate)}
        disabled={!canGoPrev || isLoading}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0",
          canGoPrev && !isLoading
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted text-muted-foreground/30 cursor-not-allowed"
        )}
        data-testid="button-date-prev"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 text-center min-w-0">
        <div className="flex items-center justify-center gap-1.5">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Calendar className="w-4 h-4 text-primary" />
          )}
          <span className="font-bold text-sm text-foreground" data-testid="text-active-date">
            {formatDisplayDate(activeDate)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5" data-testid="text-route">
          {origin} → {destination}
        </div>
      </div>

      <button
        type="button"
        onClick={() => !isLoading && onDateChange(nextDate)}
        disabled={isLoading}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0",
          !isLoading
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted text-muted-foreground/30 cursor-not-allowed"
        )}
        data-testid="button-date-next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
