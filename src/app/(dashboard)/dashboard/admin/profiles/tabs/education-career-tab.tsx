import { Field } from "./field";

export function EducationCareerTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field
        name="highestQualification"
        label="Highest Qualification"
        defaultValue={defaultValues.highestQualification}
      />
      <Field
        name="educationField"
        label="Education Field"
        defaultValue={defaultValues.educationField}
      />
      <Field name="institute" label="Institute" defaultValue={defaultValues.institute} />
      <Field name="workLocation" label="Work Location" defaultValue={defaultValues.workLocation} />
      <Field name="workingWith" label="Working With" defaultValue={defaultValues.workingWith} />
      <Field name="profession" label="Profession" defaultValue={defaultValues.profession} />
      <Field name="businessName" label="Business Name" defaultValue={defaultValues.businessName} />
      <Field name="designation" label="Designation" defaultValue={defaultValues.designation} />
      <Field name="annualIncome" label="Annual Income" defaultValue={defaultValues.annualIncome} />
    </div>
  );
}