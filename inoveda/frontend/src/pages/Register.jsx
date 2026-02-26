import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Activity, ArrowRight, User, Mail, MapPin, Phone, Briefcase, Calendar, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [form, setForm] = useState({
        name: "", email: "", password: "", role: "patient", village: "", phone: "", age: "", specialization: "", consultation_fee: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                age: form.age ? Number(form.age) : null,
                consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : 0
            };
            const res = await api.post("/auth/register", payload);
            login(res.data);
            enqueueSnackbar("Registration successful", { variant: "success" });
            navigate(res.data.role === "patient" ? "/patient-dashboard" : res.data.role === "doctor" ? "/doctor-dashboard" : "/admin-dashboard");
        } catch (err) {
            enqueueSnackbar(err.response?.data?.detail || "Registration failed", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans py-20">
            <div className="max-w-7xl w-full grid lg:grid-cols-5 gap-0 bg-white rounded-[4rem] overflow-hidden border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]">

                {/* Visual Side */}
                <div className="hidden lg:flex lg:col-span-2 bg-blue-600 p-24 flex-col justify-between text-white relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                        <svg width="100%" height="100%"><pattern id="reggrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern><rect width="100%" height="100%" fill="url(#reggrid)" /></svg>
                    </div>

                    <Link to="/" className="flex items-center gap-3 relative z-10 group">
                        <div className="bg-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg">
                            <Activity size={24} className="text-blue-600" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">INOVEDA</span>
                    </Link>

                    <div className="relative z-10">
                        <h2 className="text-7xl font-black leading-[0.85] tracking-tighter mb-8">Join the <br /> National <br /> Network.</h2>
                        <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-xs mt-4">Establishing a unified digital health infrastructure for every village cluster.</p>
                    </div>

                    <div className="relative z-10 space-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
                        <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> 14.5k Providers Active</div>
                        <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> 450+ Regions Synced</div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="lg:col-span-3 flex flex-col justify-center p-8 lg:p-24 bg-white overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl mx-auto"
                    >
                        <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">Onboarding</h1>
                        <p className="text-slate-500 font-medium mb-12 text-lg">Create your clinical operational profile.</p>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                                    <div className="group relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="text" placeholder="Full legal name" required
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact</label>
                                    <div className="group relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="email" placeholder="Email address" required
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Pass</label>
                                    <div className="group relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="password" placeholder="Passphrase" required
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                        value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                    >
                                        <option value="patient">Patient Profile</option>
                                        <option value="doctor">Medical Provider</option>
                                        <option value="admin">Regional Auditor</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regional Block</label>
                                    <div className="group relative">
                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="text" placeholder="Village cluster" required
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                            value={form.village} onChange={e => setForm({ ...form, village: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No.</label>
                                    <div className="group relative">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="text" placeholder="+91 registered" required
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {form.role === "patient" && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                                        <div className="group relative">
                                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input
                                                type="number" placeholder="Ref Years" required
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                                value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {form.role === "doctor" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MD / Specialty</label>
                                            <div className="group relative">
                                                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                                <input
                                                    type="text" placeholder="Qualification" required
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-semibold"
                                                    value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Slot (₹)</label>
                                            <input
                                                type="number" placeholder="Base fee" required
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-slate-800"
                                                value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:-translate-y-1 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
                            >
                                {loading ? "Authenticating..." : "Establish Workspace"} <ArrowRight size={20} />
                            </button>
                        </form>

                        <div className="mt-16 pt-10 border-t border-slate-100 text-center">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                Already active? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-black ml-2 underline decoration-2 underline-offset-4">Sign in to console</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
