import { useState } from "react";
import { LucideCalendar } from "lucide-react";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { formatDate, isToday, isYesterday } from "@/utils/date-utils.ts";
import { Button } from "@/components/ui/button.tsx";

const getLabel = (day: Date) => {
  let prefix = "";
  if (isToday(day)) {
    prefix = `Today`;
  } else if (isYesterday(day)) {
    prefix = `Yesterday`;
  }

  const formattedDate = formatDate(day, "DD MMM");

  return prefix ? `${prefix}, ${formattedDate}` : formattedDate;
};

type Props = {
  value: Date;
  onSelect: (date: Date) => void;
};

export function Datepicker({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  const handleSelection = (day: Date | undefined) => {
    if (day) {
      onSelect(day);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background/50 px-8!">
          {getLabel(value)} <LucideCalendar className="stroke-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelection}
          className="mt-4"
          disabled={{ after: new Date() }}
        />
      </DialogContent>
    </Dialog>
  );
}
