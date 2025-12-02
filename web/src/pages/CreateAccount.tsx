import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAccount,
  findAccountByEmail,
  markVerified,
  signInWithRememberChoice,
} from "../data/authStore";
import { getTeamByCode, createTeam } from "../data/teamStore";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  User2,
  KeyRound,
  CheckCircle2,
  UsersRound,
  Send,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

function isAmazonEmail(email: string) {
  return /^[a-z0-9._%+-]+@amazon\.com$/i.test(email.trim());
}

function generateMockCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function CreateAccountPage() {
  const nav = useNavigate();

  const [step, setStep] = useState<"form" | "verify" | "done">("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sentCode, setSentCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");

  const emailOk = useMemo(() => isAmazonEmail(email), [email]);

  function handleSendCode() {
    setError(null);

    if (!name.trim()) return setError("Name is required.");
    if (!emailOk) return setError("Must be a valid @amazon.com email.");
    if (!teamCode.trim()) return setError("Team code is required.");
    if (findAccountByEmail(email)) {
      return setError("An account already exists for that email.");
    }

    // ✅ Team code validation
    const tc = teamCode.trim().toUpperCase();
    if (!tc) {
      return setError("Team code is required.");
    }
    if (tc.length < 3) {
      return setError("Team code must be at least 3 characters.");
    }
    // Team can be new or existing - both are allowed

    setSending(true);

    const code = generateMockCode();

    // simulate sending
    setTimeout(() => {
      setSending(false);
      setSentCode(code);
      setStep("verify"); // ✅ ALWAYS goes to verify step
      console.log("[MOCK VERIFY CODE]", code);
    }, 600);
  }

  function handleVerifyAndCreate() {
    setError(null);

    if (!sentCode) return setError("No code was sent. Go back and resend.");
    if (codeInput.trim() !== sentCode) {
      return setError("Incorrect verification code.");
    }

    try {
      const tc = teamCode.trim().toUpperCase();

      // ✅ Create team if it doesn't exist
      let team = getTeamByCode(tc);
      if (!team) {
        team = createTeam(tc, tc);
      }

      const acct = createAccount(name, email, tc);
      markVerified(acct.id);
      signInWithRememberChoice(acct.id, true);

      setStep("done");
    } catch (e: any) {
      setError(e.message ?? "Failed to create account.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader
          title="Create Account"
          subtitle="Amazon-only teams"
          right={
            <Button variant="ghost" onClick={() => nav(-1)}>
              <ArrowLeft size={16} />
              Back
            </Button>
          }
        />

        {/* ---------------- FORM STEP ---------------- */}
        {step === "form" && (
          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <ShieldCheck size={16} />
                Amazon-only access
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Enter your info, then we’ll send you a verification code.
              </div>
            </div>

            <Field label="Full name" icon={User2}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300"
              />
            </Field>

            <Field label="Amazon email" icon={Mail}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@amazon.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300"
              />
              <div className="mt-2">
                {email.length > 0 &&
                  (emailOk ? (
                    <Pill tone="success">Amazon email confirmed</Pill>
                  ) : (
                    <Pill tone="danger">Must end with @amazon.com</Pill>
                  ))}
              </div>
            </Field>

            <Field label="Team code" icon={UsersRound}>
              <input
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="SBN-OPS"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold tracking-wide text-slate-900 outline-none focus:border-slate-300"
              />
              <div className="mt-2 text-xs text-slate-500">
                <b>Chief?</b> Enter a new team code to create your team. <b>Employee?</b> Ask your Chief for the team code.
              </div>
            </Field>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSendCode} disabled={sending}>
                <Send size={16} />
                {sending ? "Sending..." : "Send verification code"}
              </Button>
            </div>
          </div>
        )}

        {/* ---------------- VERIFY STEP ---------------- */}
        {step === "verify" && (
          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <KeyRound size={16} />
                Verify your email
              </div>
              <div className="mt-1 text-xs text-slate-600">
                We sent a 6-digit code to <b>{email}</b>.
                <br />
                (Mock: open DevTools Console to see it.)
              </div>
            </div>

            <Field label="Verification code" icon={KeyRound}>
              <input
                value={codeInput}
                onChange={(e) =>
                  setCodeInput(
                    e.target.value.replace(/[^\d]/g, "").slice(0, 6)
                  )
                }
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-extrabold tracking-widest text-slate-900 outline-none focus:border-slate-300"
              />
              <div className="mt-2 text-[11px] text-slate-500">
                Didn’t get a code? Go back and resend.
              </div>
            </Field>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button onClick={handleVerifyAndCreate}>
                Verify & Create Account
              </Button>
            </div>
          </div>
        )}

        {/* ---------------- DONE STEP ---------------- */}
        {step === "done" && (
          <div className="space-y-3 px-4 pb-8 pt-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600/10 text-emerald-700">
              <CheckCircle2 size={26} />
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              Account created
            </div>
            <div className="text-sm text-slate-600">
              Team: <b>{teamCode.toUpperCase()}</b>
            </div>
            <div className="pt-2">
              <Button onClick={() => nav("/upload-brain")}>
                Continue to Team Setup
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs font-extrabold text-slate-700">
        <Icon size={14} className="text-slate-500" />
        {label}
      </div>
      {children}
    </div>
  );
}

export default CreateAccountPage;
export { CreateAccountPage as CreateAccount };


