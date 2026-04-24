"use client";

import { useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

// Lottie animation data: Floating code brackets animation
const codeAnimationData = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "CodeBrackets",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Left Bracket",
      sr: 1,
      ks: {
        o: { a: 0, k: [80] },
        r: { a: 1, k: [{ t: 0, s: [-5], e: [5] }, { t: 60, s: [5], e: [-5] }, { t: 120, s: [-5] }] },
        p: { a: 1, k: [{ t: 0, s: [60, 100, 0], e: [55, 95, 0] }, { t: 60, s: [55, 95, 0], e: [60, 100, 0] }, { t: 120, s: [60, 100, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [105, 105, 100] }, { t: 60, s: [105, 105, 100], e: [100, 100, 100] }, { t: 120, s: [100, 100, 100] }] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          it: [
            { ind: 0, ty: "rc", d: 1, s: { a: 0, k: [10, 30] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 5 } },
            { ty: "fl", c: { a: 0, k: [0.42, 0.663, 1, 0.8] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [-10, -15, 0] }, s: { a: 0, k: [100, 100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Right Bracket",
      sr: 1,
      ks: {
        o: { a: 0, k: [80] },
        r: { a: 1, k: [{ t: 0, s: [5], e: [-5] }, { t: 60, s: [-5], e: [5] }, { t: 120, s: [5] }] },
        p: { a: 1, k: [{ t: 0, s: [140, 100, 0], e: [145, 95, 0] }, { t: 60, s: [145, 95, 0], e: [140, 100, 0] }, { t: 120, s: [140, 100, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [105, 105, 100] }, { t: 60, s: [105, 105, 100], e: [100, 100, 100] }, { t: 120, s: [100, 100, 100] }] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          it: [
            { ind: 0, ty: "rc", d: 1, s: { a: 0, k: [10, 30] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 5 } },
            { ty: "fl", c: { a: 0, k: [0.42, 0.663, 1, 0.8] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [10, -15, 0] }, s: { a: 0, k: [100, 100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Slash",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0] }, { t: 20, s: [60] }, { t: 100, s: [60] }, { t: 120, s: [0] }] },
        r: { a: 0, k: 15 },
        p: { a: 1, k: [{ t: 0, s: [100, 100, 0], e: [100, 95, 0] }, { t: 60, s: [100, 95, 0], e: [100, 100, 0] }, { t: 120, s: [100, 100, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [80, 80, 100], e: [100, 100, 100] }, { t: 30, s: [100, 100, 100] }, { t: 90, s: [100, 100, 100], e: [80, 80, 100] }, { t: 120, s: [80, 80, 100] }] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          it: [
            { ind: 0, ty: "rc", d: 1, s: { a: 0, k: [3, 35] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 1 } },
            { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 0.6] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, -17, 0] }, s: { a: 0, k: [100, 100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "Dots",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0] }, { t: 30, s: [40] }, { t: 90, s: [40] }, { t: 120, s: [0] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        { ty: "el", d: 1, s: { a: 0, k: [4, 4] }, p: { a: 0, k: [-15, -20] }, nm: "dot1" },
        { ty: "fl", c: { a: 0, k: [0.42, 0.663, 1, 1] }, o: { a: 0, k: 100 }, nm: "dot1Fill" },
        { ty: "el", d: 1, s: { a: 0, k: [3, 3] }, p: { a: 0, k: [10, -10] }, nm: "dot2" },
        { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 1] }, o: { a: 0, k: 100 }, nm: "dot2Fill" },
        { ty: "el", d: 1, s: { a: 0, k: [3, 3] }, p: { a: 0, k: [-8, 15] }, nm: "dot3" },
        { ty: "fl", c: { a: 0, k: [0.639, 0.741, 0.859, 1] }, o: { a: 0, k: 100 }, nm: "dot3Fill" },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

// Lottie animation data: Security lock animation
const lockAnimationData = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "SecurityLock",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Lock Body",
      sr: 1,
      ks: {
        o: { a: 0, k: [100] },
        r: { a: 1, k: [{ t: 0, s: [-3], e: [3] }, { t: 60, s: [3], e: [-3] }, { t: 120, s: [-3] }] },
        p: { a: 0, k: [100, 110, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          it: [
            { ind: 0, ty: "rc", d: 1, s: { a: 0, k: [45, 35] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 6 } },
            { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 0.15] }, o: { a: 0, k: 100 } },
            { ty: "st", c: { a: 0, k: [0.016, 0.882, 0.518, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2.5 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [-22.5, -17.5, 0] }, s: { a: 0, k: [100, 100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Lock Shackle",
      sr: 1,
      ks: {
        o: { a: 0, k: [90] },
        r: { a: 1, k: [{ t: 0, s: [0], e: [8] }, { t: 40, s: [8], e: [-8] }, { t: 80, s: [-8], e: [0] }, { t: 120, s: [0] }] },
        p: { a: 1, k: [{ t: 0, s: [100, 78, 0], e: [100, 75, 0] }, { t: 40, s: [100, 75, 0], e: [100, 78, 0] }, { t: 80, s: [100, 78, 0], e: [100, 75, 0] }, { t: 120, s: [100, 75, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          it: [
            { ind: 0, ty: "el", d: 1, s: { a: 0, k: [28, 28] }, p: { a: 0, k: [0, 0] } },
            { ty: "st", c: { a: 0, k: [0.42, 0.663, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 }, lc: 2, lj: 2 },
            { ty: "tm", s: { a: 0, k: [0, 0] }, e: { a: 0, k: [0, -25] } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Keyhole",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [60] }, { t: 40, s: [100] }, { t: 80, s: [100] }, { t: 120, s: [60] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 110, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [90, 90, 100], e: [100, 100, 100] }, { t: 40, s: [100, 100, 100] }, { t: 80, s: [100, 100, 100], e: [90, 90, 100] }, { t: 120, s: [90, 90, 100] }] },
      },
      ao: 0,
      shapes: [
        { ty: "el", d: 1, s: { a: 0, k: [8, 8] }, p: { a: 0, k: [0, -4] }, nm: "Keyhole circle" },
        { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 1] }, o: { a: 0, k: 100 }, nm: "Keyhole fill" },
        { ty: "rc", d: 1, s: { a: 0, k: [5, 10] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 2 }, nm: "Keyhole slot" },
        { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 1] }, o: { a: 0, k: 100 }, nm: "Keyhole slot fill" },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "Pulse",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [30] }, { t: 60, s: [0] }, { t: 120, s: [30] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 110, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 60, s: [150, 150, 100] }, { t: 120, s: [100, 100, 100] }] },
      },
      ao: 0,
      shapes: [
        { ty: "el", d: 1, s: { a: 0, k: [50, 40] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 6 }, nm: "Pulse ring" },
        { ty: "st", c: { a: 0, k: [0.016, 0.882, 0.518, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1 }, nm: "Pulse stroke" },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ],
};

// Lottie animation data: Analytics chart
const chartAnimationData = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 150,
  w: 200,
  h: 200,
  nm: "AnalyticsChart",
  ddd: 0,
  assets: [],
  layers: [
    { ddd: 0, ind: 1, ty: 4, nm: "Bar1", sr: 1, ks: { o: { a: 0, k: [100] }, r: { a: 0, k: 0 }, p: { a: 0, k: [40, 160, 0] }, a: { a: 0, k: [0, 20, 0] }, s: { a: 1, k: [{ t: 0, s: [100, 0, 100], e: [100, 100, 100] }, { t: 50, s: [100, 100, 100] }, { t: 100, s: [100, 100, 100], e: [100, 0, 100] }, { t: 150, s: [100, 0, 100] }] } }, ao: 0, shapes: [{ ty: "rc", d: 1, s: { a: 0, k: [15, 40] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 3 }, nm: "Bar" }, { ty: "fl", c: { a: 0, k: [0.42, 0.663, 1, 0.7] }, o: { a: 0, k: 100 }, nm: "BarFill" }], ip: 0, op: 150, st: 0 },
    { ddd: 0, ind: 2, ty: 4, nm: "Bar2", sr: 1, ks: { o: { a: 0, k: [100] }, r: { a: 0, k: 0 }, p: { a: 0, k: [65, 160, 0] }, a: { a: 0, k: [0, 20, 0] }, s: { a: 1, k: [{ t: 10, s: [100, 0, 100], e: [100, 100, 100] }, { t: 60, s: [100, 100, 100] }, { t: 110, s: [100, 100, 100], e: [100, 0, 100] }, { t: 150, s: [100, 0, 100] }] } }, ao: 0, shapes: [{ ty: "rc", d: 1, s: { a: 0, k: [15, 55] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 3 }, nm: "Bar" }, { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 0.7] }, o: { a: 0, k: 100 }, nm: "BarFill" }], ip: 10, op: 150, st: 10 },
    { ddd: 0, ind: 3, ty: 4, nm: "Bar3", sr: 1, ks: { o: { a: 0, k: [100] }, r: { a: 0, k: 0 }, p: { a: 0, k: [90, 160, 0] }, a: { a: 0, k: [0, 20, 0] }, s: { a: 1, k: [{ t: 20, s: [100, 0, 100], e: [100, 100, 100] }, { t: 70, s: [100, 100, 100] }, { t: 120, s: [100, 100, 100], e: [100, 0, 100] }, { t: 150, s: [100, 0, 100] }] } }, ao: 0, shapes: [{ ty: "rc", d: 1, s: { a: 0, k: [15, 35] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 3 }, nm: "Bar" }, { ty: "fl", c: { a: 0, k: [0.639, 0.741, 0.859, 0.7] }, o: { a: 0, k: 100 }, nm: "BarFill" }], ip: 20, op: 150, st: 20 },
    { ddd: 0, ind: 4, ty: 4, nm: "Bar4", sr: 1, ks: { o: { a: 0, k: [100] }, r: { a: 0, k: 0 }, p: { a: 0, k: [115, 160, 0] }, a: { a: 0, k: [0, 20, 0] }, s: { a: 1, k: [{ t: 30, s: [100, 0, 100], e: [100, 100, 100] }, { t: 80, s: [100, 100, 100] }, { t: 130, s: [100, 100, 100], e: [100, 0, 100] }, { t: 150, s: [100, 0, 100] }] } }, ao: 0, shapes: [{ ty: "rc", d: 1, s: { a: 0, k: [15, 65] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 3 }, nm: "Bar" }, { ty: "fl", c: { a: 0, k: [0.42, 0.663, 1, 0.7] }, o: { a: 0, k: 100 }, nm: "BarFill" }], ip: 30, op: 150, st: 30 },
    { ddd: 0, ind: 5, ty: 4, nm: "Bar5", sr: 1, ks: { o: { a: 0, k: [100] }, r: { a: 0, k: 0 }, p: { a: 0, k: [140, 160, 0] }, a: { a: 0, k: [0, 20, 0] }, s: { a: 1, k: [{ t: 40, s: [100, 0, 100], e: [100, 100, 100] }, { t: 90, s: [100, 100, 100] }, { t: 140, s: [100, 100, 100], e: [100, 0, 100] }, { t: 150, s: [100, 0, 100] }] } }, ao: 0, shapes: [{ ty: "rc", d: 1, s: { a: 0, k: [15, 45] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 3 }, nm: "Bar" }, { ty: "fl", c: { a: 0, k: [0.016, 0.882, 0.518, 0.7] }, o: { a: 0, k: 100 }, nm: "BarFill" }], ip: 40, op: 150, st: 40 },
    { ddd: 0, ind: 6, ty: 4, nm: "TrendLine", sr: 1, ks: { o: { a: 1, k: [{ t: 0, s: [0] }, { t: 50, s: [60] }, { t: 100, s: [60] }, { t: 150, s: [0] }] }, r: { a: 0, k: 0 }, p: { a: 0, k: [90, 120, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, ao: 0, shapes: [{ ty: "sh", it: [{ ind: 0, ty: "sh", it: [{ ind: 0, ty: "rc", d: 1, s: { a: 0, k: [120, 2] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 1 } }, { ty: "fl", c: { a: 0, k: [0.251, 0.878, 0.518, 0.8] }, o: { a: 0, k: 100 } }, { ty: "tr", p: { a: 0, k: [0, -15] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }, r: { a: 0, k: -8 }, o: { a: 0, k: 100 } }] }] }], ip: 0, op: 150, st: 0 },
  ],
};

interface LottieCodeProps {
  variant?: "code" | "lock" | "chart";
  size?: number;
  className?: string;
  loop?: boolean;
}

export default function LottieCode({
  variant = "code",
  size = 200,
  className = "",
  loop = true,
}: LottieCodeProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const animationData = variant === "lock" ? lockAnimationData : variant === "chart" ? chartAnimationData : codeAnimationData;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
