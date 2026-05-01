import { Button, Text } from "@fluentui/react-components";
import { Open16Regular } from "@fluentui/react-icons";
import React from "react";

interface MartketplaceWaitlistProps {}

const MartketplaceWaitlist: React.FC<MartketplaceWaitlistProps> = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Text size={500} weight="semibold">
        Widget Marketplace Coming Soon!
      </Text>
      <Text>
        We're building a community marketplace where creators can share, buy,
        and sell custom widgets. This waitlist helps us gauge interest and
        prioritize development.
      </Text>
      <Text size={200}>
        Join the waitlist to be among the first to create and monetize your
        widgets.
      </Text>
      <Button
        style={{ width: "fit-content" }}
        appearance="primary"
        as="a"
        href="https://forms.gle/Y7ni54Eknp599nG6A"
        target="_blank"
        icon={<Open16Regular />}
        iconPosition="after">
        Join Marketplace Waitlist
      </Button>
    </div>
  );
};

export default MartketplaceWaitlist;
