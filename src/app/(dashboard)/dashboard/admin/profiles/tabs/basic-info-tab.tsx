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

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];
const MARITAL_STATUS_OPTIONS = ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"];
const BODY_TYPE_OPTIONS = ["Slim", "Athletic", "Average", "Heavy"];
const COMPLEXION_OPTIONS = ["Fair", "Wheatish", "Dusky", "Dark"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const HEALTH_STATUS_OPTIONS = ["Normal", "Physically Challenged", "Other"];

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

export function BasicInfoTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field name="name" label="Name" defaultValue={defaultValues.name} required />
      <SelectField
        name="gender"
        label="Gender"
        options={GENDER_OPTIONS}
        defaultValue={defaultValues.gender}
      />
      <Field
        name="dob"
        label="Date of Birth"
        type="date"
        defaultValue={
          defaultValues.dob
            ? new Date(defaultValues.dob).toISOString().slice(0, 10)
            : ""
        }
      />
      <SelectField
        name="maritalStatus"
        label="Marital Status"
        options={MARITAL_STATUS_OPTIONS}
        defaultValue={defaultValues.maritalStatus}
      />
      <Field name="height" label="Height" defaultValue={defaultValues.height} />
      <Field
        name="weightKg"
        label="Weight (kg)"
        type="number"
        defaultValue={defaultValues.weightKg}
      />
      <Field name="motherTongue" label="Mother Tongue" defaultValue={defaultValues.motherTongue} />
      <SelectField
        name="bodyType"
        label="Body Type"
        options={BODY_TYPE_OPTIONS}
        defaultValue={defaultValues.bodyType}
      />
      <SelectField
        name="complexion"
        label="Complexion"
        options={COMPLEXION_OPTIONS}
        defaultValue={defaultValues.complexion}
      />
      <SelectField
        name="bloodGroup"
        label="Blood Group"
        options={BLOOD_GROUP_OPTIONS}
        defaultValue={defaultValues.bloodGroup}
      />
      <SelectField
        name="healthStatus"
        label="Health Status"
        options={HEALTH_STATUS_OPTIONS}
        defaultValue={defaultValues.healthStatus}
      />
      <Field name="nativePlace" label="Native Place" defaultValue={defaultValues.nativePlace} />
      <TextAreaField
        name="aboutYourself"
        label="About Yourself"
        defaultValue={defaultValues.aboutYourself}
      />
    </div>
  );
}