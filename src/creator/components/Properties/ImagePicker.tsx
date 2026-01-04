import { Button, Input, Tooltip } from "@fluentui/react-components";
import { nanoid } from "nanoid";
import React from "react";
import { fileOrFolderPicker } from "../../../main/utils/widgets";
import { DeleteRegular, DocumentRegular } from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";

interface IImageData {
  key: string;
  kind: "file" | "url";
  path: string;
  type: "image";
}
interface ImagePickerProps {
  setImage: (data: IImageData | null) => void;
  imageData: IImageData | null;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ setImage, imageData }) => {
  const browseImage = async () => {
    const { path } = await fileOrFolderPicker({
      title: "Select Image",
      extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
      validate: false,
    });
    if (path) {
      const key = `${nanoid()}.${path.split(".").at(-1)}`;
      await invoke("copy_custom_assets", {
        key,
        path,
      });
      setImage({
        key,
        kind: "file",
        path,
        type: "image",
      });
    }
  };

  if (imageData?.kind === "file") {
    return (
      <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
        <Button disabled>{imageData.path.split(/\/|\\/).at(-1)}</Button>
        <Tooltip
          content="Remove"
          relationship="label"
          positioning={"above-end"}
          withArrow>
          <Button
            onClick={() => {
              setImage(null);
            }}
            size="small"
            appearance="outline"
            icon={<DeleteRegular style={{ fontSize: "16px" }} />}
          />
        </Tooltip>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
      <Input
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        style={{ width: "140px" }}
        placeholder={"Enter a URL"}
        onChange={(_, { value }) => {
          if (!value) {
            setImage(null);
            return;
          }
          setImage({
            key: `${nanoid()}.image`,
            kind: "url",
            path: value || "",
            type: "image",
          });
        }}
        value={imageData?.kind === "url" ? imageData.path : ""}
      />
      <Tooltip
        content="Browse"
        relationship="label"
        positioning={"above-end"}
        withArrow>
        <Button
          onClick={browseImage}
          size="small"
          appearance="outline"
          icon={<DocumentRegular style={{ fontSize: "16px" }} />}
        />
      </Tooltip>
    </div>
  );
};

export default ImagePicker;
