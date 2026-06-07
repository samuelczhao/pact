import { endOfToday, endOfTomorrow, endOfWeek, endOfMonth } from "date-fns";

export const DEADLINE_PRESETS = [
  { label: "Tonight", getValue: () => endOfToday() },
  { label: "Tomorrow", getValue: () => endOfTomorrow() },
  { label: "This week", getValue: () => endOfWeek(new Date(), { weekStartsOn: 1 }) },
  { label: "This month", getValue: () => endOfMonth(new Date()) },
] as const;

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  pending_proof: {
    label: "Needs Proof",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  awaiting_verification: {
    label: "Awaiting Review",
    className: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
  completed: {
    label: "Completed",
    className: "border-green-500/30 bg-green-500/10 text-green-400",
  },
  failed: {
    label: "Failed",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
  },
};
