import React, { useEffect, useState } from "react";
import { IWidget, TCustomFields } from "../../../common/types/manifest";
import { getManifestFromPath } from "../../../common";
import {
  Body1Strong,
  Link,
  MenuItem,
  MenuList,
  SearchBox,
  Spinner,
  Text,
} from "@fluentui/react-components";
import { Location } from "../../../common/types/variables";
import { commands } from "../../../common/commands";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { emitTo } from "@tauri-apps/api/event";
import { cloneDeep } from "lodash";

interface WeatherCityProps {
  manifestPath: string;
  manifestKey: string;
}

const writeAndEmit = async (
  path: string,
  key: string,
  manifest: Omit<IWidget, "path">,
) => {
  await writeTextFile(path, JSON.stringify(manifest, null, 2));
  const widgetLabel = `widget-${key}`;
  await emitTo(widgetLabel, "update-manifest", 1);
};

const WeatherCity: React.FC<WeatherCityProps> = ({
  manifestKey,
  manifestPath,
}) => {
  const [manifest, setManifest] = useState<Omit<IWidget, "path"> | null>(null);
  const [weatherCity, setWeatherCity] = useState<TCustomFields[""] | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const cancelRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const manifest = await getManifestFromPath(manifestPath);
        setManifest(manifest);
        const city = manifest.customFields?.weatherCity;
        if (city) {
          setWeatherCity(city);
        }
      } catch (error) {
        console.error(error);
      }
    };
    init();
  }, [manifestPath]);

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
    if (!manifest) return;

    const data: typeof weatherCity = {
      key: "weatherCity",
      value: `${result.lat},${result.lon}`,
      label: "Weather City Location",
      description: [result.name, result.region, result.country]
        .filter(Boolean)
        .join(", "),
    };
    if (!manifest.customFields) {
      manifest.customFields = {};
    }
    manifest.customFields.weatherCity = data;
    await writeAndEmit(manifestPath, manifestKey, manifest);
    setManifest(cloneDeep(manifest));
    setWeatherCity(data);
  };

  const reset = async () => {
    if (
      !manifest ||
      !manifest.customFields ||
      !manifest.customFields.weatherCity
    )
      return;

    delete manifest.customFields.weatherCity;
    await writeAndEmit(manifestPath, manifestKey, manifest);
    setManifest(cloneDeep(manifest));
    setWeatherCity(null);
  };

  return (
    <div>
      <Body1Strong>Location</Body1Strong>
      <div style={{ margin: "8px 0" }}>
        <Text>
          Selected:{" "}
          {weatherCity?.description || weatherCity?.value || "Automatic"}
          {weatherCity && (
            <Link as="button" onClick={reset} style={{ marginLeft: 10 }}>
              Reset
            </Link>
          )}
        </Text>
      </div>
      <div>
        <SearchBox
          placeholder="Search city"
          value={query}
          onChange={(_, { value }) => {
            setQuery(value);
          }}
        />
        <MenuList
          style={{
            height: 150,
            overflow: "auto",
            padding: 5,
          }}
          aria-label="Search results">
          {isLoading ? (
            <MenuItem disabled>
              <Spinner
                size="tiny"
                label="Loading results…"
                labelPosition="after"
              />
            </MenuItem>
          ) : results.length > 0 ? (
            results.map((result) => (
              <MenuItem
                key={result.id}
                role="option"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => handleSelect(result)}>
                {result.name}
              </MenuItem>
            ))
          ) : (
            query && <MenuItem disabled>No results found</MenuItem>
          )}
        </MenuList>
      </div>
    </div>
  );
};

export default WeatherCity;
