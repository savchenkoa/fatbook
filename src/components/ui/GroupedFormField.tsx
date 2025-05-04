import { HTMLAttributes, PropsWithChildren } from "react";
import { clsx } from "clsx";

type Props = {
  align?: "left" | "centered" | "right";
} & HTMLAttributes<HTMLDivElement>;

// https://bulma.io/documentation/form/general/
export function GroupedFormField({
  align,
  children,
  className,
  ...divProps
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        "field is-grouped",
        {
          ["is-grouped-" + align]: align,
        },
        className,
      )}
      {...divProps}
    >
      {children}
    </div>
  );
}
