import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Maximize2, Users, MessageCircle, Shield } from "lucide-react";

export default function VideoCall({ isOpen, onClose, participantName }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (isOpen) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        } else {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="relative w-full max-w-7xl h-full max-h-[900px] bg-slate-900 rounded-[4rem] shadow-[0_0_128px_-32px_rgba(59,130,246,0.3)] border border-white/5 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-12 py-8 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                                    <Video size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">{participantName || "Neural Hub Connection"}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatTime(timer)} • Encrypted Stream</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="p-4 bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all"><Settings size={20} /></button>
                                <button className="p-4 bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all"><Maximize2 size={20} /></button>
                            </div>
                        </div>

                        {/* Video Viewport */}
                        <div className="flex-1 p-12 relative flex gap-8">
                            {/* Main Remote View */}
                            <div className="flex-1 bg-slate-800 rounded-[3.5rem] relative overflow-hidden group shadow-inner">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12">
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{participantName} Hub</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">4K Lossless Protocol</span>
                                    </div>
                                </div>

                                {/* UI Overlay / Avatar placeholder */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="w-48 h-48 bg-slate-900 rounded-[5rem] flex items-center justify-center text-slate-700 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-1000">
                                        <Users size={64} className="opacity-20" />
                                    </div>
                                    <p className="mt-8 text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Waiting for stream...</p>
                                </div>
                            </div>

                            {/* Local View */}
                            <div className="w-96 bg-slate-800 rounded-[3rem] relative overflow-hidden group border border-white/5 shadow-2xl self-end h-[30%]">
                                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-700 border border-white/5">
                                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} className="opacity-20" />}
                                    </div>
                                    <p className="mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Internal Node</p>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">You</span>
                                    {isMuted && <MicOff size={12} className="text-red-500" />}
                                </div>
                            </div>
                        </div>

                        {/* Controls Container */}
                        <div className="px-12 py-10 bg-slate-950/50 backdrop-blur-md border-t border-white/5 flex justify-center items-center gap-10">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-6 rounded-[2rem] transition-all flex flex-col items-center gap-2 group ${isMuted ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">{isMuted ? 'Unmute' : 'Mute'}</span>
                            </button>

                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`p-6 rounded-[2rem] transition-all flex flex-col items-center gap-2 group ${isVideoOff ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">{isVideoOff ? 'Cam On' : 'Cam Off'}</span>
                            </button>

                            <button className="p-6 bg-white/5 text-slate-400 rounded-[2rem] hover:bg-white/10 hover:text-white transition-all flex flex-col items-center gap-2 group">
                                <MessageCircle size={28} />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Artifacts</span>
                            </button>

                            <div className="w-px h-12 bg-white/5 mx-4" />

                            <button
                                onClick={onClose}
                                className="bg-red-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-red-500/40 hover:bg-red-700 hover:scale-110 active:scale-95 transition-all flex flex-col items-center gap-2 group"
                            >
                                <PhoneOff size={32} />
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
