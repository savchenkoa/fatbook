import { LuCircleSlash } from "react-icons/lu";

type Props = {
  message: string;
};

export function EmptyState({ message }: Props) {
  return (
    <div className="mt-6 flex flex-col items-center gap-1">
      <LuCircleSlash className="text-xl text-slate-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
