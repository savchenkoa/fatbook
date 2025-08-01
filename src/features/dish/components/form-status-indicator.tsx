import { LucideCheck, LucideX } from "lucide-react";

type Props = {
  isPending: boolean;
  success: boolean;
  error: string;
};

// TODO: use context
export function FormStatusIndicator({ isPending, success, error }: Props) {
  if (isPending) {
    return (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    );
  }

  if (error) {
    return (
      <span className="text-red-500">
        <LucideX />
      </span>
    );
  }

  if (success) {
    return (
      <span className="text-green-500">
        <LucideCheck />
      </span>
    );
  }

  return null;
}
