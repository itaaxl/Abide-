"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import {
  forgotPasswordAction,
  resendVerificationAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  type FormState,
} from "@/app/auth/actions";
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

export function SignInForm({ next }: { next: string }) {
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
      {state.fieldErrors?.unverified && state.email && <ResendForm email={state.email} />}
    </div>
  );
}

export function ResendForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, {});
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  return (
    <form
      action={(fd) => {
        setCooldown(60);
        action(fd);
      }}
      className="space-y-2"
    >
      <Status state={state} />
      <input type="hidden" name="email" value={email} />
      <button className="btn w-full" disabled={pending || cooldown > 0}>
        {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
      </button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Status state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <button className="btn btn-primary w-full" disabled={pending}>
        Send reset link
      </button>
    </form>
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
