import { useState } from "react";
import api from "../api";
import { motion } from "framer-motion";
import { 
    Send, 
    AlertTriangle, 
    Activity, 
    Shield, 
    FileText, 
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import { useSnackbar } from "notistack";

export default function DiseaseReporting() {
    const { enqueueSnackbar } = useSnackbar();
    const [village, setVillage] = useState("");
    const [disease, setDisease] = useState("");
    const [severity, setSeverity] = useState("low");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/admin/disease-report", { village, disease_type: disease, severity });
            enqueueSnackbar("Diagnostic artifact recorded in global ledger", { variant: "success" });
            setVillage("");
            setDisease("");
        } catch {
            enqueueSnackbar("Protocol rejected the data entry", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Diagnostic Ingestion</h1>
                <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] mt-2 italic flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" /> Manual Metric Synchronization Active
                </p>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Form Module */}
                <div className="col-span-12 lg:col-span-12 bg-white rounded-[4rem] p-16 border border-slate-100 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.08)] relative overflow-hidden">
                    <div className="absolute top-[-50px] right-[-50px] opacity-[0.02] text-slate-900 group-hover:scale-110 transition-transform duration-[4s]">
                        <Activity size={500} />
                    </div>
                    
                    <div className="grid grid-cols-12 gap-16 relative z-10">
                        <div className="col-span-12 lg:col-span-5 space-y-8">
                            <div className="bg-slate-900 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-blue-500 shadow-2xl mb-12">
                                <FileText size={28} />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 leading-[0.95] tracking-tighter italic">Broadcast <br /> Diagnostic <br /> Pulse.</h2>
                            <p className="text-slate-400 text-base font-medium leading-relaxed opacity-80">Manually record disease prevalence across regional nodes to update neural predictive models.</p>
                            
                            <div className="pt-10 space-y-6">
                                <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><Shield size={18} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">E2E Ledger Sync Active</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="col-span-12 lg:col-span-7 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Regional Node (Village/Hub)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Raisen Block A..."
                                        className="w-full bg-slate-50 border border-slate-200/60 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-800"
                                        value={village}
                                        onChange={e => setVillage(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Pathogen/Disease Catalog</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Malaria, Viral Fever..."
                                        className="w-full bg-slate-50 border border-slate-200/60 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-800"
                                        value={disease}
                                        onChange={e => setDisease(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Regional Risk Assessment</label>
                                <div className="grid grid-cols-3 gap-6">
                                    {['low', 'medium', 'high'].map(s => (
                                        <button 
                                            key={s}
                                            type="button"
                                            onClick={() => setSeverity(s)}
                                            className={`py-8 rounded-[2rem] border transition-all text-center group ${severity === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-100/50 hover:border-slate-300'}`}
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-widest">{s}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading || !village || !disease}
                                className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
                            >
                                {loading ? "Ingesting Artifact..." : "Signal Regional Node"} <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
