import React from "react";
import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";

export function LineMiniChart({
  values,
  width = 320,
  height = 80,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (!values || values.length < 2) return <View style={{ height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 10) + 5;
    const y = (1 - (v - min) / range) * (height - 10) + 5;
    return `${x},${y}`;
  });

  return (
    <Svg width={width} height={height}>
      <Polyline points={pts.join(" ")} fill="none" strokeWidth={3} stroke="#60a5fa" />
    </Svg>
  );
}
