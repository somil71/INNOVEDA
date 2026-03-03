import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, MessageSquare } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function AIChatbox() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "I am your Neural Health Assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            if (user?.role !== "patient") {
                setMessages(prev => [...prev, { role: "assistant", content: "AI symptom triage is currently enabled for patient accounts only." }]);
            } else {
                const res = await api.post("/patient/ai-chat", { symptom_input: input, language: "en" });
                setMessages(prev => [...prev, { role: "assistant", content: res.data.ai_response }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "I encountered a synchronization error. Please retry." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-10 right-10 z-[100]">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        onClick={() => setIsOpen(true)}
                        className="w-20 h-20 bg-slate-900 text-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex items-center justify-center border border-white/10 hover:scale-110 active:scale-95 transition-all group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" />
                        <MessageSquare size={32} className="relative z-10" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-slate-50 shadow-sm animate-pulse" />
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: isMinimized ? '80px' : '650px',
                            width: isMinimized ? '300px' : '450px'
                        }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="bg-white rounded-[3rem] shadow-[0_48px_128px_-32px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col transition-all duration-500 ease-out"
                    >
                        {/* Header */}
                        <div className="px-8 py-5 bg-slate-900 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
                                        <Bot size={22} />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-sm" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-base uppercase tracking-tighter italic leading-none">Neural Assistant</span>
                                    <span className="text-blue-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-80">Clinical Intelligence v4.2</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                    {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/30" ref={scrollRef}>
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-[13px] font-semibold leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white p-6 rounded-[2.5rem] rounded-tl-none border border-slate-100 shadow-sm flex gap-2 items-center">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Suggestions */}
                                <div className="px-8 py-4 bg-white flex gap-3 overflow-x-auto custom-scrollbar border-t border-slate-50 shrink-0">
                                    {["Check Symptoms", "Vitals Update", "Med Schedules"].map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(s)}
                                            className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className="p-8 bg-white border-t border-slate-50 shrink-0">
                                    <form onSubmit={handleSend} className="relative">
                                        <input
                                            type="text"
                                            placeholder="Consult Neural Center..."
                                            className="w-full pl-6 pr-16 py-5 bg-slate-50 border border-slate-200/50 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-semibold"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || loading}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-lg"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                    <div className="mt-4 flex items-center justify-center gap-2 opacity-20">
                                        <Sparkles size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">AI Diagnosis Enabled</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
