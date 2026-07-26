import { getVersion } from "@tauri-apps/api/app";
import React, { useCallback, useEffect, useState } from "react";
import { getStore } from "../../../common";
import { CHANGELOG, IChangelogItem } from "./data";
import {
  Button,
  Carousel,
  CarouselAnnouncerFunction,
  CarouselCard,
  CarouselNav,
  CarouselNavButton,
  CarouselSlider,
  CarouselViewport,
  Dialog,
  DialogSurface,
  Image,
  makeStyles,
  tokens,
  typographyStyles,
} from "@fluentui/react-components";
import { useDataStore } from "../../stores/useDataStore";
import { commands } from "../../../common/commands";

const useStyles = makeStyles({
  surface: {
    padding: 0,
    border: "none",
    overflow: "hidden",
  },
  carousel: { padding: 0 },
  card: {},
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "auto",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingVerticalXXL} ${tokens.spacingVerticalXXL} ${tokens.spacingVerticalXXL}`,
  },
  header: {
    display: "block",
    // We use margin instead of padding to avoid messing with the focus indicator in the header
    margin: `${tokens.spacingVerticalXXL} ${tokens.spacingVerticalXXL} ${tokens.spacingVerticalS} ${tokens.spacingVerticalXXL}`,
    ...typographyStyles.subtitle1,
  },
  text: {
    display: "block",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingVerticalXXL}`,
    ...typographyStyles.body1,
  },
});

const getLatestItems = () => {
  const latestKey = Object.keys(CHANGELOG).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  )[0];
  return CHANGELOG[latestKey];
};

interface WhatsNewProps {}

const WhatsNew: React.FC<WhatsNewProps> = () => {
  const styles = useStyles();
  const [changelogItems, setChangelogItems] = useState<IChangelogItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [version, setVersion] = useState("0");
  const [openedAuto, setOpenedAuto] = useState(false);
  const open = useDataStore((state) => state.openWhatsNew);

  const setOpen = (open: boolean) => {
    useDataStore.setState({ openWhatsNew: open });
  };

  const initData = useCallback(async () => {
    const version = await getVersion();
    const { lastSeenVersion = "0" } = await getStore();
    setVersion(version);
    let items: IChangelogItem[] = [];
    if (version !== lastSeenVersion) {
      items = Object.entries(CHANGELOG)
        .filter(([version]) => version > lastSeenVersion)
        .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
        .flatMap(([_, items]) => items);
    }
    if (items.length > 0) {
      setOpenedAuto(true);
      setChangelogItems(items);
      setOpen(true);
    } else {
      setChangelogItems(getLatestItems());
    }
  }, []);

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setOpenedAuto(false);
    }
  }, [open]);

  const totalPages = changelogItems.length;

  const setPage = async (page: number) => {
    if (page < 0 || page >= totalPages) {
      setOpen(false);
      if (page >= totalPages) {
        await commands.writeToStoreCmd({
          pairs: [{ key: "lastSeenVersion", value: version }],
        });
      }
      return;
    }
    setActiveIndex(page);
  };

  const getAnnouncement: CarouselAnnouncerFunction = (
    index: number,
    totalSlides: number,
  ) => {
    return `Carousel slide ${index + 1} of ${totalSlides}, ${
      changelogItems[index].title
    }`;
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface className={styles.surface} aria-label="Whats new">
        <Carousel
          className={styles.carousel}
          groupSize={1}
          circular
          announcement={getAnnouncement}
          activeIndex={activeIndex}
          motion={{ kind: "slide", duration: 20 }}
          onActiveIndexChange={(_, data) => setActiveIndex(data.index)}>
          <CarouselViewport>
            <CarouselSlider>
              {changelogItems.map((page) => (
                <CarouselCard className={styles.card} key={page.title}>
                  <Image
                    style={{
                      objectFit: "contain",
                      background: tokens.colorNeutralBackground2,
                    }}
                    src={page.image}
                    width={600}
                    height={337.5}
                    alt={page.title}
                  />
                  <h1 tabIndex={-1} className={styles.header}>
                    {page.title}
                  </h1>
                  <span className={styles.text}>{page.description}</span>
                </CarouselCard>
              ))}
            </CarouselSlider>
          </CarouselViewport>
          <div className={styles.footer}>
            <Button onClick={() => setPage(activeIndex - 1)}>
              {activeIndex <= 0
                ? openedAuto
                  ? "Not Now"
                  : "Close"
                : "Previous"}
            </Button>

            <CarouselNav appearance="brand">
              {(index) => (
                <CarouselNavButton
                  aria-label={`Carousel Nav Button ${index}`}
                />
              )}
            </CarouselNav>

            <Button
              appearance="primary"
              onClick={() => setPage(activeIndex + 1)}>
              {activeIndex === totalPages - 1 ? "Got it" : "Next"}
            </Button>
          </div>
        </Carousel>
      </DialogSurface>
    </Dialog>
  );
};

export default WhatsNew;
