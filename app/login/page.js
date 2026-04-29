"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  OWNER_IDENTIFIER_STORAGE_KEY,
  OWNER_IDENTIFIER_TYPE_STORAGE_KEY,
  PHONE_STORAGE_KEY,
  isValidEmail,
  toE164India,
} from "@/lib/phone";

const OTP_EMPTY = ["", "", "", "", "", ""];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("phone");
  const [step, setStep] = useState("input");
  const [digits, setDigits] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(OTP_EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);

  const e164 = toE164India(digits);
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = mode === "phone" ? e164 : normalizedEmail;
  const canSend = mode === "phone" ? Boolean(e164) : isValidEmail(normalizedEmail);

  const setOtpDigit = useCallback((index, raw) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) inputsRef.current[index + 1]?.focus();
  }, []);

  const onOtpKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }, [otp]);

  const onOtpPaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const chars = text.split("");
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < 6; i += 1) next[i] = chars[i] ?? "";
      return next;
    });
    inputsRef.current[Math.min(chars.length, 5)]?.focus();
  }, []);

  async function sendCode() {
    setError("");
    if (!identifier) {
      setError(mode === "phone" ? "Enter a valid 10-digit mobile number." : "Enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const url = mode === "phone" ? "/api/send-otp" : "/api/send-email-otp";
      const payload = mode === "phone" ? { phone: identifier } : { email: identifier };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not send OTP.");
        return;
      }
      setStep("otp");
      setOtp(OTP_EMPTY);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError("");
    const code = otp.join("");
    if (!identifier) {
      setError("Missing identifier.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const url = mode === "phone" ? "/api/verify-otp" : "/api/verify-email-otp";
      const payload = mode === "phone" ? { phone: identifier, otp: code } : { email: identifier, otp: code };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Verification failed.");
        return;
      }
      localStorage.setItem(OWNER_IDENTIFIER_STORAGE_KEY, identifier);
    localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
      localStorage.setItem(OWNER_IDENTIFIER_TYPE_STORAGE_KEY, mode);
      localStorage.setItem(PHONE_STORAGE_KEY, identifier);
      if (data.hasProfile) {
        router.push("/dashboard");
      } else {
        router.push("/setup");
      }    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm font-medium text-text-muted transition hover:text-white">← Back</Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 shadow-xl sm:p-8">
          <p className="text-sm font-medium text-accent">Owner login</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Secure sign in</h1>

          <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-navy/70 p-1">
            {[{id:"phone",label:"Login with Phone"},{id:"email",label:"Login with Email"}].map((t)=> (
              <button key={t.id} type="button" disabled={step==="otp"} onClick={()=>{setMode(t.id);setError("");setOtp(OTP_EMPTY);setStep("input");}}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${mode===t.id?"bg-accent text-white":"text-text-muted hover:text-white"} ${step==="otp"?"opacity-60":""}`}>{t.label}</button>
            ))}
          </div>

          {step === "input" ? (
            <div className="mt-8 space-y-4">
              {mode === "phone" ? (
                <>
                  <label className="block text-sm font-medium text-white">Mobile number</label>
                  <div className="flex rounded-xl border border-white/15 bg-navy/60 focus-within:border-accent/50">
                    <span className="flex shrink-0 items-center border-r border-white/10 px-3 text-sm font-medium text-text-muted">+91</span>
                    <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="9876543210"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-text-muted/60"
                      value={digits} onChange={(e)=>setDigits(e.target.value.replace(/\D/g,"").slice(0,10))} />
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-white">Email address</label>
                  <input type="email" autoComplete="email" placeholder="owner@yourbusiness.com"
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-base text-white outline-none placeholder:text-text-muted/60 focus:border-accent/50"
                    value={email} onChange={(e)=>setEmail(e.target.value)} />
                </>
              )}
              {error ? <p className="text-sm text-accent" role="alert">{error}</p> : null}
              <button type="button" disabled={!canSend || loading} onClick={sendCode}
                className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/25 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <p className="text-sm text-text-muted">Code sent to <span className="font-medium text-white">{identifier}</span></p>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={onOtpPaste}>
                {otp.map((d,i)=>(<input key={i} ref={(el)=>{inputsRef.current[i]=el;}} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1}
                  value={d} onChange={(e)=>setOtpDigit(i,e.target.value)} onKeyDown={(e)=>onOtpKeyDown(i,e)}
                  className="h-12 w-10 rounded-lg border border-white/15 bg-navy/80 text-center text-lg font-semibold text-white outline-none focus:border-accent sm:h-14 sm:w-12"/>))}
              </div>
              {error ? <p className="text-center text-sm text-accent" role="alert">{error}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={loading} onClick={()=>{setStep("input");setOtp(OTP_EMPTY);setError("");}} className="flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-sm font-medium text-white transition hover:bg-white/5">Change {mode === "phone" ? "number" : "email"}</button>
                <button type="button" disabled={loading || otp.join("").length!==6} onClick={verifyCode} className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/25 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Verifying…" : "Verify"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
