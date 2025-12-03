import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithRememberChoice } from "../data/authStore";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  User2,
  KeyRound,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

function isAmazonEmail(email: string) {
  return /^[a-z0-9._%+-]+@amazon\.com$/i.test(email.trim());
}

function CreateAccountPage() {
  const nav = useNavigate();

  const [step, setStep] = useState<"form" | "password" | "done">("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => isAmazonEmail(email), [email]);

  function handleContinue() {
    setError(null);

    if (!name.trim()) return setError("Name is required.");
    if (!emailOk) return setError("Must be a valid @amazon.com email.");

    setStep("password");
  }

  async function handleCreateAccount() {
    setError(null);

    if (!password.trim()) return setError("Password is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    if (!teamCode.trim()) return setError("Team code is required.");

    try {
      setLoading(true);
      const response = await fetch("http://3.137.44.19:8080/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
          teamCode: teamCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        return setError(data.error || "Registration failed.");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username);
      signInWithRememberChoice(data.user_id, true);

      setStep("done");
    } catch (e: any) {
      setError(e.message ?? "Failed to create account.");
    } finally {
      setLoading(false);
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

        {/* FORM STEP */}
        {step === "form" && (
          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <ShieldCheck size={16} />
                Amazon-only access
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Enter your name and Amazon email to get started.
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

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleContinue} disabled={!emailOk || !name.trim()}>
                <Send size={16} />
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* PASSWORD STEP */}
        {step === "password" && (
          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <KeyRound size={16} />
                Create a password & enter team code
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Choose a strong password and enter your team code.
              </div>
            </div>

            <Field label="Password" icon={KeyRound}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300"
              />
              <div className="mt-2 text-xs text-slate-500">
                At least 8 characters
              </div>
            </Field>

            <Field label="Confirm password" icon={KeyRound}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300"
              />
            </Field>

            <Field label="Team code" icon={User2}>
              <input
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="SBN-OPS"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold tracking-wide text-slate-900 outline-none focus:border-slate-300"
              />
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
              <Button onClick={handleCreateAccount} disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === "done" && (
          <div className="space-y-3 px-4 pb-8 pt-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600/10 text-emerald-700">
              <CheckCircle2 size={26} />
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              Account created
            </div>
            <div className="text-sm text-slate-600">
              Welcome, <b>{name}</b>
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
