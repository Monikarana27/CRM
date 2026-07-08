"use client";

import { useState } from "react";
import { Field } from "./field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MANGLIK_OPTIONS = ["Yes", "No", "Anshik (Partial)", "Don't Know"];

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export function ReligionHoroscopeTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          RELIGION & CASTE
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field name="religion" label="Religion" defaultValue={defaultValues.religion} />
          <Field name="caste" label="Caste" defaultValue={defaultValues.caste} />
          <Field name="subCaste" label="Sub Caste" defaultValue={defaultValues.subCaste} />
          <Field name="gotra" label="Gotra" defaultValue={defaultValues.gotra} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          HOROSCOPE
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field name="timeOfBirth" label="Time of Birth" defaultValue={defaultValues.timeOfBirth} />
          <Field name="placeOfBirth" label="Place of Birth" defaultValue={defaultValues.placeOfBirth} />
          <SelectField
            name="manglik"
            label="Manglik"
            options={MANGLIK_OPTIONS}
            defaultValue={defaultValues.manglik}
          />
        </div>
      </div>
    </div>
  );
}