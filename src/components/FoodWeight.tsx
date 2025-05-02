type Props = {
  value?: number | null;
};
export const FoodWeight = ({ value }: Props) => {
  if (!value) {
    return (
      <strong className="has-text-dark-on-scheme is-size-7">per 100 g.</strong>
    );
  }

  return (
    <strong className="has-text-dark-on-scheme is-size-7">⚖️ {value} g.</strong>
  );
};
