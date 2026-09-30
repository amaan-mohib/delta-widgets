import React, { useEffect, useState } from "react";
import { IWidget } from "../../../common/types/manifest";
import { getManifestFromPath } from "../../../common";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { emitTo } from "@tauri-apps/api/event";
import { cloneDeep } from "lodash";
import WeatherCityControl, {
  WeatherCityValue,
} from "../../../common/components/WeatherCity";

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
  const [weatherCity, setWeatherCity] = useState<WeatherCityValue | null>(null);

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

  const handleSelect = async (data: WeatherCityValue) => {
    if (!manifest) return;
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
    ) {
      return;
    }

    delete manifest.customFields.weatherCity;
    await writeAndEmit(manifestPath, manifestKey, manifest);
    setManifest(cloneDeep(manifest));
    setWeatherCity(null);
  };

  return (
    <WeatherCityControl
      weatherCity={weatherCity}
      onSelect={handleSelect}
      onReset={reset}
    />
  );
};

export default WeatherCity;
