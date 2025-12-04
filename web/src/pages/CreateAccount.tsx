import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithRememberChoice } from "../data/authStore";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button, Pill } from "../components/ui";

function isAmazonEmail(email: string) {
  return /^[a-z0-9._%+-]+@amazon\.com$/i.test(email.trim());
}

function CreateAccountPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailOk = useMemo(() => isAmazonEmail(email), [email]);

  async function handleCreateAccount() {
    setError(null);

    if (!name.trim()) return setError("Name is required.");
    if (!emailOk) return setError("Must be a valid @amazon.com email.");
    if (!password.trim()) return setError("Password is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    if (!teamCode.trim()) return setError("Team code is required.");

    try {
      setLoading(true);
      
      // Try EC2 backend first
      const response = await fetch("http://3.137.44.19:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password, teamCode }),
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

      setSuccess(true);
      setTimeout(() => nav("/"), 1500);
    } catch {
      // Fallback to localStorage mock for testing
      console.log("Backend unavailable, using local mock");
      const mockToken = "mock_" + Math.random().toString(36).slice(2);
      const mockUserId = "user_" + Math.random().toString(36).slice(2);
      
      localStorage.setItem("token", mockToken);
      localStorage.setItem("user_id", mockUserId);
      localStorage.setItem("username", name);
      signInWithRememberChoice(mockUserId, true);

      setSuccess(true);
      setTimeout(() => nav("/"), 1500);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
            <CheckCircle2 size={32} />
          </div>
          <div className="text-2xl font-extrabold text-white">Account created</div>
          <div className="text-sm text-slate-400 mt-2">Welcome, <b>{name}</b></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 mb-3">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join your team</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />

          <div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@amazon.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
            {email.length > 0 && (
              <div className="mt-1">
                {emailOk ? (
                  <Pill tone="success">Confirmed</Pill>
                ) : (
                  <Pill tone="danger">Must end with @amazon.com</Pill>
                )}
              </div>
            )}
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />

          <input
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            placeholder="Team code"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold tracking-wide text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <Button onClick={handleCreateAccount} disabled={loading} className="w-full mt-4">
            {loading ? "Creating..." : "Create Account"}
          </Button>

          <button
            onClick={() => nav("/login")}
            className="w-full text-sm text-slate-400 hover:text-blue-400 transition font-medium"
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountPage;
export { CreateAccountPage as CreateAccount };
