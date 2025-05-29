import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Field,
  makeStyles,
  SpinButton,
  typographyStyles,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { spinButtonOnChange } from "../../utils";
import {
  IUpdateElementProperties,
  useManifestStore,
} from "../../stores/useManifestStore";

interface GridItemPropertiesProps {
  selectedId: string;
}

const useStyles = makeStyles({
  padding: {
    padding: "10px 12px",
  },
  title: typographyStyles.subtitle2,
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

const GridItemProperties: React.FC<GridItemPropertiesProps> = ({
  selectedId,
}) => {
  const styles = useStyles();
  const elementMap = useManifestStore((state) => state.elementMap);

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  const gridItemStyles = elementMap[selectedId].styles.gridItem;

  const isGridParent = useMemo(() => {
    const parentId = elementMap[selectedId].parentId;
    return parentId?.startsWith("container-grid");
  }, [elementMap, selectedId]);

  if (!isGridParent) return null;

  return (
    <AccordionItem value="grid-item">
      <AccordionHeader expandIconPosition="end" size="large">
        Grid span
      </AccordionHeader>
      <AccordionPanel className={styles.panel}>
        <Field orientation="horizontal" label="Rows">
          <SpinButton
            value={parseInt(String(gridItemStyles?.rowSpan || 1), 10) || 0}
            min={1}
            onChange={(event, data) => {
              spinButtonOnChange(event, data, (value) => {
                updateProperties({
                  styles: {
                    gridItem: {
                      ...(gridItemStyles || {}),
                      rowSpan: value,
                    },
                  },
                });
              });
            }}
          />
        </Field>
        <Field orientation="horizontal" label="Columns">
          <SpinButton
            value={parseInt(String(gridItemStyles?.columnSpan || 1), 10) || 0}
            min={1}
            onChange={(event, data) => {
              spinButtonOnChange(event, data, (value) => {
                updateProperties({
                  styles: {
                    gridItem: {
                      ...(gridItemStyles || {}),
                      columnSpan: value,
                    },
                  },
                });
              });
            }}
          />
        </Field>
      </AccordionPanel>
    </AccordionItem>
  );
};

export default GridItemProperties;
