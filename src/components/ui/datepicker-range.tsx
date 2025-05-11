import { useState } from "react";
import { LucideCalendar } from "lucide-react";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { formatDate } from "@/utils/date-utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils.ts";

const getLabel = (range: DateRange) => {
  const formattedFrom = formatDate(range.from, "DD MMM");
  const formattedTo = formatDate(range.to, "DD MMM");

  return `${formattedFrom} - ${formattedTo}`;
};

type Props = {
  range: DateRange;
  onSelect: (range: DateRange) => void;
  className?: string;
};

export function DatepickerRange({ range, onSelect, className }: Props) {
  const [open, setOpen] = useState(false);

  const handleSelection = (dateRange: DateRange | undefined) => {
    onSelect(dateRange!);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn("bg-background/50 px-8!", className)}
        >
          {getLabel(range)} <LucideCalendar className="stroke-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center justify-center">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelection}
          className="mt-4"
          disabled={{ after: new Date() }}
        />
        <Button onClick={() => setOpen(false)}>Select</Button>
      </DialogContent>
    </Dialog>
  );
}
