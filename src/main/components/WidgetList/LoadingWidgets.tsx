import React from "react";
import GridContainer from "./GridContainer";
import { Skeleton, SkeletonItem } from "@fluentui/react-components";
import { useDataStore } from "../../stores/useDataStore";

interface LoadingWidgetsProps {}

const emptyArr = Array(9).fill(null);

const LoadingWidgets: React.FC<LoadingWidgetsProps> = () => {
  const loading = useDataStore((s) => s.loading);

  if (!loading) return null;

  return (
    <GridContainer>
      {emptyArr.map((_, i) => (
        <Skeleton key={i}>
          <SkeletonItem style={{ minHeight: "180px", height: "100%" }} />
        </Skeleton>
      ))}
    </GridContainer>
  );
};

export default LoadingWidgets;
