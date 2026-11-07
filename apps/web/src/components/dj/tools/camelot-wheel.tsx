"use client";

import { CAMELOT_KEYS, keyLabel, keyRelation, type CamelotKey, type KeyRelation } from "@dallateas/dj/camelot";
import { cn } from "@dallateas/ui/lib/utils";
import { useState, type KeyboardEvent } from "react";

import { KeyTag } from "@/components/dj/key-tag";

const SIZE = 360;
const CENTER = SIZE / 2;
const WEDGE_DEGREES = 30;
const WHEEL_SIZE = 12;

/** Radii of each ring. Majors go outside, the way the wheel is printed. */
const RINGS = {
  B: { inner: 124, outer: 178 },
  A: { inner: 68, outer: 122 },
};

const INITIAL_KEY: CamelotKey = "8A";

const MIX_GROUPS: { relation: KeyRelation; title: string; hint: string }[] = [
  { relation: "adjacent", title: "Vecinas", hint: "Un paso en la rueda" },
  { relation: "relative", title: "Relativa", hint: "Mismo número, otro anillo" },
  { relation: "boost", title: "Sube energía", hint: "Dos pasos hacia adelante" },
];

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

const WEDGES = CAMELOT_KEYS.map((key) => {
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

function stepAround(key: CamelotKey, steps: number) {
  const number = Number.parseInt(key, 10);
  const next = ((number - 1 + steps + WHEEL_SIZE) % WHEEL_SIZE) + 1;
  return `${next}${key.at(-1)}` as CamelotKey;
}

function nextKey(key: CamelotKey, pressed: string): CamelotKey | null {
  const number = Number.parseInt(key, 10);
  if (pressed === "ArrowRight") return stepAround(key, 1);
  if (pressed === "ArrowLeft") return stepAround(key, -1);
  if (pressed === "ArrowUp") return `${number}B`;
  if (pressed === "ArrowDown") return `${number}A`;
  return null;
}

function compatibleKeys(selected: CamelotKey, relation: KeyRelation) {
  return CAMELOT_KEYS.filter((key) => keyRelation(selected, key) === relation);
}

/** Which keys mix with which. The fluo marks the key in hand and the pale tint what goes with it. */
export function CamelotWheel() {
  const [selected, setSelected] = useState<CamelotKey>(INITIAL_KEY);

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, key: CamelotKey) {
    const next = nextKey(key, event.key);
    if (!next) return;

    event.preventDefault();
    setSelected(next);
    event.currentTarget.ownerSVGElement?.querySelector<SVGGElement>(`[data-key="${next}"]`)?.focus();
  }

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-16">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="radiogroup"
        aria-label="Rueda de Camelot. Las flechas recorren la rueda y cambian de anillo"
        className="mx-auto w-full max-w-[30rem]"
      >
        {WEDGES.map(({ key, labelX, labelY, path }) => {
          const relation = keyRelation(selected, key);
          const isSelected = key === selected;
          const isCompatible = !isSelected && relation !== "clash";

          return (
            <g
              key={key}
              data-key={key}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${key}, ${keyLabel(key)}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(key)}
              onKeyDown={(event) => handleKeyDown(event, key)}
              className="cursor-pointer outline-none [&:focus-visible>path]:stroke-foreground"
            >
              <path
                d={path}
                className={cn(
                  "stroke-background stroke-2 transition-colors",
                  isSelected ? "fill-primary" : isCompatible ? "fill-accent" : "fill-card hover:fill-muted",
                )}
              />
              <text
                x={labelX}
                y={labelY - 7}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "pointer-events-none font-heading text-[17px] font-bold",
                  isSelected ? "fill-primary-foreground" : isCompatible ? "fill-accent-foreground" : "fill-foreground",
                )}
              >
                {key}
              </text>
              <text
                x={labelX}
                y={labelY + 10}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "pointer-events-none text-[12px]",
                  isSelected ? "fill-primary-foreground" : isCompatible ? "fill-accent-foreground" : "fill-muted-foreground",
                )}
              >
                {keyLabel(key)}
              </text>
            </g>
          );
        })}
        <text
          x={CENTER}
          y={CENTER - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none fill-foreground font-heading text-[44px] font-bold"
        >
          {selected}
        </text>
        <text
          x={CENTER}
          y={CENTER + 24}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none fill-muted-foreground text-[15px]"
        >
          {keyLabel(selected)}
        </text>
      </svg>

      <div aria-live="polite">
        <p className="text-sm text-muted-foreground">Mezcla con</p>
        <p className="mt-1 font-heading text-3xl font-bold leading-none">
          <KeyTag value={selected} />
        </p>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {MIX_GROUPS.map(({ relation, title, hint }) => (
            <div key={relation} className="flex items-baseline justify-between gap-4 py-3">
              <dt>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-[13px] text-muted-foreground">{hint}</span>
              </dt>
              <dd className="flex flex-col items-end gap-1 text-sm">
                {compatibleKeys(selected, relation).map((key) => (
                  <KeyTag key={key} value={key} />
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
