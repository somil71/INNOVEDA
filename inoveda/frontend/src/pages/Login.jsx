import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Activity, ArrowRight, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/login", form);
            login(res.data);
            enqueueSnackbar("Welcome to your command center", { variant: "success" });
            navigate(res.data.role === "patient" ? "/patient-dashboard" : res.data.role === "doctor" ? "/doctor-dashboard" : "/admin-dashboard");
        } catch (err) {
            enqueueSnackbar(err.response?.data?.detail || "Authentication failed", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-0 bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]">

                {/* Visual Side */}
                <div className="hidden lg:flex bg-slate-900 p-24 flex-col justify-between text-white relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#3b82f6_0%,transparent_60%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))]" />
                    </div>

                    <Link to="/" className="flex items-center gap-3 relative z-10 group">
                        <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
                            <Activity size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">INOVEDA</span>
                    </Link>

                    <div className="relative z-10">
                        <h2 className="text-6xl font-black leading-[0.9] tracking-tighter mb-8">Digital health, <br /> properly secured.</h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">Access your clinical operational workspace and monitor regional service levels in real-time.</p>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-8 border-t border-white/10 pt-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified TLS 1.3</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> AES-256 Storage</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> ISO 27001 Hub</span>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex flex-col justify-center p-8 lg:p-24 bg-white">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-md mx-auto"
                    >
                        <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Sign In</h1>
                        <p className="text-slate-500 font-medium mb-12 text-lg">Authorized personnel workspace portal.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="group relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200/60 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold text-slate-900 placeholder:text-slate-400"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div className="group relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Secure Password"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200/60 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold text-slate-900 placeholder:text-slate-400"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" className="peer w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-0 transition-all cursor-pointer opacity-0 absolute inset-0 z-10" />
                                        <div className="w-5 h-5 border-2 border-slate-200 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Keep active</span>
                                </label>
                                <a href="#" className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">Forgot Keys?</a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-black hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? "Decrypting..." : "Enter Workspace"} <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="mt-16 pt-10 border-t border-slate-100 text-center">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                New? <Link to="/register" className="text-blue-600 hover:text-blue-700 font-black ml-2 underline decoration-2 underline-offset-4">Create workspace</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
