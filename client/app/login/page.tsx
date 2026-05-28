"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, ArrowRight, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type Step = "mobile" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isLoggedIn } = useAuthStore();

  const [step, setStep]           = useState<Step>("mobile");
  const [mobile, setMobile]       = useState("");
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Send OTP ───────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(mobile);
      toast.success("OTP sent to +91 " + mobile);
      setStep("otp");
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ─────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Verify OTP ────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join("");
    if (otpStr.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(mobile, otpStr);
      setUser(data.user);
      toast.success("Welcome to HostelHub! 🎉");
      router.replace("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const otpComplete = otp.every(Boolean);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg mb-4 animate-float">
            <span className="text-white font-black text-2xl">H</span>
          </div>
          <h1 className="text-3xl font-black">
            Welcome to{" "}
            <span className="brand-text">HostelHub</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Your hostel's second-hand marketplace
          </p>
        </div>

        <Card className="overflow-hidden">
          {/* Progress indicator */}
          <div className="flex h-1 bg-muted">
            <div
              className="bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
              style={{ width: step === "mobile" ? "50%" : "100%" }}
            />
          </div>

          <CardHeader>
            {step === "mobile" ? (
              <>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Enter your number
                </CardTitle>
                <CardDescription>
                  We'll send a 6-digit OTP to verify your identity
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Verify OTP
                </CardTitle>
                <CardDescription>
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-foreground font-mono">
                    +91 {mobile}
                  </span>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {step === "mobile" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="flex gap-2">
                    {/* Country code pill */}
                    <div className="glass flex items-center px-3 rounded-xl border border-border/60 shrink-0 text-sm font-mono font-medium">
                      🇮🇳 +91
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="font-mono text-base tracking-widest"
                      autoFocus
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For students of registered hostels only
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="gradient"
                  size="lg"
                  disabled={loading || mobile.length !== 10}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending OTP…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send OTP <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP inputs */}
                <div className="space-y-2">
                  <Label>6-Digit OTP</Label>
                  <div
                    className="flex gap-2 justify-center"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={cn(
                          "otp-input",
                          digit && "border-primary/60 bg-primary/5"
                        )}
                        aria-label={`OTP digit ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend OTP in{" "}
                      <span className="font-mono font-semibold text-primary">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Resend OTP
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    variant="gradient"
                    size="lg"
                    disabled={loading || !otpComplete}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Verify & Login
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setStep("mobile"); setOtp(["","","","","",""]); }}
                  >
                    Change number
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to HostelHub's Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
