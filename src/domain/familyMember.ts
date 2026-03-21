export const FAMILY_MEMBER_ROLES = ["parent", "child"] as const;

export type FamilyMemberRole = (typeof FAMILY_MEMBER_ROLES)[number];

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  role: FamilyMemberRole;
  age?: number;
  color: string;
}

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export function isFamilyMemberRole(value: string): value is FamilyMemberRole {
  return (FAMILY_MEMBER_ROLES as readonly FamilyMemberRole[]).includes(
    value as FamilyMemberRole
  );
}

export function parseFamilyMemberRole(value: unknown): FamilyMemberRole {
  if (typeof value !== "string" || !isFamilyMemberRole(value)) {
    throw new Error(
      `Role must be one of: ${FAMILY_MEMBER_ROLES.join(", ")}`
    );
  }
  return value;
}

/**
 * Validates a hex color (#RGB or #RRGGBB). Returns the string if valid; otherwise throws.
 */
export function parseMemberColor(value: unknown): string {
  if (typeof value !== "string" || !HEX_COLOR_REGEX.test(value)) {
    throw new Error("Color must be a hex value (e.g. #f59e0b)");
  }
  return value;
}

/**
 * Validates name: non-empty string after trim. Throws if invalid.
 */
export function parseMemberName(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Name must be a string");
  }
  const name = value.trim();
  if (!name) {
    throw new Error("Name is required");
  }
  return name;
}

/**
 * Validates optional age: non-negative integer in a reasonable range (0–120). Throws if invalid.
 */
export function parseMemberAge(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 0 || n > 120) {
    throw new Error("Age must be between 0 and 120");
  }
  return n;
}

/**
 * Validates family member input for create/update. Returns a sanitized shape; does not set id or userId.
 */
export function validateFamilyMemberInput(input: {
  name?: unknown;
  role?: unknown;
  age?: unknown;
  color?: unknown;
}): {
  name: string;
  role: FamilyMemberRole;
  age?: number;
  color: string;
} {
  return {
    name: parseMemberName(input.name),
    role: parseFamilyMemberRole(input.role ?? "child"),
    age: parseMemberAge(input.age),
    color: parseMemberColor(input.color ?? "#f59e0b"),
  };
}
