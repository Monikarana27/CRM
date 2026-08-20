#!/usr/bin/env python3
"""
Running patch script for the Sangam CRM audit.

Each fix found during the audit gets added here as one entry in FIXES
below. Re-run this same file after every phase — already-applied fixes
are detected and skipped automatically, so it's always safe to re-run
top to bottom.

Run from the ROOT of your repo (the folder containing src/ and prisma/):

    python3 apply-audit-fixes.py

If a file's content doesn't match what a fix expects (e.g. you already
hand-edited it), that fix prints a WARN for that file and leaves it
untouched rather than guessing.
"""

import re
import sys
from pathlib import Path

ROOT = Path.cwd()


# =============================================================================
# Small helpers used by fixes below
# =============================================================================

def read(rel):
    p = ROOT / rel
    return p.read_text(encoding="utf-8") if p.exists() else None


def write(rel, content):
    (ROOT / rel).write_text(content, encoding="utf-8")


def ensure_import(content, anchor, import_line):
    if import_line in content:
        return content
    if anchor not in content:
        raise RuntimeError(f"expected import anchor not found: {anchor!r}")
    return content.replace(anchor, anchor + "\n" + import_line, 1)


def replace_whole_file(rel, old_exact, new_exact, already_marker):
    """One fix = one file rewritten wholesale. Returns 'fixed'/'skipped'/'warn'."""
    content = read(rel)
    if content is None:
        return "warn", f"file not found: {rel}"
    if already_marker in content:
        return "skipped", None
    if old_exact not in content:
        return "warn", f"content didn't match expected shape in {rel}"
    write(rel, content.replace(old_exact, new_exact))
    return "fixed", None


def replace_sites(rel, replacements, import_anchor=None, import_line=None):
    """
    replacements: list of (old, new) exact-string pairs within one file.
    Applies whichever of them haven't already landed; skips ones that have.
    """
    content = read(rel)
    if content is None:
        return "warn", f"file not found: {rel}", 0
    if all(new in content for _, new in replacements):
        return "skipped", None, 0
    try:
        if import_anchor:
            content = ensure_import(content, import_anchor, import_line)
    except RuntimeError as e:
        return "warn", f"{rel}: {e}", 0

    applied = 0
    warnings = []
    for old, new in replacements:
        if new in content:
            continue
        if old not in content:
            warnings.append(f"expected pattern not found in {rel}: {old[:60]}...")
            continue
        content = content.replace(old, new, 1)
        applied += 1

    if applied:
        write(rel, content)
    if warnings:
        return ("fixed" if applied else "warn"), "; ".join(warnings), applied
    return ("fixed" if applied else "skipped"), None, applied


def replace_regex_all(rel, pattern, repl, already_marker, import_anchor=None, import_line=None):
    content = read(rel)
    if content is None:
        return "warn", f"file not found: {rel}", 0
    matches = len(pattern.findall(content))
    if matches == 0:
        if already_marker in content:
            return "skipped", None, 0
        return "warn", f"no matching call sites found in {rel}", 0
    try:
        if import_anchor:
            content = ensure_import(content, import_anchor, import_line)
    except RuntimeError as e:
        return "warn", f"{rel}: {e}", 0
    content = pattern.sub(repl, content)
    write(rel, content)
    return "fixed", None, matches


# =============================================================================
# FIXES — append one entry per audit finding. Each is a zero-arg function
# that returns a list of (status, detail) tuples, status in
# {"fixed", "skipped", "warn"}.
# =============================================================================

AUTH_IMPORT_ANCHOR = 'import { auth } from "@/lib/auth/auth";'
ACTING_USER_IMPORT = 'import { getActingUserId } from "@/lib/auth/get-acting-user";'


def fix_impersonation_audit_trail():
    """
    Phase 1 (permissions/auth): ActivityLog entries were attributed to the
    impersonator's own user ID instead of the real admin while impersonating,
    which defeats the audit trail. Routes every ActivityLog write through
    getActingUserId(), which already resolves to the real admin correctly.
    Content-authorship fields (createdById, authorId, ProfileRemark/LeadRemark
    actorId, workspace Notification actorId) are intentionally left alone —
    those should stay as the impersonated user.
    """
    results = []

    # 1. shared helper: accept an already-fetched session
    HELPER_OLD = '''import { auth } from "@/lib/auth/auth";

/**
 * Returns the ID that should be recorded as the actor in ActivityLog.
 * If currently impersonating, returns the REAL admin's ID, not the
 * impersonated user's ID — so audit trails stay accurate.
 */
export async function getActingUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.impersonating && session.user.originalUserId
    ? session.user.originalUserId
    : session.user.id;
}'''
    HELPER_NEW = '''import { auth } from "@/lib/auth/auth";

type ActingSession = {
  user?: {
    id: string;
    impersonating?: boolean;
    originalUserId?: string;
  } | null;
};

/**
 * Returns the ID that should be recorded as the actor in ActivityLog.
 * If currently impersonating, returns the REAL admin's ID, not the
 * impersonated user's ID — so audit trails stay accurate.
 *
 * Pass an already-fetched `session` when the caller has one in scope
 * (most action files already call `await auth()` for other reasons)
 * to avoid a redundant auth() lookup. Falls back to fetching its own
 * session when none is passed.
 */
export async function getActingUserId(session?: ActingSession): Promise<string> {
  const resolved = session ?? (await auth());
  if (!resolved?.user) throw new Error("Unauthorized");
  return resolved.user.impersonating && resolved.user.originalUserId
    ? resolved.user.originalUserId
    : resolved.user.id;
}'''
    status, detail = replace_whole_file(
        "src/lib/auth/get-acting-user.ts", HELPER_OLD, HELPER_NEW,
        already_marker="session?: ActingSession",
    )
    results.append((status, detail or "src/lib/auth/get-acting-user.ts"))

    # 2. direct activityLog.create() calls
    direct_fixes = {
        "src/actions/profiles/approval.actions.ts": [
            ('actorId: session.user.id, action: "APPROVE_PROFILE"',
             'actorId: await getActingUserId(session), action: "APPROVE_PROFILE"'),
            ('actorId: session.user.id, action: "REQUEST_PROFILE_CHANGES"',
             'actorId: await getActingUserId(session), action: "REQUEST_PROFILE_CHANGES"'),
        ],
        "src/actions/profiles/email-profile.action.ts": [
            ('data: { actorId: session.user.id, action: "EMAIL_PROFILE"',
             'data: { actorId: await getActingUserId(session), action: "EMAIL_PROFILE"'),
        ],
        "src/actions/profiles/send-matches.action.ts": [
            ('data: { actorId: session.user.id, action: "SEND_MATCHED_PROFILES"',
             'data: { actorId: await getActingUserId(session), action: "SEND_MATCHED_PROFILES"'),
        ],
        "src/actions/profile-shares/profile-share.actions.ts": [
            ('      data: {\n        actorId: session.user.id,\n        action: "SEND_SEARCHED_PROFILES",',
             '      data: {\n        actorId: await getActingUserId(session),\n        action: "SEND_SEARCHED_PROFILES",'),
        ],
        "src/actions/sales-targets/sales-target.actions.ts": [
            ('  await prisma.activityLog.create({\n    data: {\n      actorId: session.user.id,\n      action: "ADD_ACHIEVEMENT",',
             '  await prisma.activityLog.create({\n    data: {\n      actorId: await getActingUserId(session),\n      action: "ADD_ACHIEVEMENT",'),
        ],
        "src/actions/leads/lead-remark.actions.ts": [
            ('data: { actorId: session.user.id, action: `LEAD_CALL_${outcome}`',
             'data: { actorId: await getActingUserId(session), action: `LEAD_CALL_${outcome}`'),
        ],
        "src/actions/settings/settings.actions.ts": [
            ('data: { actorId: session.user.id, action: "UPDATE_SETTING"',
             'data: { actorId: await getActingUserId(session), action: "UPDATE_SETTING"'),
        ],
        "src/actions/profile-queue/create-from-queue.action.ts": [
            ('data: { actorId: session.user.id, action: "CREATE_PROFILE_FROM_QUEUE"',
             'data: { actorId: await getActingUserId(session), action: "CREATE_PROFILE_FROM_QUEUE"'),
        ],
        "src/actions/profile-queue/profile-queue.actions.ts": [
            ('data: { actorId: session.user.id, action: "SEND_TO_PROFILE_CREATION"',
             'data: { actorId: await getActingUserId(session), action: "SEND_TO_PROFILE_CREATION"'),
        ],
        "src/actions/profile-queue/create-draft-and-complete.actions.ts": [
            ('  await prisma.activityLog.create({\n    data: {\n      actorId: session.user.id,\n      action: "CREATE_DRAFT_PROFILE_FROM_QUEUE",',
             '  await prisma.activityLog.create({\n    data: {\n      actorId: await getActingUserId(session),\n      action: "CREATE_DRAFT_PROFILE_FROM_QUEUE",'),
            ('  await prisma.activityLog.create({\n    data: {\n      actorId: session.user.id,\n      action: "COMPLETE_PROFILE_FROM_QUEUE",',
             '  await prisma.activityLog.create({\n    data: {\n      actorId: await getActingUserId(session),\n      action: "COMPLETE_PROFILE_FROM_QUEUE",'),
        ],
        "src/actions/payment-offers/payment-offer.actions.ts": [
            ('  await prisma.activityLog.create({\n    data: {\n      actorId: session.user.id,\n      action: "OFFER_CREATED",',
             '  await prisma.activityLog.create({\n    data: {\n      actorId: await getActingUserId(session),\n      action: "OFFER_CREATED",'),
            ('data: { actorId: session.user.id, action: "OFFER_CANCELLED"',
             'data: { actorId: await getActingUserId(session), action: "OFFER_CANCELLED"'),
        ],
    }
    for rel, sites in direct_fixes.items():
        status, detail, _n = replace_sites(rel, sites, AUTH_IMPORT_ANCHOR, ACTING_USER_IMPORT)
        results.append((status, detail or rel))

    # 3. files routing through a local logActivity(actorId, ...) helper
    log_activity_files = [
        "src/actions/plans/plan.actions.ts",
        "src/actions/employees/employee.actions.ts",
        "src/actions/employees/team-assignment.actions.ts",
        "src/actions/profiles/profile.actions.ts",
        "src/actions/meetings/meeting.actions.ts",
        "src/actions/master-data/master-data.actions.ts",
        "src/actions/leads/lead.actions.ts",
        "src/actions/call-logs/call-log.actions.ts",
        "src/actions/payments/payment.actions.ts",
        "src/actions/subscriptions/subscription.actions.ts",
    ]
    pattern = re.compile(r'logActivity\(\s*session\.user\.id\s*,')
    repl = 'logActivity(await getActingUserId(session),'
    for rel in log_activity_files:
        status, detail, n = replace_regex_all(
            rel, pattern, repl,
            already_marker="logActivity(await getActingUserId(session)",
            import_anchor=AUTH_IMPORT_ANCHOR, import_line=ACTING_USER_IMPORT,
        )
        label = f"{rel} ({n} site(s))" if status == "fixed" else (detail or rel)
        results.append((status, label))

    return results


# Register every fix here, in the order they were found. Append new ones
# as new phases turn up issues — don't remove old entries, they become
# no-ops (SKIP) once applied.
FIXES = [
    ("Phase 1: impersonation audit-trail (actorId)", fix_impersonation_audit_trail),
    # ("Phase N: <next fix name>", fix_next_thing),
]


# =============================================================================
def main():
    if not (ROOT / "src").is_dir() or not (ROOT / "prisma").is_dir():
        print("ERROR: run this from the repo root (the folder containing src/ and prisma/).")
        sys.exit(1)

    total_fixed = total_skipped = total_warn = 0

    for name, fn in FIXES:
        print(f"\n=== {name} ===")
        for status, detail in fn():
            if status == "fixed":
                print(f"FIXED {detail}")
                total_fixed += 1
            elif status == "skipped":
                print(f"SKIP  (already applied) {detail}")
                total_skipped += 1
            else:
                print(f"WARN  {detail}")
                total_warn += 1

    print()
    print(f"Done. {total_fixed} change(s) applied, {total_skipped} already up to date, {total_warn} warning(s).")
    if total_warn:
        print("Review the WARN lines above — those files were left untouched because")
        print("their content didn't match what this script expected. Nothing was")
        print("guessed or force-applied.")


if __name__ == "__main__":
    main()