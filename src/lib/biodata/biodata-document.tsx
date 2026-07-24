import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { BiodataData } from "./build-biodata-data";

// Using react-pdf's built-in "Times-Bold" for the name/header — no network fetch
// required, so it can't crash the render route. If you later want Playfair Display,
// download the .ttf files into your project (e.g. /public/fonts/) and register them
// with Font.register({ family: "Playfair Display", fonts: [{ src: "/fonts/PlayfairDisplay-Bold.ttf", fontWeight: 700 }] })
// — a local file path is safe, a live gstatic.com fetch inside an API route is not.

const THEMES: Record<string, { primary: string; primaryDark: string; accent: string; label: string }> = {
  Hindu: { primary: "#B45309", primaryDark: "#7C2D12", accent: "#FEF3C7", label: "\u0950" },
  Muslim: { primary: "#065F46", primaryDark: "#064E3B", accent: "#D1FAE5", label: "\u262A" },
  Christian: { primary: "#1E3A8A", primaryDark: "#1E2A5E", accent: "#DBEAFE", label: "\u271D" },
  Sikh: { primary: "#B91C1C", primaryDark: "#7F1D1D", accent: "#FEE2E2", label: "\u09EA" },
  DEFAULT: { primary: "#374151", primaryDark: "#1F2937", accent: "#F3F4F6", label: "" },
};

function getTheme(religion: string | null) {
  if (!religion) return THEMES.DEFAULT;
  const key = Object.keys(THEMES).find((k) => religion.toLowerCase().includes(k.toLowerCase()));
  return key ? THEMES[key] : THEMES.DEFAULT;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#1F2937" },
  content: { padding: 32, paddingTop: 0 },

  // Layered header: a dark base band + a lighter overlay band, so it isn't one flat rect
  headerWrap: { marginBottom: 20 },
  headerBase: { height: 92, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 32 },
  headerAccentBar: { height: 6 },
  headerTitle: { fontSize: 26, fontFamily: "Times-Bold", color: "#fff" },
  headerSubtitle: { fontSize: 10, color: "#fff", marginTop: 4, opacity: 0.9, letterSpacing: 0.5 },
  headerGlyph: { fontSize: 30, color: "#fff", opacity: 0.85 },

  body: { flexDirection: "row", gap: 20 },
  photoCol: { width: 140 },

  // Framed photo: colored border "mat" behind a slightly inset image
  photoFrame: { padding: 5, borderRadius: 6, marginBottom: 10 },
  photo: { width: "100%", height: 168, objectFit: "cover", borderRadius: 3 },
  photoPlaceholder: { width: "100%", height: 168, backgroundColor: "#E5E7EB", borderRadius: 3, alignItems: "center", justifyContent: "center" },
  photoPlaceholderText: { color: "#9CA3AF", fontSize: 9, letterSpacing: 1 },

  quickFacts: { padding: 10, borderRadius: 4 },
  quickFactsTitle: { fontSize: 8, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },

  infoCol: { flex: 1 },
  section: { marginBottom: 11 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  sectionAccent: { width: 3, height: 11, marginRight: 6, borderRadius: 1 },
  sectionTitle: { fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#374151" },
  sectionRule: { flex: 1, height: 1, backgroundColor: "#E5E7EB", marginLeft: 8 },

  row: { flexDirection: "row", marginBottom: 3.5 },
  label: { width: 108, color: "#9CA3AF", fontSize: 9.5 },
  value: { flex: 1, fontSize: 9.5, color: "#1F2937" },
  aboutText: { lineHeight: 1.5, color: "#4B5563", fontSize: 9.5 },

  footer: { position: "absolute", bottom: 22, left: 32, right: 32, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 6, textAlign: "center", fontSize: 7.5, color: "#9CA3AF", letterSpacing: 0.5 },
});

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

function Section({ title, theme, children }: { title: string; theme: { primary: string }; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: theme.primary }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionRule} />
      </View>
      {children}
    </View>
  );
}

export function BiodataDocument({ data }: { data: BiodataData }) {
  const theme = getTheme(data.religion);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerWrap}>
          <View style={[styles.headerBase, { backgroundColor: theme.primaryDark }]}>
            <View>
              <Text style={styles.headerTitle}>{data.name}</Text>
              <Text style={styles.headerSubtitle}>
                {data.profileCode}  ·  {data.gender}{data.age ? `  ·  ${data.age} YRS` : ""}
              </Text>
            </View>
            {theme.label ? <Text style={styles.headerGlyph}>{theme.label}</Text> : null}
          </View>
          <View style={[styles.headerAccentBar, { backgroundColor: theme.primary }]} />
        </View>

        <View style={styles.content}>
          <View style={styles.body}>
            <View style={styles.photoCol}>
              <View style={[styles.photoFrame, { backgroundColor: theme.primary }]}>
                {data.photoUrl ? (
                  <Image src={data.photoUrl} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>NO PHOTO</Text>
                  </View>
                )}
              </View>

              <View style={[styles.quickFacts, { backgroundColor: theme.accent }]}>
                <Text style={[styles.quickFactsTitle, { color: theme.primaryDark }]}>At a Glance</Text>
                <Row label="Height" value={data.height} />
                <Row label="Weight" value={data.weightKg ? `${data.weightKg} kg` : null} />
                <Row label="Marital Status" value={data.maritalStatus} />
                <Row label="Blood Group" value={data.bloodGroup} />
              </View>
            </View>

            <View style={styles.infoCol}>
              {data.aboutYourself && (
                <Section title="About" theme={theme}>
                  <Text style={styles.aboutText}>{data.aboutYourself}</Text>
                </Section>
              )}

              <Section title="Personal Details" theme={theme}>
                <Row label="Date of Birth" value={data.dob ? new Date(data.dob).toLocaleDateString("en-IN") : null} />
                <Row label="Time of Birth" value={data.timeOfBirth} />
                <Row label="Place of Birth" value={data.placeOfBirth} />
                <Row label="Mother Tongue" value={data.motherTongue} />
                <Row label="Body Type" value={data.bodyType} />
                <Row label="Complexion" value={data.complexion} />
                <Row label="Health Status" value={data.healthStatus} />
                <Row label="Native Place" value={data.nativePlace} />
              </Section>

              <Section title="Location" theme={theme}>
                <Row label="City" value={data.city} />
                <Row label="State" value={data.state} />
                <Row label="Country" value={data.country} />
              </Section>

              <Section title="Religion & Horoscope" theme={theme}>
                <Row label="Religion" value={data.religion} />
                <Row label="Caste" value={data.caste} />
                <Row label="Sub Caste" value={data.subCaste} />
                <Row label="Gotra" value={data.gotra} />
                <Row label="Manglik" value={data.manglik} />
              </Section>

              <Section title="Education & Career" theme={theme}>
                <Row label="Qualification" value={data.highestQualification} />
                <Row label="Field" value={data.educationField} />
                <Row label="Institute" value={data.institute} />
                <Row label="Profession" value={data.profession} />
                <Row label="Working With" value={data.workingWith} />
                <Row label="Designation" value={data.designation} />
                <Row label="Annual Income" value={data.annualIncome} />
              </Section>

              {(data.diet || data.drinking || data.smoking) && (
                <Section title="Lifestyle" theme={theme}>
                  <Row label="Diet" value={data.diet} />
                  <Row label="Drinking" value={data.drinking} />
                  <Row label="Smoking" value={data.smoking} />
                </Section>
              )}

              {(data.fatherOccupation || data.motherOccupation || data.brothers || data.sisters || data.familyType || data.familyValues || data.familyBio) && (
                <Section title="Family" theme={theme}>
                  <Row label="Father's Occupation" value={data.fatherOccupation} />
                  <Row label="Mother's Occupation" value={data.motherOccupation} />
                  <Row
                    label="Siblings"
                    value={
                      data.brothers || data.sisters
                        ? `${data.brothers ?? 0} Brother(s), ${data.sisters ?? 0} Sister(s)`
                        : null
                    }
                  />
                  <Row label="Family Type" value={data.familyType} />
                  <Row label="Family Values" value={data.familyValues} />
                  {data.familyBio && <Text style={[styles.aboutText, { marginTop: 4 }]}>{data.familyBio}</Text>}
                </Section>
              )}

              {data.partnerPreference && (
                <Section title="Partner Preference" theme={theme}>
                  <Row
                    label="Age Range"
                    value={
                      data.partnerPreference.minAge || data.partnerPreference.maxAge
                        ? `${data.partnerPreference.minAge ?? "-"} to ${data.partnerPreference.maxAge ?? "-"} yrs`
                        : null
                    }
                  />
                  <Row
                    label="Height Range"
                    value={
                      data.partnerPreference.minHeight || data.partnerPreference.maxHeight
                        ? `${data.partnerPreference.minHeight ?? "-"} to ${data.partnerPreference.maxHeight ?? "-"}`
                        : null
                    }
                  />
                  <Row label="Marital Status" value={data.partnerPreference.maritalStatus} />
                  <Row label="Religion" value={data.partnerPreference.religion} />
                  <Row label="Caste" value={data.partnerPreference.caste} />
                  <Row label="Qualification" value={data.partnerPreference.qualification} />
                  <Row label="Profession" value={data.partnerPreference.profession} />
                  {data.partnerPreference.aboutDesiredPartner && (
                    <Text style={[styles.aboutText, { marginTop: 4 }]}>
                      {data.partnerPreference.aboutDesiredPartner}
                    </Text>
                  )}
                </Section>
              )}

              <Section title="Contact" theme={theme}>
                <Row label="Phone" value={data.phone} />
                <Row label="Email" value={data.email} />
              </Section>
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          GENERATED VIA SANGAM CRM  ·  {data.profileCode}
        </Text>
      </Page>
    </Document>
  );
}