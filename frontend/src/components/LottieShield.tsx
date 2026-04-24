"use client";

import { useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

// Lightweight inline Lottie JSON - Security shield pulse animation
const shieldAnimationData = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "Shield",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Ring 1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [60] },
            { t: 45, s: [0] },
            { t: 90, s: [60] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100] },
            { t: 45, s: [140, 140, 100] },
            { t: 90, s: [80, 80, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [120, 140] },
          p: { a: 0, k: [0, -5] },
          nm: "Shield",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.016, 0.882, 0.518, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 2 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Ring 2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 15, s: [0] },
            { t: 60, s: [50] },
            { t: 90, s: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 15, s: [70, 70, 100] },
            { t: 60, s: [130, 130, 100] },
            { t: 90, s: [70, 70, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [100, 120] },
          p: { a: 0, k: [0, -3] },
          nm: "Shield",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.42, 0.663, 1, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 1.5 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
      ],
      ip: 15,
      op: 90,
      st: 15,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Core Shield",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0] }, { t: 15, s: [90] }, { t: 75, s: [90] }, { t: 90, s: [0] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [60, 60, 100] },
            { t: 20, s: [100, 100, 100] },
            { t: 70, s: [100, 100, 100] },
            { t: 90, s: [60, 60, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [70, 85] },
          p: { a: 0, k: [0, -2] },
          nm: "Shield",
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.016, 0.882, 0.518, 0.2] },
          o: { a: 0, k: 100 },
          nm: "Fill",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.016, 0.882, 0.518, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
    },
  ],
};

interface LottieShieldProps {
  size?: number;
  className?: string;
  loop?: boolean;
}

export default function LottieShield({ size = 200, className = "", loop = true }: LottieShieldProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={shieldAnimationData}
        loop={loop}
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
