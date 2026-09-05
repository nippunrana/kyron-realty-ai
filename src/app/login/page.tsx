"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
} from "lucide-react";
import { LoginShowcase } from "@/components/login/LoginShowcase";
import { BASE_PATH } from "@/lib/base-path";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState<boolean | null>(null);
  const [showOAuthNotice, setShowOAuthNotice] = useState(false);

  // Check auth error in URL or query params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback") {
      setErrorMsg("Google sign-in could not be completed. Please try again or sign in with email.");
    } else if (errorParam === "Configuration") {
      setShowOAuthNotice(true);
      setErrorMsg("Google OAuth is not configured properly. Please verify AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET in .env.");
    } else if (errorParam === "CredentialsSignin") {
      setErrorMsg("Invalid email or password. Please try again.");
    }
  }, [searchParams]);

  // Check if Google OAuth is configured via backend status check
  useEffect(() => {
    fetch(`${BASE_PATH}/api/auth/status`)
      .then((res) => res.json())
      .then((data) => {
        setGoogleOAuthConfigured(Boolean(data.googleConfigured));
      })
      .catch(() => {
        setGoogleOAuthConfigured(false);
      });
  }, []);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return false;
    }
    if (!password || password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return false;
    }
    if (password.length > 128) {
      setErrorMsg("Password cannot exceed 128 characters.");
      return false;
    }
    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Please enter your full name.");
      return false;
    }
    return true;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setSuccessMsg("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Register user via API
        const res = await fetch(`${BASE_PATH}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Failed to create account. Please try again.");
          setIsLoading(false);
          return;
        }

        setSuccessMsg("Account created! Signing you in...");

        // Auto sign-in after registration
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setMode("signin");
          setSuccessMsg("Account created successfully. Please sign in with your credentials.");
          setIsLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        // Sign In with credentials
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setErrorMsg("Invalid credentials. Please verify your email and password.");
          setIsLoading(false);
          return;
        }

        setSuccessMsg("Sign in successful! Redirecting to dashboard...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Auth submission error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setInfoMsg("");
    setSuccessMsg("");
    setShowOAuthNotice(false);

    if (googleOAuthConfigured === false) {
      setShowOAuthNotice(true);
      return;
    }

    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: `${BASE_PATH}/dashboard` });
    } catch {
      setErrorMsg("Unable to connect to Google OAuth. Please verify credentials in .env.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 max-w-lg mx-auto lg:max-w-none lg:w-full">
      {/* Top Bar / Logo */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Kyron Realty AI Homepage">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Kyron Realty
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              AI
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {/* Header Titles */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {mode === "signin"
              ? "Sign in to access your AI real estate intelligence dashboard, automated valuations, and deal pipelines."
              : "Join over 540+ institutional investors and brokers leveraging real-time predictive real estate intelligence."}
          </p>
        </div>

        {/* OAuth Warning Banner (when Google keys not in .env) */}
        {showOAuthNotice && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-amber-950">
                Google OAuth Setup Notice
              </p>
              <p className="mt-0.5 text-amber-800 leading-normal">
                Google OAuth is awaiting <code className="px-1 py-0.5 bg-amber-100/80 rounded font-mono text-[11px]">AUTH_GOOGLE_ID</code> & <code className="px-1 py-0.5 bg-amber-100/80 rounded font-mono text-[11px]">AUTH_GOOGLE_SECRET</code> in <code className="font-mono">.env</code>. You can sign in or register with email below.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Info Banner */}
        {infoMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-medium">{infoMsg}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {/* Social Authentication: Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60 cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-50 px-3 text-slate-400 font-medium uppercase tracking-wider">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="login-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="login-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work or Personal Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setInfoMsg("To reset your password in development, please register a new account or update your credentials in the database.");
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {mode === "signup" && (
              <p className="mt-1 text-[11px] text-slate-500">
                Must contain at least 8 characters.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>{mode === "signin" ? "Signing in..." : "Creating account..."}</span>
              </>
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Kyron" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center text-xs text-slate-600">
          {mode === "signin" ? (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setInfoMsg("");
                  setSuccessMsg("");
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer"
              >
                Sign up for free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setInfoMsg("");
                  setSuccessMsg("");
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Security & FUD Trust Footer */}
      <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>256-bit SSL Encrypted & SOC-2 Compliant</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:text-slate-800 transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/" className="hover:text-slate-800 transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* Left Column: High-Aesthetic Luxury Real Estate Intelligence Showcase */}
      <LoginShowcase />

      {/* Right Column: Minimal Clean Authentication Interface */}
      <div className="flex flex-col justify-center bg-slate-50 relative z-10 border-t lg:border-t-0 lg:border-l border-slate-200/80 shadow-sm lg:shadow-none">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-hidden="true" />
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
