import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Shield, Zap } from "lucide-react";

export default function Home() {
    return (
        <div className="bg-white min-h-screen">
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <Activity size={24} className="text-blue-600" />
                    <span className="text-xl font-bold tracking-tight text-slate-900">INOVEDA</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                    <Link to="/register" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold mb-8 uppercase tracking-widest"
                        >
                            <Zap size={14} /> AI Health Intelligence v2.0
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter mb-8"
                        >
                            Precision care <br />
                            <span className="text-blue-600">redefined.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-500 max-w-lg leading-relaxed mb-10 font-medium"
                        >
                            A unified clinical command center connecting rural patients to AI-powered triage and specialized care networks.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap items-center gap-6"
                        >
                            <Link to="/register" className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] text-lg font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-2">
                                Join Network <ArrowRight size={20} />
                            </Link>
                            <button className="px-6 py-4 text-lg font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest text-sm">See Architecture</button>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="hidden lg:block relative"
                    >
                        <div className="bg-slate-50 rounded-[4rem] p-10 aspect-[4/3] flex items-center justify-center border border-slate-100 shadow-2xl relative overflow-hidden group">
                            <div className="bg-white w-full h-full rounded-[3rem] shadow-premium p-8 flex flex-col gap-6 relative z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Activity size={28} /></div>
                                        <div className="space-y-2 pt-2">
                                            <div className="h-4 bg-slate-100 rounded-full w-24" />
                                            <div className="h-3 bg-slate-50 rounded-full w-32" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400">Live Dashboard</div>
                                </div>
                                <div className="flex-1 flex gap-4">
                                    <div className="w-1/3 bg-slate-50 rounded-3xl border border-slate-100" />
                                    <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col p-6">
                                        <div className="flex-1 space-y-4">
                                            {[1, 2, 3].map(i => <div key={i} className="h-2 bg-slate-200 rounded-full" style={{ width: `${100 - i * 20}%` }} />)}
                                        </div>
                                        <div className="h-12 bg-blue-600 rounded-2xl w-full" />
                                    </div>
                                </div>
                            </div>
                            {/* Floating elements */}
                            <div className="absolute top-[20%] left-[-20px] bg-white p-5 rounded-2xl shadow-premium border border-slate-100 flex items-center gap-3 z-20 hover:scale-105 transition-transform duration-500">
                                <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Regional Guard Active</span>
                            </div>
                            <div className="absolute bottom-[10%] right-[30px] bg-blue-600 p-6 rounded-[2.5rem] shadow-2xl shadow-blue-400/30 text-white z-20">
                                <Zap size={24} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>
                </div>

                {/* Features Bento Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-40">
                    {[
                        { title: "AI Triage", desc: "Instant clinical analysis and risk assessment.", icon: <Zap /> },
                        { title: "Tele-Specialist", desc: "Connect with district experts in seconds.", icon: <Activity /> },
                        { title: "Secure Records", desc: "Encrypted health identity for medical providers.", icon: <Shield /> }
                    ].map((f, i) => (
                        <div key={i} className="group p-10 rounded-[3rem] bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all hover:shadow-premium duration-500 cursor-pointer">
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-12">
                                {f.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{f.title}</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                    <Activity size={20} className="text-blue-600" />
                    <span className="text-lg font-black tracking-tight text-slate-900">INOVEDA</span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">© 2024 National Health Core</p>
                <div className="flex gap-10">
                    {["Services", "Network", "Privacy"].map(l => <a key={l} className="text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest" href="#">{l}</a>)}
                </div>
            </footer>
        </div>
    );
}
