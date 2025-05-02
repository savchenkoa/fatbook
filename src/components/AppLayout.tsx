import { PropsWithChildren } from "react";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto mt-0 sm:mt-4 sm:max-w-xl">
      <div className="">{children}</div>
    </div>
  );
}
