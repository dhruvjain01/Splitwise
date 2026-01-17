import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";

export default function VerifyFailedPage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] p-4">
      <div className="w-full max-w-md text-center rounded-3xl border border-red-200 bg-white shadow-sm p-8 space-y-5">
        <div className="mx-auto h-14 w-14 rounded-full bg-red-100 text-red-700 grid place-items-center text-2xl">
          ✕
        </div>

        <h1 className="text-xl font-extrabold text-slate-900">
          Verification Failed
        </h1>

        <p className="text-sm text-slate-600">
          This verification link is invalid or has expired. Please signup again
          or request a new verification email.
        </p>

        <Button
          className="w-full bg-slate-900 text-white hover:bg-slate-800"
          onClick={() => nav("/login")}
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
}
