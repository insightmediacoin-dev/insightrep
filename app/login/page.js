"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  PHONE_STORAGE_KEY,
  toE164India,
} from "@/lib/phone";

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);

  const e164 = toE164India(digits);
  const phoneValid = e164 !== null;

  const setOtpDigit = useCallback((index, raw) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }, []);

  const onOtpKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const onOtpPaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const chars = text.split("");
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < 6; i += 1) {
        next[i] = chars[i] ?? "";
      }
      return next;
    });
    const last = Math.min(chars.length, 5);
    inputsRef.current[last]?.focus();
  }, []);

  async function sendOtp() {
    setError("");
    if (!e164) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not send OTP.");
        return;
      }
      setStep("otp");
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    if (!e164) {
      setError("Missing phone number.");
      return;
    }
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Verification failed.");
        return;
      }
      localStorage.setItem(PHONE_STORAGE_KEY, e164);
      router.push("/setup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-sm font-medium text-text-muted transition hover:text-white"
        >
          ← Back
        </Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 shadow-xl sm:p-8">
          <p className="text-sm font-medium text-accent">Owner login</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Sign in with phone
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            We use a one-time password. In test mode use{" "}
            <span className="font-mono text-white">123456</span>.
          </p>

          {step === "phone" && (
            <div className="mt-8 space-y-4">
              <label className="block text-sm font-medium text-white">
                Mobile number
              </label>
              <div className="flex rounded-xl border border-white/15 bg-navy/60 focus-within:border-accent/50">
                <span className="flex shrink-0 items-center border-r border-white/10 px-3 text-sm font-medium text-text-muted">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="9876543210"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-text-muted/60"
                  value={digits}
                  onChange={(e) =>
                    setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
              </div>
              {error && (
                <p className="text-sm text-accent" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                disabled={!phoneValid || loading}
                onClick={sendOtp}
                className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/25 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="mt-8 space-y-6">
              <p className="text-sm text-text-muted">
                Code sent to{" "}
                <span className="font-medium text-white">{e164}</span>
              </p>
              <div
                className="flex justify-center gap-2 sm:gap-3"
                onPaste={onOtpPaste}
              >
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                    className="h-12 w-10 rounded-lg border border-white/15 bg-navy/80 text-center text-lg font-semibold text-white outline-none focus:border-accent sm:h-14 sm:w-12"
                  />
                ))}
              </div>
              {error && (
                <p className="text-center text-sm text-accent" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep("phone");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  Change number
                </button>
                <button
                  type="button"
                  disabled={loading || otp.join("").length !== 6}
                  onClick={verifyOtp}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/25 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Verifying…" : "Verify"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
