import React, { PropsWithChildren } from "react";

interface GridContainerProps extends PropsWithChildren {}

const GridContainer: React.FC<GridContainerProps> = ({ children }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, 200px)",
        gap: "16px",
      }}
      role="list">
      {children}
    </div>
  );
};

export default GridContainer;
