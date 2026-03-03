import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Phone, MapPin, Radio, X, HeartPulse, ShieldAlert } from "lucide-react";

export default function EmergencyPanel({ isOpen, onClose, onTrigger }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleTrigger = async () => {
        setLoading(true);
        await onTrigger();
        setStep(2);
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-[0_64px_128px_-32px_rgba(220,38,38,0.3)] border border-red-50 overflow-hidden"
                    >
                        {step === 1 ? (
                            <div className="p-16 text-center">
                                <div className="w-24 h-24 bg-red-100 rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-red-600 shadow-xl shadow-red-100 relative">
                                    <div className="absolute inset-0 rounded-[3rem] border-4 border-red-600/20 animate-ping" />
                                    <AlertCircle size={48} className="relative z-10" />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase mb-6">Initialize SOS Protocol?</h2>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest leading-loose mb-12 max-w-sm mx-auto">
                                    This will alert regional dispatch, nearby medical hubs, and assigned specialists with your current GPS coordinates.
                                </p>

                                <div className="grid grid-cols-2 gap-6 mb-12">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col items-center">
                                        <MapPin size={24} className="text-slate-400 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 uppercase tracking-widest">GPS Locked</p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col items-center">
                                        <Phone size={24} className="text-slate-400 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 uppercase tracking-widest">Hub Selected</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-6 rounded-[2rem] bg-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel Signal
                                    </button>
                                    <button
                                        onClick={handleTrigger}
                                        disabled={loading}
                                        className="flex-[2] py-6 rounded-[2rem] bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-500/40 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {loading ? "Transmitting..." : "Initialize Emergency"} <Radio size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-16 text-center">
                                <div className="w-24 h-24 bg-emerald-100 rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-emerald-600 shadow-xl shadow-emerald-100">
                                    <ShieldAlert size={48} />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase mb-6">SOS Broadcasitng</h2>
                                <div className="space-y-4 mb-12">
                                    <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Dispatch Notified</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">0.2s ago</span>
                                    </div>
                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                        <div className="flex items-center gap-4 text-slate-400 font-black uppercase tracking-widest italic text-[10px]">
                                            Ambulance Vector Assigned
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Searching...</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-6 rounded-[2rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Return to Terminal
                                </button>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
