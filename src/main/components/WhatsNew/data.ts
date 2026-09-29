import { ReactNode } from "react";

export interface IChangelogItem {
  image?: string;
  title: string;
  description: ReactNode | string;
}

export interface IChangelog {
  version: string;
  items: IChangelogItem[];
}

export const CHANGELOG: IChangelog[] = [
  {
    version: "1.0.5",
    items: [
      {
        title: "Gallery",
        description:
          "Introduced gallery functionality with widget uploads, downloads, and deep link integration.",
      },
      {
        title: "Widget Settings",
        description:
          "Added configurable widget settings, including weather city and date options for supported widgets.",
      },
      {
        title: "Widget Management",
        description:
          "Added support for searching, filtering and renaming widgets.",
      },
      {
        title: "Notifications",
        description:
          "Introduced a new notifications system to keep you informed about important updates.",
      },
      {
        title: "Deep Linking",
        description:
          "Added deep link support, allowing widgets and app actions to be opened directly from links.",
      },
      {
        title: "New Widget APIs",
        description:
          "Added asset path, and background asset path commands for more powerful widgets.",
      },
      {
        title: "Widget Events",
        description:
          "Added close widget and duplicate widget events, with updated event documentation.",
      },
      {
        title: "Media Improvements",
        description:
          "Improved image handling, screenshot management, and thumbnail behavior across widgets and gallery listings.",
      },
      {
        title: "Performance & Stability",
        description:
          "Improved state management, refactored internal systems, and resolved various bugs throughout the application.",
      },
    ],
  },
  {
    version: "1.0.4",
    items: [
      {
        image: "/assets/whats-new/v1.0.4/v1.0.4-1.png",
        description:
          "Introducing an optional AI assistant for widget generation and media history queries. Supports Bring Your Own Key (BYOK) with multiple AI providers.",
        title: "Optional AI Assistant",
      },
    ],
  },
  {
    version: "1.0.3",
    items: [
      {
        description: "Improved performance and bug fixes.",
        title: "Bug Fixes and Improvements",
      },
    ],
  },
  {
    version: "1.0.2",
    items: [
      {
        image: "/assets/whats-new/v1.0.2/v1.0.2-1.png",
        description:
          "You can now add dynamic waveform and media visualizer widgets to your desktop setup for a more responsive audio experience.",
        title: "New Audio & Media Visualizer Widgets",
      },
      {
        image: "/assets/whats-new/v1.0.2/v1.0.2-2.gif",
        description:
          "URL widgets now fetch favicons and can be pinned to remove window borders, and HTML widgets can be refreshed.",
        title: "Richer URL & HTML Widgets",
      },
      {
        image: "/assets/whats-new/v1.0.2/v1.0.2-3.png",
        description:
          "Includes widget placement fixes, improved publishing reliability, and several behind-the-scenes stability improvements.",
        title: "Smoother Overall Experience",
      },
    ],
  },
  {
    version: "1.0.1",
    items: [
      {
        image: "/assets/whats-new/v1.0.1/v1.0.1.png",
        description:
          "We're building a community marketplace where creators can share, buy, and sell custom widgets. Join the waitlist to be among the first to create and monetize your widgets.",
        title: "Widget Marketplace Coming Soon",
      },
    ],
  },
];
