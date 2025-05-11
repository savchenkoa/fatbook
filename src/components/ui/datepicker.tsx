import { forwardRef } from "react";
import ReactDatePicker, { DatePickerProps } from "react-datepicker";
import { Input } from "@/components/ui/input.tsx";
import { LucideCalendar } from "lucide-react";

type Props = {
  width: number;
  withIcon?: boolean;
} & DatePickerProps;

export function Datepicker({ width, withIcon, ...props }: Props) {
  const ExampleCustomInput = forwardRef<any, any>(({ value, onClick }, ref) => (
    <div className="relative">
      <Input
        className="pr-5"
        style={{ width: width }}
        defaultValue={value}
        onClick={onClick}
        ref={ref}
        readOnly={true}
      />
      {withIcon && (
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 transform text-slate-500">
          <LucideCalendar />
        </span>
      )}
    </div>
  ));

  return (
    <ReactDatePicker
      customInput={<ExampleCustomInput />}
      withPortal
      dateFormat="dd MMM yyyy"
      {...props}
    />
  );
}
