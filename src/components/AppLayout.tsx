import { PropsWithChildren } from "react";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="mt-0 sm:mx-auto sm:mt-4 sm:max-w-xl">
      <div className="">{children}</div>
    </div>
  );
}
