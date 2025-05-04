import { ChangeEvent, useRef, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { Form } from "react-router-dom";
import { Input } from "@/components/ui/input.tsx";

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
            <FaSearch />
          </span>
          {query && (
            <span
              className="absolute top-1/2 right-4 -translate-y-1/2 transform cursor-pointer"
              onClick={handleClearClick}
            >
              <FaTimes />
            </span>
          )}
        </div>
      </Form>
    </div>
  );
}
