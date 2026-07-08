"use client";

import { useState } from "react";
import { Field, TextAreaField } from "./field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const FAMILY_TYPE_OPTIONS = ["Nuclear", "Joint"];
const AFFLUENCE_OPTIONS = ["Middle Class", "Upper Middle Class", "Rich", "Affluent"];
const VALUES_OPTIONS = ["Traditional", "Moderate", "Liberal"];

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

export function FamilyTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field
        name="fatherOccupation"
        label="Father's Occupation"
        defaultValue={defaultValues.fatherOccupation}
      />
      <Field
        name="motherOccupation"
        label="Mother's Occupation"
        defaultValue={defaultValues.motherOccupation}
      />
      <Field
        name="brothers"
        label="Brothers"
        type="number"
        defaultValue={defaultValues.brothers ?? 0}
      />
      <Field
        name="brothersMarried"
        label="Brothers Married"
        type="number"
        defaultValue={defaultValues.brothersMarried ?? 0}
      />
      <Field
        name="sisters"
        label="Sisters"
        type="number"
        defaultValue={defaultValues.sisters ?? 0}
      />
      <Field
        name="sistersMarried"
        label="Sisters Married"
        type="number"
        defaultValue={defaultValues.sistersMarried ?? 0}
      />
      <SelectField
        name="familyType"
        label="Family Type"
        options={FAMILY_TYPE_OPTIONS}
        defaultValue={defaultValues.familyType}
      />
      <SelectField
        name="affluence"
        label="Affluence"
        options={AFFLUENCE_OPTIONS}
        defaultValue={defaultValues.affluence}
      />
      <SelectField
        name="familyValues"
        label="Values"
        options={VALUES_OPTIONS}
        defaultValue={defaultValues.familyValues}
      />
      <Field
        name="familyAnnualIncome"
        label="Family Annual Income"
        defaultValue={defaultValues.familyAnnualIncome}
      />
      <TextAreaField
        name="familyBio"
        label="Family Bio"
        defaultValue={defaultValues.familyBio}
      />
    </div>
  );
}