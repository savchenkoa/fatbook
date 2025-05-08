type Props = {
  value?: number | null;
};
export const FoodWeight = ({ value }: Props) => {
  if (!value) {
    return null;
  }

  return <strong className="text-xs">⚖️ {value} g.</strong>;
};
