import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithRememberChoice, createAccount } from "../data/authStore";
import { ShieldCheck } from "lucide-react";
import { Button, Pill } from "../components/ui";

function isAmazonEmail(email: string) {
  return /^[a-z0-9._%+-]+@amazon\.com$/i.test(email.trim());
}

function LoginPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => isAmazonEmail(email), [email]);

  async function handleLogin() {
    setError(null);
    const e = email.trim().toLowerCase();

    if (!emailOk) return setError("Please use a valid @amazon.com email.");
    if (!password.trim()) return setError("Password required.");

    try {
      // Try EC2 backend first
      const response = await fetch("http://3.137.44.19:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: e, password: password }),
      });

      if (!response.ok) {
        const data = await response.json();
        return setError(data.error || "Login failed.");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username);
      
      const acct = createAccount(data.username, e, "SBN-OPS");
      signInWithRememberChoice(acct.id, rememberMe);
      nav("/");
    } catch {
      // Fallback to localStorage mock for testing
      console.log("Backend unavailable, using local mock");
      const mockToken = "mock_" + Math.random().toString(36).slice(2);
      localStorage.setItem("token", mockToken);
      localStorage.setItem("user_id", mockToken);
      localStorage.setItem("username", e);
      
      const acct = createAccount("Test User", e, "SBN-OPS");
      signInWithRememberChoice(acct.id, rememberMe);
      nav("/");
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 mb-3">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Generator Ops</h1>
          <p className="text-slate-400 text-sm mt-1">Secure access</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-3">
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
            placeholder="Password"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
            />
            Remember me
          </label>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <Button onClick={handleLogin} className="w-full mt-4">
            Log in
          </Button>

          <button
            onClick={() => nav("/create-account")}
            className="w-full text-sm text-slate-400 hover:text-blue-400 transition font-medium"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
export { LoginPage };
