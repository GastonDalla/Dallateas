import { CAMELOT_KEYS } from "@dallateas/dj/camelot";

/** The Camelot wheel as drawn: 12 at the top, numbers clockwise, majors on the outer ring. */
export const SIZE = 360;
export const CENTER = SIZE / 2;
const WEDGE_DEGREES = 30;
export const WHEEL_SIZE = 12;

/** Radii of each ring. Majors go outside, the way the wheel is printed. */
export const RINGS = {
  B: { inner: 124, outer: 178 },
  A: { inner: 68, outer: 122 },
};

function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  // Two decimals, so server and browser print the same path whatever their floating point does.
  const round = (value: number) => Math.round(value * 100) / 100;
  return [round(CENTER + radius * Math.cos(radians)), round(CENTER + radius * Math.sin(radians))] as const;
}

function wedgePath(inner: number, outer: number, start: number, end: number) {
  const [outerStartX, outerStartY] = polar(outer, start);
  const [outerEndX, outerEndY] = polar(outer, end);
  const [innerEndX, innerEndY] = polar(inner, end);
  const [innerStartX, innerStartY] = polar(inner, start);

  return [
    `M${outerStartX} ${outerStartY}`,
    `A${outer} ${outer} 0 0 1 ${outerEndX} ${outerEndY}`,
    `L${innerEndX} ${innerEndY}`,
    `A${inner} ${inner} 0 0 0 ${innerStartX} ${innerStartY}`,
    "Z",
  ].join("");
}

export const WEDGES = CAMELOT_KEYS.map((key) => {
  const number = Number.parseInt(key, 10);
  const ring = RINGS[key.endsWith("A") ? "A" : "B"];
  // 12 sits at the top and the numbers run clockwise, as on every printed wheel.
  const angle = (number % WHEEL_SIZE) * WEDGE_DEGREES - 90;
  const [labelX, labelY] = polar((ring.inner + ring.outer) / 2, angle);

  return {
    key,
    labelX,
    labelY,
    path: wedgePath(ring.inner, ring.outer, angle - WEDGE_DEGREES / 2, angle + WEDGE_DEGREES / 2),
  };
});
