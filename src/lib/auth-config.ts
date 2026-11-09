/**
 * Email one-time code settings. OTP_LENGTH must equal Supabase Auth's
 * "Email OTP length" (production project: 8). Codes and links expire with
 * Supabase's "Email OTP expiration" (production: 900 s = 15 minutes).
 */
export const OTP_LENGTH = Number(process.env.NEXT_PUBLIC_AUTH_OTP_LENGTH) || 8;
export const OTP_EXPIRY_MINUTES = Number(process.env.NEXT_PUBLIC_AUTH_OTP_EXPIRY_MINUTES) || 15;
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Email codes are only offered once Supabase sends Abide's templates (which
 * contain {{ .Token }}). Supabase's default templates contain links only, so
 * keep this off until custom SMTP + templates are applied (docs/EMAIL.md).
 */
export const EMAIL_CODES = process.env.NEXT_PUBLIC_AUTH_EMAIL_CODES === "true";

/** "an 8-digit code" / "a 6-digit code" */
export const CODE_PHRASE = `${[8, 11, 18].includes(OTP_LENGTH) ? "an" : "a"} ${OTP_LENGTH}-digit code`;
