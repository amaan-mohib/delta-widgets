export interface IChangelogItem {
  image: string;
  title: string;
  description: string;
}

export const CHANGELOG: Record<string, IChangelogItem[]> = {
  "1.0.1": [
    {
      image: "/assets/whats-new/v1.0.1/v1.0.1.png",
      description:
        "We're building a community marketplace where creators can share, buy, and sell custom widgets. Join the waitlist to be among the first to create and monetize your widgets.",
      title: "Widget Marketplace Coming Soon",
    },
  ],
  "1.0.2": [
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
};
