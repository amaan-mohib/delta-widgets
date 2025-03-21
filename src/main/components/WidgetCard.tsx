import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  makeStyles,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Switch,
  Text,
} from "@fluentui/react-components";
import React from "react";
import {
  closeWidgetWindow,
  createCreatorWindow,
  createUrlWidgetWindow,
  duplicateWidget,
  removeWidget,
} from "../utils/widgets";
import {
  CopyRegular,
  DeleteRegular,
  EditRegular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { IWidget } from "../../types/manifest";

interface WidgetCardProps {
  widget: IWidget;
  cardStyle: string;
  saves?: boolean;
}

const useStyles = makeStyles({
  cardFooter: {
    marginTop: "auto",
  },
  switch: {
    marginLeft: "0px",
  },
});

const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  cardStyle,
  saves,
}) => {
  const styles = useStyles();

  return (
    <Card
      role="listitem"
      key={widget.key}
      className={cardStyle}
      onClick={
        saves
          ? () => {
              createCreatorWindow(widget.path);
            }
          : undefined
      }>
      <CardHeader
        action={
          <Menu positioning={"below-end"}>
            <MenuTrigger disableButtonEnhancement>
              <MenuButton
                onClick={(e) => e.stopPropagation()}
                size="small"
                appearance="transparent"
                icon={<MoreHorizontal20Regular />}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<CopyRegular />}
                  onClick={() => {
                    duplicateWidget(widget, saves).catch(console.log);
                  }}>
                  {saves ? "Clone" : "Duplicate"}
                </MenuItem>
                <MenuItem
                  icon={<DeleteRegular />}
                  onClick={() => removeWidget(widget.path)}>
                  Remove
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        }
        header={<Text weight="semibold">{widget.label}</Text>}
      />
      {widget.description && <p>{widget.description}</p>}
      <CardFooter className={styles.cardFooter}>
        {saves ? (
          <>
            <Button icon={<EditRegular />} />
            <Button
              icon={<DeleteRegular />}
              onClick={(e) => {
                e.stopPropagation();
                removeWidget(widget.path, saves);
              }}
            />
          </>
        ) : (
          <Switch
            className={styles.switch}
            label={widget.visible ? "Enabled" : "Disabled"}
            style={{ margin: 0 }}
            defaultChecked={widget.visible}
            indicator={{ className: styles.switch }}
            onChange={async (_, { checked }) => {
              if (checked) {
                if (widget.url) {
                  await createUrlWidgetWindow(widget.path);
                }
              } else {
                await closeWidgetWindow(widget.label);
              }
            }}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default WidgetCard;
