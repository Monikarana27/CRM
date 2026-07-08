import { Field } from "./field";

export function LocationTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field name="country" label="Country" defaultValue={defaultValues.country} />
      <Field name="state" label="State" defaultValue={defaultValues.state} />
      <Field name="city" label="City" defaultValue={defaultValues.city} />
      <Field name="citizenship" label="Citizenship" defaultValue={defaultValues.citizenship} />
      <Field name="countryGrewUp" label="Country Grew Up" defaultValue={defaultValues.countryGrewUp} />
      <Field name="visaStatus" label="Visa Status" defaultValue={defaultValues.visaStatus} />
    </div>
  );
}