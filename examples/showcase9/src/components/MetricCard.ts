import type { Render } from "@ydant/core";
import { div, span, text } from "@ydant/base";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}

export function MetricCard(props: MetricCardProps): Render {
  const color = props.color ?? "blue";
  return div({ class: "bg-slate-800 rounded-lg border border-slate-700 p-4" }, function* () {
    yield* span({ class: "text-sm text-gray-400" }, props.label);
    yield* div({ class: "mt-1 flex items-baseline gap-1" }, function* () {
      yield* span({ class: `text-2xl font-bold text-${color}-600` }, props.value);
      const unit = props.unit;
      if (unit) {
        yield* span({ class: "text-sm text-gray-400" }, unit);
      }
    });
  });
}
