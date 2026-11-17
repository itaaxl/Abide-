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
import { CODE_PHRASE, EMAIL_CODES, OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/auth-config";
import { PASSWORD_RULES } from "@/lib/validation";
import { useMsg, useT } from "../LocaleProvider";

const RULE_TEXT: Record<string, [string, string, string]> = {
  length: ["At least 10 characters", "Au moins 10 caractères", "10 أحرف على الأقل"],
  letter: ["At least one letter", "Au moins une lettre", "حرف واحد على الأقل"],
  number: ["At least one number", "Au moins un chiffre", "رقم واحد على الأقل"],
};

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
  const msg = useMsg();
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
          {msg(error)}
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
  const T = useT();
  const msg = useMsg();
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
          {visible ? T("Hide", "Masquer", "إخفاء") : T("Show", "Afficher", "إظهار")}
          <span className="sr-only"> {T("password", "le mot de passe", "كلمة المرور")}</span>
        </button>
      </div>
      {showRules && (
        <ul id={`${id}-rules`} className="mt-2 space-y-1 text-sm">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} className={ok ? "text-success" : "text-muted"}>
                <span aria-hidden="true">{ok ? "✓" : "○"}</span> {RULE_TEXT[r.id] ? T(...RULE_TEXT[r.id]) : r.label}
                <span className="sr-only">{ok ? T(" (met)", " (respecté)", " (متحقّق)") : T(" (not yet met)", " (pas encore)", " (لم يتحقّق بعد)")}</span>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-danger">
          {msg(error)}
        </p>
      )}
    </div>
  );
}

function Status({ state }: { state: FormState }) {
  const msg = useMsg();
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {msg(state.error)}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-lg border border-success/40 bg-success/5 p-3 text-sm text-success">
          {msg(state.message)}
        </p>
      )}
    </>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, {});
  const T = useT();
  const msg = useMsg();
  return (
    <form action={action} className="space-y-4" noValidate>
      <Status state={state} />
      <Field label={T("Email", "E-mail", "البريد الإلكتروني")} name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} defaultValue={state.email} />
      <PasswordField label={T("Password", "Mot de passe", "كلمة المرور")} name="password" showRules autoComplete="new-password" error={state.fieldErrors?.password} />
      <PasswordField label={T("Confirm password", "Confirmer le mot de passe", "تأكيد كلمة المرور")} name="confirm" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-1 h-5 w-5" aria-invalid={Boolean(state.fieldErrors?.terms)} />
          <span>
            {T("I agree to the ", "J’accepte les ", "أوافق على ")}
            <Link href="/terms" className="underline">{T("terms", "conditions", "الشروط")}</Link>
            {T(" and have read the ", " et j’ai lu la ", " وقرأت ")}
            <Link href="/privacy" className="underline">{T("privacy policy", "politique de confidentialité", "سياسة الخصوصية")}</Link>.
          </span>
        </label>
        {state.fieldErrors?.terms && <p className="mt-1 text-sm text-danger">{msg(state.fieldErrors.terms)}</p>}
      </div>
      <button className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
        {pending ? T("Creating account…", "Création du compte…", "جارٍ إنشاء الحساب…") : T("Create account", "Créer un compte", "إنشاء حساب")}
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
  const T = useT();
  return (
    <form action={action} className="space-y-3" noValidate>
      <Status state={state} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor={id} className="label">
          {T(`${OTP_LENGTH}-digit code from the email`, `Code à ${OTP_LENGTH} chiffres reçu par e-mail`, `الرمز المكوّن من ${OTP_LENGTH} أرقام من الرسالة`)}
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
          {T(`Codes expire after ${OTP_EXPIRY_MINUTES} minutes and work once. Only the newest code is valid.`, `Les codes expirent après ${OTP_EXPIRY_MINUTES} minutes et ne servent qu’une fois. Seul le plus récent est valide.`, `تنتهي صلاحية الرموز بعد ${OTP_EXPIRY_MINUTES} دقيقة وتعمل مرة واحدة. أحدث رمز فقط صالح.`)}
        </p>
      </div>
      <button className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
        {pending
          ? T("Checking…", "Vérification…", "جارٍ التحقق…")
          : purpose === "recovery"
            ? T("Continue to new password", "Choisir un nouveau mot de passe", "المتابعة إلى كلمة مرور جديدة")
            : purpose === "signup"
              ? T("Continue", "Continuer", "متابعة")
              : T("Sign in", "Se connecter", "تسجيل الدخول")}
      </button>
    </form>
  );
}

/** Preferred sign-in: email a one-time code; password sign-in remains available. */
export function SignInForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"code" | "password">(EMAIL_CODES ? "code" : "password");
  const T = useT();
  if (!EMAIL_CODES) return <PasswordSignIn next={next} />;
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label={T("How to sign in", "Mode de connexion", "طريقة تسجيل الدخول")} className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1">
        {(["code", "password"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            className={`rounded-full px-3 py-2 text-sm ${mode === m ? "bg-ink text-paper" : "text-muted"}`}
            onClick={() => setMode(m)}
          >
            {m === "code" ? T("Email me a code", "Recevoir un code", "أرسل لي رمزًا") : T("Use password", "Mot de passe", "استخدم كلمة المرور")}
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
  const T = useT();
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
          <Field label={T("Email", "E-mail", "البريد الإلكتروني")} name="email" type="email" autoComplete="email" defaultValue={state.email} />
        )}
        <button className={`btn w-full ${sent ? "" : "btn-primary"}`} disabled={pending || cooldown > 0} aria-busy={pending}>
          {pending
            ? T("Sending…", "Envoi…", "جارٍ الإرسال…")
            : cooldown > 0
              ? T(`Send a new code in ${cooldown}s`, `Nouveau code dans ${cooldown} s`, `رمز جديد بعد ${cooldown} ث`)
              : sent
                ? T("Send a new code", "Envoyer un nouveau code", "أرسل رمزًا جديدًا")
                : T("Email me a sign-in code", "Recevoir un code de connexion", "أرسل لي رمز الدخول")}
        </button>
      </form>
      {sent && (
        <>
          <CodeForm email={state.email!} purpose="login" next={next} />
          <a href="/auth/sign-in" className="block text-center text-sm text-muted underline">
            {T("Use a different email", "Utiliser une autre adresse", "استخدم بريدًا آخر")}
          </a>
        </>
      )}
      {!sent && (
        <p className="text-xs text-muted">
          {T(`No password needed. We’ll email you ${CODE_PHRASE} that works once.`, `Pas de mot de passe. Nous vous envoyons un code à ${OTP_LENGTH} chiffres, valable une fois.`, `لا حاجة لكلمة مرور. سنرسل لك رمزًا من ${OTP_LENGTH} أرقام يعمل مرة واحدة.`)}
        </p>
      )}
    </div>
  );
}

function PasswordSignIn({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, {});
  const T = useT();
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Status state={state} />
        <input type="hidden" name="next" value={next} />
        <Field label={T("Email", "E-mail", "البريد الإلكتروني")} name="email" type="email" autoComplete="email" defaultValue={state.email} />
        <PasswordField label={T("Password", "Mot de passe", "كلمة المرور")} name="password" autoComplete="current-password" />
        <button className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
          {pending ? T("Signing in…", "Connexion…", "جارٍ تسجيل الدخول…") : T("Sign in", "Se connecter", "تسجيل الدخول")}
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
  const T = useT();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.cooldown) setCooldown(state.cooldown);
  }
  return (
    <form action={action} className="space-y-2">
      <Status state={state} />
      <input type="hidden" name="email" value={email} />
      <button className="btn w-full" disabled={pending || cooldown > 0} aria-busy={pending}>
        {pending
          ? T("Sending…", "Envoi…", "جارٍ الإرسال…")
          : cooldown > 0
            ? T(`Resend available in ${cooldown}s`, `Renvoi possible dans ${cooldown} s`, `إعادة الإرسال بعد ${cooldown} ث`)
            : T("Resend verification email", "Renvoyer l’e-mail de vérification", "أعد إرسال رسالة التأكيد")}
      </button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});
  const [cooldown, setCooldown] = useCooldown();
  const T = useT();
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
        {sent ? <input type="hidden" name="email" value={state.email} /> : <Field label={T("Email", "E-mail", "البريد الإلكتروني")} name="email" type="email" autoComplete="email" defaultValue={state.email} />}
        <button className={`btn w-full ${sent ? "" : "btn-primary"}`} disabled={pending || cooldown > 0} aria-busy={pending}>
          {pending
            ? T("Sending…", "Envoi…", "جارٍ الإرسال…")
            : cooldown > 0
              ? T(`Send again in ${cooldown}s`, `Renvoyer dans ${cooldown} s`, `أعد الإرسال بعد ${cooldown} ث`)
              : sent
                ? T("Send a new reset email", "Renvoyer un e-mail", "أرسل رسالة جديدة")
                : T("Send reset email", "Envoyer l’e-mail de réinitialisation", "أرسل رسالة إعادة التعيين")}
        </button>
      </form>
      {sent && EMAIL_CODES && (
        <>
          <p className="text-sm text-muted">{T("Tap the button in the email, or enter its code here:", "Touchez le bouton de l’e-mail, ou saisissez son code ici :", "اضغط الزر في الرسالة أو أدخل رمزها هنا:")}</p>
          <CodeForm email={state.email!} purpose="recovery" />
        </>
      )}
    </div>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, {});
  const T = useT();
  return (
    <form action={action} className="space-y-4" noValidate>
      <Status state={state} />
      <PasswordField label={T("New password", "Nouveau mot de passe", "كلمة مرور جديدة")} name="password" showRules autoComplete="new-password" error={state.fieldErrors?.password} />
      <PasswordField label={T("Confirm new password", "Confirmer le nouveau mot de passe", "تأكيد كلمة المرور الجديدة")} name="confirm" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <button className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
        {T("Update password", "Mettre à jour le mot de passe", "تحديث كلمة المرور")}
      </button>
    </form>
  );
}
