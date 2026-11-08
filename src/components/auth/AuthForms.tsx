"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import {
  forgotPasswordAction,
  resendVerificationAction,
  resetPasswordAction,
  sendLoginCodeAction,
  signInAction,
  signUpAction,
  verifyCodeAction,
  type FormState,
} from "@/app/auth/actions";
import { EMAIL_CODES, OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/auth-config";
import { PASSWORD_RULES } from "@/lib/validation";

function Field({
  label,
  name,
  type = "text",
  error,
  defaultValue,
  autoComplete,
  describedBy,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  describedBy?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={[error ? `${id}-err` : "", describedBy ?? ""].join(" ").trim() || undefined}
        className="input"
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  label,
  name,
  error,
  showRules = false,
  autoComplete,
}: {
  label: string;
  name: string;
  error?: string;
  showRules?: boolean;
  autoComplete: string;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${showRules ? `${id}-rules ` : ""}${error ? `${id}-err` : ""}`.trim() || undefined}
          className="input pe-20"
        />
        <button
          type="button"
          className="absolute end-1 top-1 h-[36px] rounded-full px-3 text-sm text-muted hover:text-ink"
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>
      {showRules && (
        <ul id={`${id}-rules`} className="mt-2 space-y-1 text-sm">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} className={ok ? "text-success" : "text-muted"}>
                <span aria-hidden="true">{ok ? "✓" : "○"}</span> {r.label}
                <span className="sr-only">{ok ? " (met)" : " (not yet met)"}</span>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Status({ state }: { state: FormState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-lg border border-success/40 bg-success/5 p-3 text-sm text-success">
          {state.message}
        </p>
      )}
    </>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Status state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} defaultValue={state.email} />
      <PasswordField label="Password" name="password" showRules autoComplete="new-password" error={state.fieldErrors?.password} />
      <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-1 h-5 w-5" aria-invalid={Boolean(state.fieldErrors?.terms)} />
          <span>
            I agree to the <Link href="/terms" className="underline">terms</Link> and have read the{" "}
            <Link href="/privacy" className="underline">privacy policy</Link>.
          </span>
        </label>
        {state.fieldErrors?.terms && <p className="mt-1 text-sm text-danger">{state.fieldErrors.terms}</p>}
      </div>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function useCooldown(initial = 0) {
  const [cooldown, setCooldown] = useState(initial);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  return [cooldown, setCooldown] as const;
}

/**
 * Enter a Supabase-generated one-time code. Used for email sign-in,
 * verifying a new account, and password recovery.
 */
export function CodeForm({ email, purpose, next = "/" }: { email: string; purpose: "login" | "signup" | "recovery"; next?: string }) {
  const [state, action, pending] = useActionState(verifyCodeAction, {});
  const id = useId();
  return (
    <form action={action} className="space-y-3" noValidate>
      <Status state={state} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor={id} className="label">
          {OTP_LENGTH}-digit code from the email
        </label>
        <input
          id={id}
          name="code"
          className="input text-center font-mono text-2xl tracking-[0.3em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={`\\d{${OTP_LENGTH}}`}
          maxLength={OTP_LENGTH}
          minLength={OTP_LENGTH}
          required
          aria-describedby={`${id}-help`}
        />
        <p id={`${id}-help`} className="mt-1 text-xs text-muted">
          Codes expire after {OTP_EXPIRY_MINUTES} minutes and work once. Only the newest code is valid.
        </p>
      </div>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Checking…" : purpose === "recovery" ? "Continue to new password" : purpose === "signup" ? "Verify my account" : "Sign in"}
      </button>
    </form>
  );
}

/** Preferred sign-in: email a one-time code; password sign-in remains available. */
export function SignInForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"code" | "password">(EMAIL_CODES ? "code" : "password");
  if (!EMAIL_CODES) return <PasswordSignIn next={next} />;
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="How to sign in" className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1">
        {(["code", "password"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            className={`rounded-full px-3 py-2 text-sm ${mode === m ? "bg-ink text-paper" : "text-muted"}`}
            onClick={() => setMode(m)}
          >
            {m === "code" ? "Email me a code" : "Use password"}
          </button>
        ))}
      </div>
      {mode === "code" ? <CodeSignIn next={next} /> : <PasswordSignIn next={next} />}
    </div>
  );
}

function CodeSignIn({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendLoginCodeAction, {});
  const [cooldown, setCooldown] = useCooldown();
  const [lastCooldown, setLastCooldown] = useState(state);
  if (state !== lastCooldown) {
    setLastCooldown(state);
    if (state.cooldown) setCooldown(state.cooldown);
  }
  const sent = state.step === "code" && state.email;
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3" noValidate>
        <Status state={state} />
        <input type="hidden" name="next" value={next} />
        {sent ? (
          <input type="hidden" name="email" value={state.email} />
        ) : (
          <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.email} />
        )}
        <button className={`btn w-full ${sent ? "" : "btn-primary"}`} disabled={pending || cooldown > 0}>
          {pending ? "Sending…" : cooldown > 0 ? `Send a new code in ${cooldown}s` : sent ? "Send a new code" : "Email me a sign-in code"}
        </button>
      </form>
      {sent && (
        <>
          <CodeForm email={state.email!} purpose="login" next={next} />
          <a href="/auth/sign-in" className="block text-center text-sm text-muted underline">
            Use a different email
          </a>
        </>
      )}
      {!sent && <p className="text-xs text-muted">No password needed. We’ll email you a {OTP_LENGTH}-digit code that works once.</p>}
    </div>
  );
}

function PasswordSignIn({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, {});
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Status state={state} />
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.email} />
        <PasswordField label="Password" name="password" autoComplete="current-password" />
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {state.fieldErrors?.unverified && state.email && (
        <div className="space-y-3 rounded-lg border border-rule p-4">
          {EMAIL_CODES && <CodeForm email={state.email} purpose="signup" next={next} />}
          <ResendForm email={state.email} />
        </div>
      )}
    </div>
  );
}

export function ResendForm({ email, initialCooldown = 0 }: { email: string; initialCooldown?: number }) {
  const [state, action, pending] = useActionState(resendVerificationAction, {});
  const [cooldown, setCooldown] = useCooldown(initialCooldown);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.cooldown) setCooldown(state.cooldown);
  }
  return (
    <form action={action} className="space-y-2">
      <Status state={state} />
      <input type="hidden" name="email" value={email} />
      <button className="btn w-full" disabled={pending || cooldown > 0}>
        {pending ? "Sending…" : cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
      </button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});
  const [cooldown, setCooldown] = useCooldown();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.cooldown) setCooldown(state.cooldown);
  }
  const sent = state.step === "code" && state.email;
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Status state={state} />
        {sent ? <input type="hidden" name="email" value={state.email} /> : <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.email} />}
        <button className={`btn w-full ${sent ? "" : "btn-primary"}`} disabled={pending || cooldown > 0}>
          {pending ? "Sending…" : cooldown > 0 ? `Send again in ${cooldown}s` : sent ? "Send a new reset email" : "Send reset email"}
        </button>
      </form>
      {sent && EMAIL_CODES && (
        <>
          <p className="text-sm text-muted">Tap the button in the email, or enter its code here:</p>
          <CodeForm email={state.email!} purpose="recovery" />
        </>
      )}
    </div>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Status state={state} />
      <PasswordField label="New password" name="password" showRules autoComplete="new-password" error={state.fieldErrors?.password} />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <button className="btn btn-primary w-full" disabled={pending}>
        Update password
      </button>
    </form>
  );
}
