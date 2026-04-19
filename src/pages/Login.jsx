import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/Findify");
    } catch (err) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 items-center justify-center shadow-xl shadow-slate-400/30 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to continue to Findify</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-300 text-[15px] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-300 text-[15px] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-semibold text-[15px] shadow-lg shadow-slate-400/30 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/Signup"
                className="text-slate-700 font-medium hover:text-slate-900 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
