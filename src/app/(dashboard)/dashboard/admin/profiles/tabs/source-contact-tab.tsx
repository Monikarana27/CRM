import { Field, SelectField } from "./field";

const SOURCE_OPTIONS = ["Website", "Justdial", "Referral", "Walk-in", "Phone Inquiry", "Other"];
const CREATING_FOR_OPTIONS = ["Self", "Son", "Daughter", "Brother", "Sister", "Relative", "Friend"];

export function SourceContactTab({ defaultValues }: { defaultValues: Record<string, any> }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          PROFILE SOURCE
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            name="source"
            label="Source"
            defaultValue={defaultValues.source}
            options={SOURCE_OPTIONS}
            placeholder="Select source"
          />
          <Field name="sourceInfo" label="Source Info" defaultValue={defaultValues.sourceInfo} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          CONTACT
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field name="email" label="Email" type="email" defaultValue={defaultValues.email} />
          <Field name="altEmail" label="Alt Email" type="email" defaultValue={defaultValues.altEmail} />
          <Field name="phone" label="Phone" defaultValue={defaultValues.phone} required />
          <Field name="altPhone" label="Alt Phone" defaultValue={defaultValues.altPhone} />
          <Field name="contactPerson" label="Contact Person" defaultValue={defaultValues.contactPerson} />
          <SelectField
            name="creatingFor"
            label="Creating For"
            defaultValue={defaultValues.creatingFor}
            options={CREATING_FOR_OPTIONS}
            placeholder="Select relation"
          />
        </div>
      </div>
    </div>
  );
}