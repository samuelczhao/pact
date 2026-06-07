import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatDistanceToNow,
  isPast,
  differenceInMinutes,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateVenmoLink(
  venmoUsername: string,
  amount: number,
  pactTitle: string
): string {
  const note = encodeURIComponent(`Lost pact: "${pactTitle}"`);
  return `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amount}&note=${note}`;
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const date = new Date(deadline);
  if (isPast(date)) {
    return `${formatDistanceToNow(date)} ago`;
  }
  return `in ${formatDistanceToNow(date)}`;
}

export function isEditable(editableUntil: string): boolean {
  return !isPast(new Date(editableUntil));
}

export function minutesRemaining(deadline: string | null): number {
  if (!deadline) return Infinity;
  return differenceInMinutes(new Date(deadline), new Date());
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
