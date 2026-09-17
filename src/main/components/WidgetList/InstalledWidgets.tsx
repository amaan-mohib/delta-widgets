import React, { useEffect, useMemo, useState } from "react";
import { useDataStore } from "../../stores/useDataStore";
import GridContainer from "./GridContainer";
import WidgetCard from "../WidgetCard";
import CreateNewCard from "./CreateNewCard";
import { listen } from "@tauri-apps/api/event";
import {
  Button,
  Menu,
  MenuGroup,
  MenuGroupHeader,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SearchBox,
  Tab,
  TabList,
  Tooltip,
} from "@fluentui/react-components";
import { ArrowUploadRegular, FilterRegular } from "@fluentui/react-icons";
import { isBuiltIn } from "../../../common";
import { commands } from "../../../common/commands";

interface InstalledWidgetsProps {}

const InstalledWidgets: React.FC<InstalledWidgetsProps> = () => {
  const installedWidgets = useDataStore((s) => s.installedWidgets);
  const key = useDataStore((s) => s.listRefreshKey);
  const activeTab = useDataStore((s) => s.activeTab);
  const [focusWidget, setFocusWidget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ sortBy: ["label"], sortDir: ["asc"] });
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    const unsub = listen<string>("focus-widget", ({ payload }) => {
      useDataStore.setState({ activeTab: "installed" });
      setFocusWidget(payload);
      setTimeout(() => {
        setFocusWidget(null);
      }, 3000);
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  const filteredWidgets = useMemo(() => {
    let res = [...installedWidgets];

    switch (selectedFilter) {
      case "enabled":
        res = res.filter((item) => !!item.visible);
        break;

      case "personal":
        res = res.filter((item) => !item.isGalleryWidget && !isBuiltIn(item));
        break;

      case "gallery":
        res = res.filter((item) => item.isGalleryWidget && !isBuiltIn(item));
        break;
    }

    const query = search.trim().toLowerCase();
    if (query) {
      res = res.filter((item) => item.label.toLowerCase().includes(query));
    }

    const multiplier = sort.sortDir[0] === "asc" ? 1 : -1;

    res.sort((a, b) => {
      if (sort.sortBy[0] === "date") {
        const aTime = new Date(
          a.publishedAt || a.installedAt || a.modifiedAt,
        ).getTime();

        const bTime = new Date(
          b.publishedAt || b.installedAt || b.modifiedAt,
        ).getTime();

        return (aTime - bTime) * multiplier;
      }

      return a.label.localeCompare(b.label) * multiplier;
    });

    return res;
  }, [installedWidgets, search, sort.sortBy, sort.sortDir, selectedFilter]);

  if (activeTab !== "installed") return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SearchBox
          placeholder="Search installed widgets"
          style={{ flex: 1 }}
          value={search}
          onChange={(_, { value }) => setSearch(value)}
        />
        <Menu
          checkedValues={sort}
          onCheckedValueChange={(_, { name, checkedItems }) => {
            setSort((prev) => ({
              ...prev,
              [name]: checkedItems,
            }));
          }}>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance={
                sort.sortBy[0] === "label" && sort.sortDir[0] === "asc"
                  ? "secondary"
                  : "primary"
              }
              icon={<FilterRegular />}
            />
          </MenuTrigger>

          <MenuPopover>
            <MenuList>
              <MenuGroup>
                <MenuGroupHeader>Sort By</MenuGroupHeader>
                <MenuItemRadio name="sortBy" value="label">
                  Name
                </MenuItemRadio>
                <MenuItemRadio name="sortBy" value="date">
                  Install Date
                </MenuItemRadio>
              </MenuGroup>
              <MenuGroup>
                <MenuGroupHeader>Sort Order</MenuGroupHeader>
                <MenuItemRadio name="sortDir" value="asc">
                  Ascending
                </MenuItemRadio>
                <MenuItemRadio name="sortDir" value="desc">
                  Descending
                </MenuItemRadio>
              </MenuGroup>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Tooltip relationship="label" content="Publish to Gallery">
          <Button
            appearance="primary"
            icon={<ArrowUploadRegular />}
            style={{ marginLeft: "auto" }}
            onClick={async () => {
              await commands.createGalleryWindow({ url: "/dashboard/upload" });
            }}>
            Publish
          </Button>
        </Tooltip>
      </div>
      <div style={{ margin: "16px 0" }}>
        <TabList
          selectedValue={selectedFilter}
          onTabSelect={(_, { value }) => {
            setSelectedFilter(value as string);
          }}
          appearance="filled-circular"
          size="small">
          <Tab value="all">All</Tab>
          <Tab value="enabled">Enabled</Tab>
          <Tab value="personal">My Widgets</Tab>
          <Tab value="gallery">From Gallery</Tab>
        </TabList>
      </div>
      <GridContainer key={key}>
        {filteredWidgets.map((widget) => {
          return (
            <WidgetCard
              key={widget.key}
              widget={widget}
              focusWidget={focusWidget}
            />
          );
        })}
        <CreateNewCard />
      </GridContainer>
    </div>
  );
};

export default InstalledWidgets;
