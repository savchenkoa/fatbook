import { HTMLAttributes, PropsWithChildren } from "react";
import { clsx } from "clsx";

type Props = {
  label?: string;
} & HTMLAttributes<HTMLDivElement>;

// https://bulma.io/documentation/form/general/
export function FormField({
  label,
  children,
  className,
  ...divProps
}: PropsWithChildren<Props>) {
  return (
    <div className={clsx("field", className)} {...divProps}>
      {label && <label className="label">{label}</label>}
      <div className="control">{children}</div>
    </div>
  );
}
