const STEPS = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10_000];
const MAX_TICKS = 5;
const SINGLE_VALUE_PADDING = 2;

/** Round, even ticks for a chart, with the top tick above the maximum so the data never touches the edge. */
export function niceScale(lowest: number, highest: number) {
  const low = lowest === highest ? lowest - SINGLE_VALUE_PADDING : lowest;
  const high = lowest === highest ? highest + SINGLE_VALUE_PADDING : highest;

  const fit = (step: number) => {
    const min = Math.floor(low / step) * step;
    const top = Math.ceil(high / step) * step;
    return { step, min, max: top === high ? top + step : top };
  };

  const { step, min, max } =
    STEPS.map(fit).find((scale) => (scale.max - scale.min) / scale.step + 1 <= MAX_TICKS) ?? fit(STEPS.at(-1)!);

  const ticks = Array.from({ length: (max - min) / step + 1 }, (_, index) => min + index * step);
  return { min, max, ticks };
}

const MAX_LABELS = 7;

/** Which positions get an x label: one step all the way, never a forced label at the end. */
export function labelIndexes(count: number) {
  const step = Math.max(1, Math.ceil(count / MAX_LABELS));
  return Array.from({ length: Math.ceil(count / step) }, (_, index) => index * step);
}
