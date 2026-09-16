import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(isoDate: string) {
  const seconds = (new Date(isoDate).getTime() - Date.now()) / 1000;
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return relativeFormatter.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

const scheduledTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// An absolute local date/time (e.g. "Sep 20, 3:00 PM") for a listing's
// optional meetup time — formatRelativeTime reads wrong here since a
// scheduled time is about the future, not "how long ago", and it may not
// even be today.
export function formatScheduledTime(isoDate: string) {
  return scheduledTimeFormatter.format(new Date(isoDate));
}
