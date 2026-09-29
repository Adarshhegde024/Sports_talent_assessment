import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Phone, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const COUNTRY_CODES = [
  { code: "+1", label: "US/CA (+1)", flag: "🇺🇸" },
  { code: "+91", label: "India (+91)", flag: "🇮🇳" },
  { code: "+44", label: "UK (+44)", flag: "🇬🇧" },
  { code: "+61", label: "Australia (+61)", flag: "🇦🇺" },
  { code: "+49", label: "Germany (+49)", flag: "🇩🇪" },
  { code: "+33", label: "France (+33)", flag: "🇫🇷" },
  { code: "+81", label: "Japan (+81)", flag: "🇯🇵" },
  { code: "+971", label: "UAE (+971)", flag: "🇦🇪" },
  { code: "+65", label: "Singapore (+65)", flag: "🇸🇬" },
  { code: "+55", label: "Brazil (+55)", flag: "🇧🇷" },
  { code: "+27", label: "South Africa (+27)", flag: "🇿🇦" },
  { code: "+34", label: "Spain (+34)", flag: "🇪🇸" },
  { code: "+39", label: "Italy (+39)", flag: "🇮🇹" },
];

interface PhoneAuthFormProps {
  onSuccess?: () => void;
}

export function PhoneAuthForm({ onSuccess }: PhoneAuthFormProps) {
  const navigate = useNavigate();
  const { signInWithPhone, verifyPhoneOtp } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = phoneNumber.replace(/\D/g, "");
    if (cleanNum.length < 7) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setErrorMsg(null);
    setIsSending(true);

    const { error } = await signInWithPhone(fullPhone);
    setIsSending(false);

    if (error) {
      setErrorMsg(error.message || "Could not send verification code. Please check your phone number.");
      toast.error(error.message || "Failed to send OTP.");
    } else {
      setStep("otp");
      setResendTimer(60);
      toast.success(`Verification code sent to ${fullPhone}`);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setErrorMsg(null);
    setIsSending(true);
    const { error } = await signInWithPhone(fullPhone);
    setIsSending(false);

    if (error) {
      setErrorMsg(error.message || "Could not resend OTP. Please try again.");
    } else {
      setResendTimer(60);
      toast.success("New verification code sent!");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Check if pasted multiple characters
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits.slice(-1);
    setOtp(newOtp);

    // Auto advance focus
    if (digits && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) {
      setErrorMsg("Please enter all 6 digits of your verification code.");
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);

    const { error } = await verifyPhoneOtp(fullPhone, token);
    setIsVerifying(false);

    if (error) {
      setErrorMsg(error.message || "Invalid or expired code. Please try again.");
      toast.error(error.message || "Verification failed");
    } else {
      toast.success("Authenticated successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in">
          <span className="font-bold">Error:</span> {errorMsg}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className="text-xs font-semibold">
              Phone number
            </Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[125px] shrink-0 h-11 rounded-xl">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      <span className="mr-1.5">{item.flag}</span>
                      {item.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="pl-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              We'll send a 6-digit one-time password via SMS.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSending || phoneNumber.trim().length < 5}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Send Verification Code <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Verification Code</p>
              <p className="text-[11px] text-muted-foreground">
                Enter 6-digit code sent to <strong className="text-foreground">{fullPhone}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
                setErrorMsg(null);
              }}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="size-3" /> Change
            </button>
          </div>

          {/* 6 Digit OTP Input Grid */}
          <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="h-12 w-full text-center font-mono text-lg font-bold rounded-xl border border-input bg-background shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Didn't receive the code?</span>
            {resendTimer > 0 ? (
              <span className="font-mono text-muted-foreground">Resend in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="size-3" /> Resend Code
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isVerifying || otp.join("").length < 6}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
          >
            {isVerifying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Verify &amp; Continue <CheckCircle2 className="size-4" />
              </span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
