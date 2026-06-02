import { ar } from "./ar";
import { fr } from "./fr";

export type Locale = "fr" | "ar";

const catalogs = { fr, ar } as const;

let _locale: Locale = "fr";

export function setLocale(locale: Locale) {
  _locale = locale;
}
export function getLocale(): Locale {
  return _locale;
}
export function t(): typeof fr {
  return catalogs[_locale];
}
