type Props = {
  value?: number | null;
};
export const FoodWeight = ({ value }: Props) => {
  if (!value) {
    return <strong className="text-xs">per 100 g.</strong>;
  }

  return <strong className="text-xs">⚖️ {value} g.</strong>;
};
