const fs = require("fs");
const path = "src/actions/leads/lead.actions.ts";

let content = fs.readFileSync(path, "utf8");
let changes = 0;

// 1. createLeadAction — add gender to parse
const createParseOld = `  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    gender: formData.get("gender"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
    followUpDate: formData.get("followUpDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.lead.findFirst({
    where: { phone: parsed.data.phone },
  });`;

if (content.includes(createParseOld)) {
  console.log("createLeadAction parse already has gender — skipping parse edit.");
} else {
  console.log("createLeadAction parse missing gender — check manually, pattern not matched exactly.");
}

// 2. createLeadAction — add gender to prisma.lead.create data
const createDataOld = `  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source || null,`;

const createDataNew = `  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      gender: parsed.data.gender || null,
      source: parsed.data.source || null,`;

if (content.includes(createDataOld)) {
  content = content.replace(createDataOld, createDataNew);
  changes++;
  console.log("✔ Patched createLeadAction data block (added gender).");
} else {
  console.log("✘ createLeadAction data block pattern not found — no change made.");
}

// 3. updateLeadAction — add gender to parse
const updateParseOld = `  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
    followUpDate: formData.get("followUpDate"),
  });`;

const updateParseNew = `  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    gender: formData.get("gender"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
    followUpDate: formData.get("followUpDate"),
  });`;

if (content.includes(updateParseOld)) {
  content = content.replace(updateParseOld, updateParseNew);
  changes++;
  console.log("✔ Patched updateLeadAction parse (added gender).");
} else {
  console.log("✘ updateLeadAction parse pattern not found — no change made.");
}

// 4. updateLeadAction — add gender to prisma.lead.update data
const updateDataOld = `  await prisma.lead.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source || null,`;

const updateDataNew = `  await prisma.lead.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      gender: parsed.data.gender || null,
      source: parsed.data.source || null,`;

if (content.includes(updateDataOld)) {
  content = content.replace(updateDataOld, updateDataNew);
  changes++;
  console.log("✔ Patched updateLeadAction data block (added gender).");
} else {
  console.log("✘ updateLeadAction data block pattern not found — no change made.");
}

if (changes > 0) {
  fs.writeFileSync(path, content, "utf8");
  console.log(`\nDone. ${changes} edit(s) written to ${path}`);
} else {
  console.log("\nNo edits made — file may already be patched, or formatting differs from expected. Paste the current file back if this happens.");
}