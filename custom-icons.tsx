import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const HeartIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

export const HeartFilledIcon = ({ size = 24, color = "#EF4444" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

export const CommentIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export const ShareIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Path d="M8.59 13.51l6.83 3.98" />
    <Path d="M15.41 6.51l-6.82 3.98" />
  </Svg>
);

export const SendIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5951061 3.19218622,10.7522035 3.50612381,10.7522035 L16.6915026,11.5376905 C16.6915026,11.5376905 17.1624089,11.5376905 17.1624089,12.0089827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" fill={color} />
  </Svg>
);

export const CheckIcon = ({ size = 24, color = "#22C55E", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

export const CheckDoubleIcon = ({ size = 24, color = "#22C55E", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M18 6L7 17" />
    <Path d="M6 11L3 14" />
  </Svg>
);

export const FollowIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Circle cx="8.5" cy="7" r="4" />
    <Path d="M20 8v6" />
    <Path d="M23 11h-6" />
  </Svg>
);

export const SearchIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

export const MoreIcon = ({ size = 24, color = "#687076", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Circle cx="12" cy="5" r="1" />
    <Circle cx="12" cy="12" r="1" />
    <Circle cx="12" cy="19" r="1" />
  </Svg>
);

export const BookmarkIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

export const BookmarkFilledIcon = ({ size = 24, color = "#0a7ea4" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

export const LiveIcon = ({ size = 24, color = "#EF4444" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="6" fill="white" />
  </Svg>
);

export const VerifiedIcon = ({ size = 24, color = "#0a7ea4" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    <Path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white" />
  </Svg>
);

export const StarIcon = ({ size = 24, color = "#F59E0B", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export const StarFilledIcon = ({ size = 24, color = "#F59E0B" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export const PlayIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M5 3l14 9-14 9V3z" />
  </Svg>
);

export const PauseIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Rect x="6" y="4" width="4" height="16" />
    <Rect x="14" y="4" width="4" height="16" />
  </Svg>
);

export const VolumeIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M3 9v6h4l5 5V4L7 9H3z" />
    <Path d="M15.54 5.54a9 9 0 0 1 0 12.92M19.07 2a15 15 0 0 1 0 20" />
  </Svg>
);


export const ReplyIcon = ({ size = 24, color = "#0a7ea4", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <Path d="M9 10l-3 3l3 3" />
  </Svg>
);

export const TrashIcon = ({ size = 24, color = "#EF4444", strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M3 6h18" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
    <Path d="M10 11v6" />
    <Path d="M14 11v6" />
  </Svg>
);
