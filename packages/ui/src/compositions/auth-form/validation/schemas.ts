import { type } from "arktype";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const DIGIT_REGEX = /\d/;

/**
 * Email validation schema
 * Validates email format and common requirements
 */
export const emailSchema = type("string").narrow((value, context) => {
  return EMAIL_REGEX.test(value) || context.mustBe("a valid email address");
});

/**
 * Username validation schema
 * Requirements:
 * - 3-20 characters
 * - Alphanumeric with underscores and hyphens allowed
 * - Must start with letter
 */
export const usernameSchema = type("string").narrow((value, context) => {
  if (value.length < 3) return context.mustBe("at least 3 characters");
  if (value.length > 20) return context.mustBe("at most 20 characters");
  if (!USERNAME_REGEX.test(value)) {
    return context.mustBe("a username starting with a letter and containing only letters, numbers, underscores, or hyphens");
  }
  return true;
});

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = type("string").narrow((value, context) => {
  if (value.length < 8) return context.mustBe("at least 8 characters");
  if (!UPPERCASE_REGEX.test(value)) return context.mustBe("contain at least one uppercase letter");
  if (!LOWERCASE_REGEX.test(value)) return context.mustBe("contain at least one lowercase letter");
  if (!DIGIT_REGEX.test(value)) return context.mustBe("contain at least one number");
  return true;
});

export const loginCommercialSchema = type({
  email: emailSchema,
});

export const loginNonCommercialSchema = type({
  username: usernameSchema,
  password: passwordSchema,
});

export const registerCommercialSchema = type({
  email: emailSchema,
});

export const registerNonCommercialSchema = type({
  username: usernameSchema,
  password: passwordSchema,
});

export type EmailData = typeof emailSchema.infer;
export type UsernameData = typeof usernameSchema.infer;
export type PasswordData = typeof passwordSchema.infer;
export type LoginCommercialData = typeof loginCommercialSchema.infer;
export type LoginNonCommercialData = typeof loginNonCommercialSchema.infer;
export type RegisterCommercialData = typeof registerCommercialSchema.infer;
export type RegisterNonCommercialData = typeof registerNonCommercialSchema.infer;
