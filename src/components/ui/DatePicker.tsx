import { forwardRef } from "react";
import ReactDatePicker, { DatePickerProps } from "react-datepicker";
import { FaCalendar } from "react-icons/fa";

type Props = {
  width: number;
  withIcon?: boolean;
} & DatePickerProps;

export function DatePicker({ width, withIcon, ...props }: Props) {
  const ExampleCustomInput = forwardRef<any, any>(({ value, onClick }, ref) => (
    <div className="field">
      <p className={"control" + (withIcon && " has-icons-right")}>
        <input
          className="input"
          style={{ width: width }}
          defaultValue={value}
          onClick={onClick}
          ref={ref}
          readOnly={true}
        />
        {withIcon && (
          <span className="icon is-small is-right">
            <FaCalendar />
          </span>
        )}
      </p>
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
