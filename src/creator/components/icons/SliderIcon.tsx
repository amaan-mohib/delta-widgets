import { SVGProps } from "react";

const SliderIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}>
    <rect width={18} height={2} x={3} y={11} fill="currentColor" rx={1} />
    <circle cx={9} cy={12} r={3} fill="currentColor" />
  </svg>
);
export default SliderIcon;
