const fs = require("fs");

const filePath = "src/app/api/upload/route.ts";
const raw = fs.readFileSync(filePath, "utf8");
const usesCRLF = raw.includes("\r\n");
const lines = raw.split(/\r\n|\n/);

const anchor = 'export async function POST(req: NextRequest) {';
const anchorIdx = lines.findIndex((l) => l.trim() === anchor);

if (anchorIdx === -1) {
  console.error("ABORT: could not find anchor line. No changes made.");
  process.exit(1);
}

let depth = 0;
let endIdx = -1;
for (let i = anchorIdx; i < lines.length; i++) {
  const opens = (lines[i].match(/{/g) || []).length;
  const closes = (lines[i].match(/}/g) || []).length;
  depth += opens - closes;
  if (depth === 0 && i > anchorIdx) {
    endIdx = i;
    break;
  }
}

if (endIdx === -1) {
  console.error("ABORT: could not find end of POST function. No changes made.");
  process.exit(1);
}

const newFunctionLines = [
  'const ALLOWED_TYPES: Record<string, string> = {',
  '  "image/jpeg": ".jpg",',
  '  "image/png": ".png",',
  '  "image/webp": ".webp",',
  '  "application/pdf": ".pdf",',
  '};',
  'const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB',
  '',
  'export async function POST(req: NextRequest) {',
  '  const session = await auth();',
  '  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });',
  '  if (!session.user.active) {',
  '    return NextResponse.json({ error: "Account is inactive" }, { status: 403 });',
  '  }',
  '  if (!["SUPER_ADMIN", "ADMIN", "SERVICE", "PROFILE_CREATOR"].includes(session.user.role)) {',
  '    return NextResponse.json({ error: "Forbidden" }, { status: 403 });',
  '  }',
  '',
  '  const formData = await req.formData();',
  '  const file = formData.get("file") as File;',
  '  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });',
  '',
  '  const ext = ALLOWED_TYPES[file.type];',
  '  if (!ext) {',
  '    return NextResponse.json(',
  '      { error: "Only JPEG, PNG, WEBP, or PDF files are allowed" },',
  '      { status: 400 }',
  '    );',
  '  }',
  '  if (file.size > MAX_FILE_BYTES) {',
  '    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });',
  '  }',
  '',
  '  const bytes = await file.arrayBuffer();',
  '  const filename = `${crypto.randomUUID()}${ext}`;',
  '  const filepath = path.join(process.cwd(), "public", "uploads", filename);',
  '',
  '  await writeFile(filepath, Buffer.from(bytes));',
  '',
  '  return NextResponse.json({ url: `/uploads/${filename}` });',
  '}',
];

const before = lines.slice(0, anchorIdx);
const after = lines.slice(endIdx + 1);
const result = [...before, ...newFunctionLines, ...after];

const eol = usesCRLF ? "\r\n" : "\n";
const output = result.join(eol);

fs.writeFileSync(filePath + ".bak", raw, "utf8");
fs.writeFileSync(filePath, output, "utf8");

console.log("Patch applied. Original backed up to " + filePath + ".bak");
console.log("Lines replaced: " + anchorIdx + " to " + endIdx + " (" + (endIdx - anchorIdx + 1) + " lines) -> " + newFunctionLines.length + " new lines");
