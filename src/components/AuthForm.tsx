import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlowingButton } from "./ui/GlowingButton";

export function AuthForm({ type, onSuccess }: { type: "login" | "signup", onSuccess?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {type === "signup" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Full Name</label>
          <input 
            type="text" 
            required 
            suppressHydrationWarning
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-electric/50 focus:border-brand-electric/50 transition-all placeholder:text-zinc-600"
            placeholder="John Doe"
          />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Email</label>
        <input 
          type="email" 
          required 
          suppressHydrationWarning
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-electric/50 focus:border-brand-electric/50 transition-all placeholder:text-zinc-600"
          placeholder="name@company.com"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Password</label>
          {type === "login" && (
            <a href="#" className="text-xs text-brand-electric hover:text-white transition-colors">Forgot password?</a>
          )}
        </div>
        <input 
          type="password" 
          required 
          suppressHydrationWarning
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-electric/50 focus:border-brand-electric/50 transition-all placeholder:text-zinc-600"
          placeholder="••••••••"
        />
      </div>

      <GlowingButton type="submit" className="w-full mt-6" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          type === "login" ? "Sign In" : "Create Account"
        )}
      </GlowingButton>

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase tracking-wider">or continue with</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <button type="button" className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white font-medium transition-all flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          <path d="M1 1h22v22H1z" fill="none"/>
        </svg>
        Google
      </button>
    </form>
  );
}
