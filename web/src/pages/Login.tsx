import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  findAccountByEmail,
  signInWithRememberChoice,
} from "../data/authStore";
import {
  Mail,
  ShieldCheck,
  LogIn,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

function isAmazonEmail(email: string) {
  return /^[a-z0-9._%+-]+@amazon\.com$/i.test(email.trim());
}

function LoginPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => isAmazonEmail(email), [email]);

  function handleLogin() {
    setError(null);
    const e = email.trim().toLowerCase();

    if (!emailOk) {
      setError("Please use a valid @amazon.com email.");
      return;
    }

    const acct = findAccountByEmail(e);
    if (!acct) {
      setError("No account found for that email. Please sign up.");
      return;
    }
    if (!acct.verified) {
      setError("That account isn't verified yet. Please finish sign up.");
      return;
    }

    signInWithRememberChoice(acct.id, rememberMe);
    nav("/");
  }

  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader title="Generator Ops Login" subtitle="Amazon-only access" />

          <div className="space-y-4 px-4 pb-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <ShieldCheck size={16} />
                Secure access
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Log in using your <b>@amazon.com</b> account.
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <Mail size={14} className="text-slate-500" />
                Amazon email
              </label>

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
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Remember me next time
            </label>

            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              </div>
            )}

            <Button onClick={handleLogin} className="w-full">
              <LogIn size={16} />
              Log in
            </Button>

            <div className="text-center text-sm text-slate-600">
              Don’t have an account?{" "}
              <Link
                to="/create-account"
                className="font-extrabold text-slate-900 underline underline-offset-4 hover:text-slate-700"
              >
                Sign up
              </Link>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <CheckCircle2 size={12} />
          Mock auth enabled • real verification later
        </div>
      </div>
    </div>
  );
}

/** ✅ DEFAULT EXPORT — fixes your error */
export default LoginPage;

/** Optional named export */
export { LoginPage };
