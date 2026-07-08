"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const DIET_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"];
const DRINKING_OPTIONS = ["Never", "Occasionally", "Regularly"];
const SMOKING_OPTIONS = ["Never", "Occasionally", "Regularly"];

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

export function LifestyleTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <SelectField name="diet" label="Diet" options={DIET_OPTIONS} defaultValue={defaultValues.diet} />
      <SelectField
        name="drinking"
        label="Drinking"
        options={DRINKING_OPTIONS}
        defaultValue={defaultValues.drinking}
      />
      <SelectField
        name="smoking"
        label="Smoking"
        options={SMOKING_OPTIONS}
        defaultValue={defaultValues.smoking}
      />
    </div>
  );
}