type Props = {
    message: string;
};

export function EmptyState({ message }: Props) {
    return (
        <div className="mt-6 flex flex-col items-center gap-4">
            <span className="text-5xl">🤷‍♂️</span>
            <p className="text-sm">{message}</p>
        </div>
    );
}
