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

const MARITAL_STATUS_OPTIONS = ["Never Married", "Divorced", "Widowed", "Any"];
const MANGLIK_OPTIONS = ["Yes", "No", "Doesn't Matter"];
const CHILDREN_OK_OPTIONS = ["Yes", "No", "Doesn't Matter"];
const DIET_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Doesn't Matter"];
const DRINKING_SMOKING_OPTIONS = ["Never", "Occasionally", "Doesn't Matter"];

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

export function PartnerPreferenceTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  const pp = defaultValues.partnerPreference ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          AGE & HEIGHT
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field name="ppMinAge" label="Min Age" type="number" defaultValue={pp.minAge} />
          <Field name="ppMaxAge" label="Max Age" type="number" defaultValue={pp.maxAge} />
          <Field name="ppMinHeight" label="Min Height" defaultValue={pp.minHeight} />
          <Field name="ppMaxHeight" label="Max Height" defaultValue={pp.maxHeight} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          BASIC PREFERENCES
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            name="ppMaritalStatus"
            label="Marital Status"
            options={MARITAL_STATUS_OPTIONS}
            defaultValue={pp.maritalStatus}
          />
          <Field name="ppMotherTongue" label="Mother Tongue" defaultValue={pp.motherTongue} />
          <Field name="ppReligion" label="Religion" defaultValue={pp.religion} />
          <Field name="ppCaste" label="Caste" defaultValue={pp.caste} />
          <SelectField
            name="ppManglikStatus"
            label="Manglik Status"
            options={MANGLIK_OPTIONS}
            defaultValue={pp.manglikStatus}
          />
          <SelectField
            name="ppHasChildrenOk"
            label="Partner Has Children?"
            options={CHILDREN_OK_OPTIONS}
            defaultValue={pp.hasChildrenOk}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          LOCATION PREFERENCES
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field name="ppCountry" label="Country" defaultValue={pp.country} />
          <Field name="ppState" label="State" defaultValue={pp.state} />
          <Field name="ppCity" label="City" defaultValue={pp.city} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          EDUCATION & CAREER
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field name="ppQualification" label="Qualification" defaultValue={pp.qualification} />
          <Field name="ppWorkingWith" label="Working With" defaultValue={pp.workingWith} />
          <Field name="ppProfession" label="Profession" defaultValue={pp.profession} />
          <Field name="ppAnnualIncome" label="Annual Income" defaultValue={pp.annualIncome} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          LIFESTYLE
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField name="ppDiet" label="Diet" options={DIET_OPTIONS} defaultValue={pp.diet} />
          <SelectField
            name="ppDrinking"
            label="Drinking"
            options={DRINKING_SMOKING_OPTIONS}
            defaultValue={pp.drinking}
          />
          <SelectField
            name="ppSmoking"
            label="Smoking"
            options={DRINKING_SMOKING_OPTIONS}
            defaultValue={pp.smoking}
          />
        </div>
      </div>

      <TextAreaField
        name="ppAboutDesiredPartner"
        label="About Desired Partner"
        defaultValue={pp.aboutDesiredPartner}
      />
    </div>
  );
}