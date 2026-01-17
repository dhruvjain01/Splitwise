import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifySuccessPage() {
  const nav = useNavigate();

 useEffect(() => {
    const timer = setTimeout(() => {
      nav("/groups");
    }, 2000); // ⏳ 2 second delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] p-4">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 text-center space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900">
          Logging you in...
        </h1>
        <p className="text-sm text-slate-500">
          Your email is verified. Redirecting to dashboard.
        </p>
      </div>
    </div>
  );
}
