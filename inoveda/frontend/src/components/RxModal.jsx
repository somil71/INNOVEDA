import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Pill } from "lucide-react";
import api from "../api";

export default function RxModal({ isOpen, onClose, patients, onMedicineDistributed }) {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [medicine, setMedicine] = useState("");
    const [instructions, setInstructions] = useState("");
    const [duration, setDuration] = useState("7 days");
    const [price, setPrice] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient || !medicine) return;
        setSubmitting(true);
        try {
            await api.post("/doctor/prescriptions", {
                patient_id: selectedPatient.id,
                medicines: [
                    {
                        name: medicine,
                        dosage: instructions || "As advised",
                        duration,
                        price: Number(price || 0),
                    },
                ],
            });
            onMedicineDistributed();
            setSelectedPatient(null);
            setMedicine("");
            setInstructions("");
            setDuration("7 days");
            setPrice("");
            onClose();
        } catch {
            alert("Prescription authorization failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl border border-slate-100 flex overflow-hidden"
                    >
                        {/* Sidebar */}
                        <div className="w-80 bg-slate-50 border-r border-slate-100 p-12 flex flex-col">
                            <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-500/20">
                                <Pill size={24} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-6">Authorize <br /> Medicine.</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-loose">Secure RX distribution terminal. Select node and authorize chemical dispatch.</p>

                            <div className="mt-auto pt-10 border-t border-slate-200/50">
                                <div className="flex items-center gap-3 opacity-30">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">E2E Secure Link</span>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 p-16 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Patient Assignment</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {patients.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPatient(p)}
                                            className={`p-6 rounded-[2rem] border transition-all text-left group ${selectedPatient?.id === p.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-100/50 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedPatient?.id === p.id ? 'bg-white/10' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                                    {p.name.charAt(0)}
                                                </div>
                                                <p className="font-black text-xs uppercase tracking-tight">{p.name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Pharmacopeia Catalog</label>
                                    <input
                                        type="text"
                                        placeholder="Medicine Name (e.g. Paracetamol)..."
                                        className="w-full bg-slate-50 border border-slate-200/60 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-800"
                                        value={medicine}
                                        onChange={e => setMedicine(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Instruction Matrix</label>
                                    <textarea
                                        placeholder="Dosage and timing..."
                                        className="w-full bg-slate-50 border border-slate-200/60 rounded-[2rem] px-8 py-6 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-800 min-h-[120px]"
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Duration</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 5 days"
                                            className="w-full bg-slate-50 border border-slate-200/60 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-800"
                                            value={duration}
                                            onChange={e => setDuration(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full bg-slate-50 border border-slate-200/60 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-800"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedPatient || !medicine}
                                className="w-full bg-blue-600 text-white py-6 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
                            >
                                {submitting ? "Signing Artifact..." : "Authorize Distribution"} <Send size={18} />
                            </button>
                        </form>

                        <button onClick={onClose} className="absolute top-10 right-10 p-3 text-slate-300 hover:text-slate-900 transition-colors">
                            <X size={24} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
