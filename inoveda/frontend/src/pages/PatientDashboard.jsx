import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { cachedGet } from "../api";
import { motion } from "framer-motion";
import {
    Plus,
    Activity,
    BrainCircuit,
    Calendar,
    FileText,
    AlertTriangle,
    ChevronRight,
    ArrowUpRight,
    Stethoscope,
    Clock,
    Shield
} from "lucide-react";
import { useSnackbar } from "notistack";

export default function PatientDashboard() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [symptomInput, setSymptomInput] = useState("");
    const [triage, setTriage] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        cachedGet("/patient/dashboard", "patient_dashboard_cache")
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const runTriage = async () => {
        if (!symptomInput) return;
        setBusy(true);
        try {
            const res = await api.post("/patient/ai-chat", { symptom_input: symptomInput });
            setTriage(res.data);
            enqueueSnackbar("Triage analysis complete", { variant: "info" });
        } catch {
            enqueueSnackbar("Unable to reach AI nodes", { variant: "error" });
        } finally {
            setBusy(false);
        }
    };

    const triggerSOS = async () => {
        try {
            await api.post("/patient/emergency");
            enqueueSnackbar("Emergency responders notified", { variant: "warning" });
        } catch {
            enqueueSnackbar("SOS signal failed", { variant: "error" });
        }
    };

    if (loading) return <div className="p-12 animate-pulse space-y-8">
        <div className="h-12 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 h-80 bg-slate-100 rounded-[2.5rem]" />
            <div className="col-span-4 h-80 bg-slate-100 rounded-[2.5rem]" />
        </div>
    </div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Terminal Hub</h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Diagnostic Network v2.4 Active
                    </p>
                </div>
                <button
                    onClick={triggerSOS}
                    className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-[0_12px_24px_-8px_rgba(220,38,38,0.2)] active:scale-95"
                >
                    Signal Regional SOS
                </button>
            </div>

            <div className="grid grid-cols-12 gap-10 items-start">

                {/* AI Triage Module (Col 8) */}
                <div className="col-span-12 lg:col-span-8 space-y-10">
                    <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden relative group">
                        <div className="absolute top-[-40px] right-[-40px] opacity-[0.03] text-blue-600 transition-transform duration-1000 group-hover:scale-125 group-hover:-rotate-12">
                            <BrainCircuit size={300} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                                    <BrainCircuit size={24} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] block mb-0.5">Clinical Protocol v2</span>
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Neural Triage Engine</span>
                                </div>
                            </div>

                            <h2 className="text-4xl font-black text-slate-900 mb-8 leading-[1.05] tracking-tight">How are you feeling <br /> in this current window?</h2>

                            <div className="relative">
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200/60 rounded-[2.5rem] p-10 outline-none focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-semibold text-slate-800 min-h-[220px] resize-none text-xl placeholder:text-slate-300 shadow-inner"
                                    placeholder="e.g. Sharp pain in the lower abdomen for 3 hours..."
                                    value={symptomInput}
                                    onChange={e => setSymptomInput(e.target.value)}
                                />
                                <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Natural language active</div>
                            </div>

                            <div className="flex justify-between items-center mt-8 px-2">
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-blue-600" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy level: clinical vault</p>
                                </div>
                                <button
                                    onClick={runTriage}
                                    disabled={busy || !symptomInput}
                                    className="bg-slate-900 text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 hover:bg-black hover:-translate-y-1 disabled:opacity-30 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    {busy ? "Neural processing..." : "Initialize Analysis"} <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </div>

                        {triage && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-12 pt-12 border-t border-slate-100"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className={`p-8 rounded-[2rem] flex items-center gap-6 ${triage.severity === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${triage.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                                            <AlertTriangle size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">State Score</p>
                                            <p className={`text-2xl font-black ${triage.severity === 'critical' ? 'text-red-900' : 'text-blue-900'}`}>{triage.severity.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm text-slate-900">
                                            <Stethoscope size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Clinic Need</p>
                                            <p className="text-xl font-black text-slate-900">{triage.recommended_specialization}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Neural Narrative Output</p>
                                    <p className="text-lg text-slate-700 font-semibold leading-relaxed italic">"{triage.ai_response}"</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sub-Actions Bento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Link to="/messages" className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium group cursor-pointer hover:border-blue-200 transition-all relative overflow-hidden">
                            <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Clinical Slots</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed pr-8">Initialize consultation sessions with verified regional specialists.</p>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:translate-x-2 transition-transform">
                                Open Terminal <ChevronRight size={14} />
                            </div>
                        </Link>
                        <Link to="/records" className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium group cursor-pointer hover:border-slate-300 transition-all relative overflow-hidden">
                            <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-10 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:scale-110">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Health Identity</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed pr-8">Access your encrypted medical ledger and decentralized RX logs.</p>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-all">
                                View Ledger <ChevronRight size={14} />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Sidebar Stats (Col 4) */}
                <div className="col-span-12 lg:col-span-4 space-y-10">
                    {/* Vitals Command */}
                    <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,23,42,0.3)] group">
                        <div className="absolute top-[-100px] right-[-100px] opacity-[0.05] pointer-events-none group-hover:scale-125 transition-transform duration-[3s]">
                            <Activity size={400} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-14">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">System Pulsar</p>
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md"><Activity size={14} className="text-blue-500" /></div>
                            </div>

                            <div className="mb-14">
                                <div className="flex items-end gap-4 mb-2">
                                    <p className="text-7xl font-black tracking-tighter leading-none italic">72</p>
                                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-1.5">BPM Average</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 3, 8, 4, 2, 7, 5].map((h, i) => (
                                        <div key={i} className="flex-1 bg-white/10 group-hover:bg-blue-500/40 transition-colors h-4 rounded-full" style={{ opacity: i / 12 }} />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5">
                                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">SpO2</span>
                                    <span className="text-2xl font-black tracking-tighter">98%</span>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5">
                                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Sys/Dia</span>
                                    <span className="text-xl font-black tracking-tighter">120/80</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Clinical Queue</span>
                            </div>
                            <div className="bg-slate-50 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300"><Plus size={14} /></div>
                        </div>

                        {data?.appointments === 0 ? (
                            <div className="text-center py-10 opacity-30 grayscale saturate-0">
                                <Calendar size={32} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No active sessions</p>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col group cursor-pointer hover:border-slate-300 transition-all">
                                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">Dr. Arya Swamy</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Tomorrow • 10:30 AM</p>
                                <div className="mt-6 flex items-center gap-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-2/3" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Intelligence Card */}
                    <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-500/20 group cursor-pointer overflow-hidden relative">
                        <div className="absolute bottom-[-10px] right-[-10px] opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                            <Stethoscope size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-lg border border-white/20">
                                <Stethoscope size={20} />
                            </div>
                            <h4 className="text-xl font-black tracking-tight mb-4 leading-tight">National Health <br /> Tip of the day.</h4>
                            <p className="text-blue-100 text-sm font-medium leading-relaxed italic opacity-80">"Early diagnostic reporting reduces regional outbreak risks by up to 65% in monsoon windows."</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
