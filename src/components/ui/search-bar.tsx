import { ChangeEvent, useRef, useState } from "react";
import { Form } from "react-router-dom";
import { Input } from "@/components/ui/input.tsx";
import { LucideSearch, LucideX } from "lucide-react";

type Props = {
    defaultValue?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function SearchBar({ defaultValue, onChange }: Props) {
    const timeout = useRef<NodeJS.Timeout>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(defaultValue ?? "");

    const handleChange = (event) => {
        setQuery(event.target.value);
        if (event.target.value.length > 2 || event.target.value.length === 0) {
            //Clear the previous timeout.
            clearTimeout(timeout.current);

            timeout.current = setTimeout(() => {
                onChange(event);
            }, 400);
        }
    };

    const handleClearClick = (event) => {
        setQuery("");
        onChange(event);
        inputRef.current?.focus();
    };

    return (
        <div id="search-form" role="search">
            <Form onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                    <Input
                        ref={inputRef}
                        id="q"
                        name="q"
                        value={query}
                        type="search"
                        placeholder="Search dish"
                        className="px-12"
                        onChange={handleChange}
                        data-testid="searchBarInput"
                    />
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 transform">
                        <LucideSearch />
                    </span>
                    {query && (
                        <span
                            className="absolute top-1/2 right-4 size-8 -translate-y-1/2 transform cursor-pointer p-2"
                            onClick={handleClearClick}
                        >
                            <LucideX />
                        </span>
                    )}
                </div>
            </Form>
        </div>
    );
}
