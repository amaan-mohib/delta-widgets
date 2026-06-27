import { UITool, UIToolInvocation } from "ai";
import React, { useEffect, useState } from "react";
import { Caption1, Card, CardHeader, Text } from "@fluentui/react-components";
import { Buffer } from "buffer";
import { IMedia, useChatStore } from "../stores/useChatStore";

interface MediaToolOutputProps {
  part: {
    type: `tool-${string}`;
  } & UIToolInvocation<UITool>;
}

const MediaToolOutput: React.FC<MediaToolOutputProps> = ({ part }) => {
  const { getMediaMetadata } = useChatStore();
  const [mediaMetadata, setMediaMetadata] = useState<IMedia | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if ((part.input as any)?.intent !== "top_media" || !part.output) return;

    const media = Array.isArray(part.output) ? part.output[0] : null;
    if (!media) {
      return;
    }

    getMediaMetadata(media.id)
      .then((m) => {
        setMediaMetadata(m);
        setTotal((part.output as any[])?.length || 0);
      })
      .catch(console.error);
  }, [part]);

  if (
    part.state !== "output-available" ||
    (part.input as any)?.intent !== "top_media" ||
    !mediaMetadata
  ) {
    return null;
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <Card appearance="outline">
        <CardHeader
          image={
            mediaMetadata.thumbnail && mediaMetadata.thumbnail.length > 0 ? (
              <img
                style={{ width: 80 }}
                src={`data:image/png;base64,${Buffer.from(
                  mediaMetadata.thumbnail,
                ).toString("base64")}`}
                alt={mediaMetadata.title}
              />
            ) : undefined
          }
          header={
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text as="h5" weight="semibold" style={{ margin: 0 }}>
                {mediaMetadata.title}
              </Text>
              {mediaMetadata.album && (
                <Caption1>{mediaMetadata.album}</Caption1>
              )}
              <Caption1>{mediaMetadata.artist}</Caption1>
            </div>
          }
        />
      </Card>
      {total > 1 ? (
        <div style={{ textAlign: "right" }}>{`+${total - 1} more`}</div>
      ) : null}
    </div>
  );
};

export default MediaToolOutput;
