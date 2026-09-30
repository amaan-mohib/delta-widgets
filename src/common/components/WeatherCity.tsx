import React, { useEffect, useState } from "react";
import {
  Body1Strong,
  Link,
  MenuItem,
  MenuList,
  SearchBox,
  Spinner,
  Text,
} from "@fluentui/react-components";
import { Location } from "../types/variables";
import { commands } from "../commands";
import { TCustomFields } from "../types/manifest";

export type WeatherCityValue = TCustomFields[string];

export interface WeatherCityProps {
  weatherCity?: WeatherCityValue | null;
  onSelect: (value: WeatherCityValue) => void | Promise<void>;
  onReset: () => void | Promise<void>;
}

const WeatherCity: React.FC<WeatherCityProps> = ({
  weatherCity,
  onSelect,
  onReset,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cancelRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const debounceTimer = setTimeout(() => {
      let cancelled = false;
      commands.searchCity({ city: query.trim() }).then((data) => {
        if (!cancelled) {
          setResults(data);
          setIsLoading(false);
        }
      });

      cancelRef.current = () => {
        cancelled = true;
      };
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, [query]);

  const handleSelect = async (result: Location) => {
    await onSelect({
      key: "weatherCity",
      value: `${result.lat},${result.lon}`,
      label: "Weather City Location",
      description: [result.name, result.region, result.country]
        .filter(Boolean)
        .join(", "),
    });
  };

  return (
    <div>
      <Body1Strong>Location</Body1Strong>
      <div style={{ margin: "8px 0" }}>
        <Text>
          Selected:{" "}
          {weatherCity?.description || weatherCity?.value || "Automatic"}
          {weatherCity && (
            <Link as="button" onClick={onReset} style={{ marginLeft: 10 }}>
              Reset
            </Link>
          )}
        </Text>
      </div>
      <SearchBox
        placeholder="Search city"
        value={query}
        onChange={(_, { value }) => setQuery(value)}
      />
      <MenuList
        style={{ height: 150, overflow: "auto", padding: 5 }}
        aria-label="Search results">
        {isLoading ? (
          <MenuItem disabled>
            <Spinner
              size="tiny"
              label="Loading results..."
              labelPosition="after"
            />
          </MenuItem>
        ) : results.length > 0 ? (
          results.map((result) => (
            <MenuItem
              key={result.id}
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(result)}>
              {result.name}
            </MenuItem>
          ))
        ) : (
          query && <MenuItem disabled>No results found</MenuItem>
        )}
      </MenuList>
    </div>
  );
};

export default WeatherCity;
