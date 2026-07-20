"use client";

import { useState, useEffect } from "react";
import { countries, defaultCountry, parseStoredPhone, type Country } from "@/lib/data/countries";

interface PhoneInputProps {
  name?: string;           // hidden input name for FormData — default "phone"
  defaultValue?: string;   // full stored E.164 value, e.g. for edit forms
  required?: boolean;
  onChange?: (fullNumber: string) => void;
}

export function PhoneInput({
  name = "phone",
  defaultValue,
  required = true,
  onChange,
}: PhoneInputProps) {
  const initial = parseStoredPhone(defaultValue);
  const [country, setCountry] = useState<Country>(initial.country);
  const [local, setLocal] = useState(initial.local);
  const [touched, setTouched] = useState(false);

  const fullNumber = local ? `${country.dialCode}${local}` : "";
  const isValid = local.length === country.length;

  useEffect(() => {
    onChange?.(fullNumber);
  }, [fullNumber, onChange]);

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <select
          value={country.iso}
          onChange={(e) => {
            const next = countries.find((c) => c.iso === e.target.value)!;
            setCountry(next);
            setLocal((prev) => prev.slice(0, next.length)); // re-clip if new max is shorter
          }}
          className="w-[110px] shrink-0 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dialCode}
            </option>
          ))}
        </select>

        <input
          type="text"
          inputMode="numeric"
          value={local}
          onBlur={() => setTouched(true)}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, country.length);
            setLocal(digitsOnly);
          }}
          placeholder={`${country.length}-digit number`}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {touched && local.length > 0 && !isValid && (
        <p className="mt-1 text-xs text-red-600">
          {country.name} numbers should be {country.length} digits ({local.length}/{country.length})
        </p>
      )}

      {/* This is what actually gets submitted via FormData */}
      <input type="hidden" name={name} value={fullNumber} required={required} />
    </div>
  );
}