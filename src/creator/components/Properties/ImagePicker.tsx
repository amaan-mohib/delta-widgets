import { Button, Input, Tooltip } from "@fluentui/react-components";
import { nanoid } from "nanoid";
import React from "react";
import { DeleteRegular, DocumentRegular } from "@fluentui/react-icons";
import { browseImage } from "../../utils";
import { ICustomAssets } from "../../../common/types/manifest";
interface ImagePickerProps {
  setImage: (data: ICustomAssets | null) => void;
  imageData: ICustomAssets | null;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ setImage, imageData }) => {
  const pickImage = async () => {
    const data = await browseImage();
    if (data) {
      setImage(data);
    }
  };

  if (imageData?.kind === "file") {
    return (
      <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
        <Button disabled size="small">
          {imageData.path.split(/\/|\\/).at(-1)}
        </Button>
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
        size="small"
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
          onClick={pickImage}
          size="small"
          appearance="outline"
          icon={<DocumentRegular style={{ fontSize: "16px" }} />}
        />
      </Tooltip>
    </div>
  );
};

export default ImagePicker;
