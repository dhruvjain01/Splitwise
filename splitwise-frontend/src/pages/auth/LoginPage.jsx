// 1. Import useEffect
import { useState, useEffect } from "react"; 
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [infoMsg, setInfoMsg] = useState(location.state?.msg || "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (location.state?.msg) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/groups");
    } catch (e) {
      console.log(e.response);
      setErr(e.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white grid place-items-center font-black shadow-sm">
            S
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight text-slate-900">
              Splitwise
            </div>
            <div className="text-sm text-slate-500">
              Login to continue
            </div>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-4"
        >
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500">
              Track groups, balances and expenses.
            </p>
          </div>

          {/* Info message from signup */}
          {/* Note: Now checking the state variable, not location directly */}
          {infoMsg ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex justify-between items-center">
              <span>{infoMsg}</span>
              {/* Optional: Add a close button since it is now in state */}
              <button 
                type="button" 
                onClick={() => setInfoMsg("")}
                className="text-blue-900 font-bold hover:text-blue-500"
              >
                &times;
              </button>
            </div>
          ) : null}

          {/* Error message from login */}
          {err ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {/* Inputs */}
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* Button */}
          <Button
            type="submit"
            className="w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            Login
          </Button>

          {/* Footer */}
          <div className="text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              className="text-slate-900 font-semibold hover:underline"
              to="/signup"
            >
              Signup
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}