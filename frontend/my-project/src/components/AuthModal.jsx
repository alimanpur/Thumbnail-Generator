import { useState, useContext } from 'react';
import { Mail, Lock, X, Loader2 } from 'lucide-react';
import { RiGoogleLine } from 'react-icons/ri';
import { AuthContext } from '../AuthContext';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useContext(AuthContext);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                onClose();
            } else {
                await register(email, password);
                // Automatically log them in after registration
                await login(email, password);
                onClose();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="absolute inset-0 z-0"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {isLogin
                            ? 'Sign in to access your AI Studio history'
                            : 'Join the Premium AI Studio today'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-sm px-6 py-3.5 rounded-[11px] flex items-center justify-center transition-all duration-300 group-hover:bg-transparent">
                            <span className="font-semibold text-[15px] tracking-wide text-white flex items-center gap-2">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                            </span>
                        </div>
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>

                <button
                    type="button"
                    className="mt-6 w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all"
                    onClick={() => alert("Google OAuth requires additional backend setup. Use Email/Password for now.")}
                >
                    <RiGoogleLine className="w-5 h-5" />
                    Continue with Google
                </button>

                <p className="mt-8 text-center text-sm text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>

            </div>
        </div>
    );
}
