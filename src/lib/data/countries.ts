export interface Country {
  name: string;
  iso: string;      // ISO 3166-1 alpha-2
  dialCode: string; // e.g. "+91"
  flag: string;
  length: number;   // expected local number digits
}

// Prioritized for a matrimonial CRM with NRI focus — extend as needed
export const countries: Country[] = [
  { name: "India", iso: "IN", dialCode: "+91", flag: "🇮🇳", length: 10 },
  { name: "United States", iso: "US", dialCode: "+1", flag: "🇺🇸", length: 10 },
  { name: "Canada", iso: "CA", dialCode: "+1", flag: "🇨🇦", length: 10 },
  { name: "United Kingdom", iso: "GB", dialCode: "+44", flag: "🇬🇧", length: 10 },
  { name: "United Arab Emirates", iso: "AE", dialCode: "+971", flag: "🇦🇪", length: 9 },
  { name: "Saudi Arabia", iso: "SA", dialCode: "+966", flag: "🇸🇦", length: 9 },
  { name: "Australia", iso: "AU", dialCode: "+61", flag: "🇦🇺", length: 9 },
  { name: "Singapore", iso: "SG", dialCode: "+65", flag: "🇸🇬", length: 8 },
  { name: "New Zealand", iso: "NZ", dialCode: "+64", flag: "🇳🇿", length: 9 },
  { name: "Germany", iso: "DE", dialCode: "+49", flag: "🇩🇪", length: 10 },
  { name: "Qatar", iso: "QA", dialCode: "+974", flag: "🇶🇦", length: 8 },
  { name: "Kuwait", iso: "KW", dialCode: "+965", flag: "🇰🇼", length: 8 },
  { name: "Oman", iso: "OM", dialCode: "+968", flag: "🇴🇲", length: 8 },
  { name: "Malaysia", iso: "MY", dialCode: "+60", flag: "🇲🇾", length: 9 },
  { name: "South Africa", iso: "ZA", dialCode: "+27", flag: "🇿🇦", length: 9 },
];

export const defaultCountry = countries[0]; // India

// Split a stored E.164 number ("+919876543210") back into country + local part.
// Used when populating the edit form.
export function parseStoredPhone(phone?: string | null): {
  country: Country;
  local: string;
} {
  if (!phone) return { country: defaultCountry, local: "" };

  const match = countries
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length) // longest prefix first
    .find((c) => phone.startsWith(c.dialCode));

  if (!match) return { country: defaultCountry, local: phone.replace(/\D/g, "") };

  return { country: match, local: phone.slice(match.dialCode.length) };
}