import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signup(name, email, password);

      // Redirect to login with info message
      nav("/login", {
        state: {
          msg: "Signup successful! Please verify your email before logging in.",
        },
      });
    } catch (e) {
      setErr(e.response?.data?.message || "Signup failed");
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
              Create your account
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
              Get started
            </h1>
            <p className="text-sm text-slate-500">
              Create an account to manage group expenses.
            </p>
          </div>

          {err ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {/* Inputs */}
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dhruv Jain"
          />
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
            Signup
          </Button>

          {/* Footer */}
          <div className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              className="text-slate-900 font-semibold hover:underline"
              to="/login"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
