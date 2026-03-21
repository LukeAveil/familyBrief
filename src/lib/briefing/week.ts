import moment from "moment";

/** Calendar date as YYYY-MM-DD for DB / API wire format. */
export function toIsoDateString(d: Date): string {
  return moment(d).format("YYYY-MM-DD");
}

/**
 * Parse an ISO date or datetime string into a calendar Date (start of local day).
 */
export function parseIsoDate(s: string): Date {
  const strict = moment(s, "YYYY-MM-DD", true);
  if (strict.isValid()) {
    return strict.startOf("day").toDate();
  }
  const loose = moment(s);
  if (!loose.isValid()) {
    throw new Error(`Invalid date: ${s}`);
  }
  return loose.startOf("day").toDate();
}

/** Monday of the ISO week containing `date`. */
export function getWeekStart(date: Date): Date {
  return moment(date).startOf("isoWeek").toDate();
}

/** Sunday of the ISO week that starts on `weekStartMonday`. */
export function getWeekEnd(weekStartMonday: Date): Date {
  return moment(weekStartMonday).clone().add(6, "days").startOf("day").toDate();
}

/** Today at start of local day. */
export function getToday(): Date {
  return moment().startOf("day").toDate();
}

/** Label for email subject / headings, e.g. "17 March". */
export function formatWeekOfLabel(weekStartMonday: Date): string {
  return moment(weekStartMonday).format("D MMMM");
}
