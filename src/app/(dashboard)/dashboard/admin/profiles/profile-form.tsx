"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SourceContactTab } from "./tabs/source-contact-tab";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { LocationTab } from "./tabs/location-tab";
import { ReligionHoroscopeTab } from "./tabs/religion-horoscope-tab";
import { EducationCareerTab } from "./tabs/education-career-tab";
import { LifestyleTab } from "./tabs/lifestyle-tab";
import { FamilyTab } from "./tabs/family-tab";
import { PartnerPreferenceTab } from "./tabs/partner-preference-tab";

const TABS = [
  { id: "source", label: "Source & Contact" },
  { id: "basic", label: "Basic Info" },
  { id: "location", label: "Location" },
  { id: "religion", label: "Religion & Horoscope" },
  { id: "education", label: "Education & Career" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "family", label: "Family" },
  { id: "partner", label: "Partner Preference" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ProfileFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, any>;
  action: (prevState: unknown, formData: FormData) => Promise<{ error: string | null }>;
}

export function ProfileForm({ mode, defaultValues, action }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [activeTab, setActiveTab] = useState<TabId>("source");

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);
  const isLastTab = currentIndex === TABS.length - 1;
  const isFirstTab = currentIndex === 0;

  function goNext() {
    if (!isLastTab) setActiveTab(TABS[currentIndex + 1].id);
  }
  function goBack() {
    if (!isFirstTab) setActiveTab(TABS[currentIndex - 1].id);
  }

  const dv = defaultValues ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {TABS.map((tab, idx) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {idx + 1}. {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* All tabs are rendered but hidden, so FormData always includes every field */}
          <div className={activeTab === "source" ? "" : "hidden"}>
            <SourceContactTab defaultValues={dv} />
          </div>
          <div className={activeTab === "basic" ? "" : "hidden"}>
            <BasicInfoTab defaultValues={dv} />
          </div>
          <div className={activeTab === "location" ? "" : "hidden"}>
            <LocationTab defaultValues={dv} />
          </div>
          <div className={activeTab === "religion" ? "" : "hidden"}>
            <ReligionHoroscopeTab defaultValues={dv} />
          </div>
          <div className={activeTab === "education" ? "" : "hidden"}>
            <EducationCareerTab defaultValues={dv} />
          </div>
          <div className={activeTab === "lifestyle" ? "" : "hidden"}>
            <LifestyleTab defaultValues={dv} />
          </div>
          <div className={activeTab === "family" ? "" : "hidden"}>
            <FamilyTab defaultValues={dv} />
          </div>
          <div className={activeTab === "partner" ? "" : "hidden"}>
            <PartnerPreferenceTab defaultValues={dv} />
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/profiles">Cancel</Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={isFirstTab}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {!isLastTab ? (
            <Button type="button" onClick={goNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                ? "Create Profile"
                : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}