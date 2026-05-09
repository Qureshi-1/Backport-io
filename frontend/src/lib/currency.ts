// ─── Currency Localization Utility ────────────────────────────────────────────
// Detects user's country from timezone and returns localized pricing

export type CurrencyCode = "INR" | "USD" | "AED" | "PKR" | "EUR" | "GBP";

export interface LocalizedPrice {
  code: CurrencyCode;
  symbol: string;
  plus: number;
  pro: number;
  locale: string;
}

export const PRICING: Record<CurrencyCode, LocalizedPrice> = {
  INR: { code: "INR", symbol: "₹", plus: 499, pro: 999, locale: "en-IN" },
  USD: { code: "USD", symbol: "$", plus: 5.99, pro: 11.99, locale: "en-US" },
  AED: { code: "AED", symbol: "AED", plus: 22, pro: 44, locale: "ar-AE" },
  PKR: { code: "PKR", symbol: "Rs", plus: 1670, pro: 3340, locale: "ur-PK" },
  EUR: { code: "EUR", symbol: "€", plus: 5.49, pro: 10.99, locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", plus: 4.79, pro: 9.59, locale: "en-GB" },
};

export function detectUserCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
    if (tz === "Asia/Dubai" || tz === "Asia/Muscat") return "AED";
    if (tz === "Asia/Karachi" || tz === "Asia/Lahore") return "PKR";
    if (tz === "Europe/London") return "GBP";
    if (tz.startsWith("Europe/")) return "EUR";
  } catch {}
  return "USD";
}

export function formatPrice(amount: number, currency: LocalizedPrice): string {
  if (currency.code === "INR") {
    return `${currency.symbol}${Math.round(amount)}`;
  }
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export const ALL_CURRENCIES: CurrencyCode[] = ["INR", "USD", "AED", "PKR", "EUR", "GBP"];
