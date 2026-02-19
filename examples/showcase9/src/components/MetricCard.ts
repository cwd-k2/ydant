import type { Render } from "@ydant/core";
import { div, span, text, classes } from "@ydant/base";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}

export function MetricCard(props: MetricCardProps): Render {
  const color = props.color ?? "blue";
  return div(function* () {
    yield* classes("bg-slate-800", "rounded-lg", "border", "border-slate-700", "p-4");
    yield* span(() => [classes("text-sm", "text-gray-400"), text(props.label)]);
    yield* div(function* () {
      yield* classes("mt-1", "flex", "items-baseline", "gap-1");
      yield* span(() => [classes("text-2xl", "font-bold", `text-${color}-600`), text(props.value)]);
      const unit = props.unit;
      if (unit) {
        yield* span(() => [classes("text-sm", "text-gray-400"), text(unit)]);
      }
    });
  });
}
