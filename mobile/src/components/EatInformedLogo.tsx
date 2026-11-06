import React from 'react';
import Svg, { Path, G, Circle, Line } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface LogoProps {
  size?: number;
  leafColor?: string;
  strokeColor?: string;
}

// ponytail: authentic mobile vector port of website's NutriScanLogo (leaf + magnifying glass)
export function EatInformedLogo({
  size = 28,
  leafColor,
  strokeColor,
}: LogoProps) {
  const { colors } = useTheme();
  const fill = leafColor || colors.primary;
  const stroke = strokeColor || colors.text;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label="EatInformed Icon"
    >
      {/* Leaf */}
      <Path
        d="M32,5 C18,18 16,35 32,59 C48,35 46,18 32,5 Z"
        fill={fill}
      />
      {/* Magnifying Glass */}
      <G
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Circle cx="26" cy="24" r="11" fill="none" />
        <Line x1="35" y1="33" x2="45" y2="43" />
      </G>
    </Svg>
  );
}
