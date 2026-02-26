import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { motion } from "framer-motion";
import {
    FileText,
    Upload,
    Trash2,
    Download,
    Activity,
    Plus,
    Search,
    CheckCircle2,
    Clock
} from "lucide-react";
import { useSnackbar } from "notistack";

export default function Records() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [docs, setDocs] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [docsRes, presRes] = await Promise.all([
                api.get("/patient/documents"),
                api.get("/patient/prescriptions")
            ]);
            setDocs(docsRes.data);
            setPrescriptions(presRes.data);
        } catch {
            enqueueSnackbar("Workspace sync failed", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const onUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            await api.post("/patient/documents/upload", formData);
            enqueueSnackbar("Registry updated", { variant: "success" });
            fetchData();
        } catch {
            enqueueSnackbar("Upload rejected by protocol", { variant: "error" });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-12 animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="h-96 bg-slate-100 rounded-[3rem]" />
            <div className="h-96 bg-slate-100 rounded-[3rem]" />
        </div>
    </div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Operational Log</h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] mt-2 italic flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Encrypted Health ID: {user?.id}
                    </p>
                </div>
                <label className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 cursor-pointer">
                    <Upload size={16} /> {uploading ? "Ingesting..." : "Upload Protocol"}
                    <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
                </label>
            </div>

            <div className="grid grid-cols-12 gap-10">

                {/* Clinical Documents (Col 7) */}
                <div className="col-span-12 lg:col-span-7 bg-white rounded-[4rem] border border-slate-100 shadow-premium overflow-hidden">
                    <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Medical Registry</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Immutable Diagnostic Storage</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-slate-300">
                            <Search size={18} />
                        </div>
                    </div>

                    <div className="p-12 space-y-6">
                        {docs.length === 0 ? (
                            <div className="py-20 text-center opacity-20 grayscale saturate-0">
                                <FileText size={48} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Registry empty</p>
                            </div>
                        ) : (
                            docs.map((doc, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ x: 10 }}
                                    className="flex justify-between items-center p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100/50 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-slate-900 uppercase tracking-tight">{doc.filename}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Ingested: {doc.timestamp || "Live"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all active:scale-95">
                                            <Download size={18} />
                                        </button>
                                        <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-95">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Prescriptions & Medications (Col 5) */}
                <div className="col-span-12 lg:col-span-5 space-y-10">
                    <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,23,42,0.3)] min-h-[500px] flex flex-col group">
                        <div className="absolute top-[-40px] right-[-40px] opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-[4s]">
                            <Activity size={300} />
                        </div>

                        <div className="relative z-10 flex-1">
                            <div className="flex justify-between items-start mb-12">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">RX Vector Pulse</p>
                                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/5"><Plus size={14} className="text-blue-500" /></div>
                            </div>

                            <h3 className="text-4xl font-black mb-10 leading-[1] tracking-tighter italic">Active <br /> Pharmacopeia.</h3>

                            <div className="space-y-4">
                                {prescriptions.length === 0 ? (
                                    <div className="py-20 text-center opacity-30">
                                        <p className="text-[10px] font-black uppercase tracking-widest">No active prescriptions</p>
                                    </div>
                                ) : (
                                    prescriptions.map((p, i) => (
                                        <div key={i} className="bg-white/5 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/5 hover:bg-white/10 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-lg font-black tracking-tight">{p.medicine_name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Signed by Dr. {p.doctor_name || "Regional"}</p>
                                                </div>
                                                <div className="px-3 py-1 bg-blue-500/20 rounded-full">
                                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Cycle Active</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                <div className="flex items-center gap-2"><Clock size={12} /> {p.duration}</div>
                                                <div className="flex items-center gap-2"><Shield size={12} /> {p.dosage}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-12 relative z-10">
                            <div className="p-8 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adherence Score</span>
                                    <span className="text-sm font-black text-blue-500 italic">92.4%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-[92.4%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium flex items-center gap-6 group hover:border-emerald-200 transition-all cursor-default">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Verified Identity</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gov. Diagnostic Protocol Active</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
