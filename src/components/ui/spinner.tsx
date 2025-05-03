import { Loader2 } from "lucide-react";

type Props = {
  loading?: boolean;
};
export function Spinner({ loading }: Props) {
  if (!loading) {
    return null;
  }
  return <Loader2 className="animate-spin" />;
}
