import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Search,
    User,
    Activity,
    Shield,
    CheckCheck,
    MoreVertical,
    Paperclip,
    Smile,
    Circle
} from "lucide-react";
import { useSnackbar } from "notistack";

export default function Messages() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Mocking initial conversations list - in a real app, you'd fetch /chat/contacts
        setConversations([
            { id: 1, name: "Dr. Arya Swamy", role: "doctor", status: "online", lastMsg: "Results are looking stable." },
            { id: 2, name: "Regional Dispatch", role: "admin", status: "offline", lastMsg: "SOS signal acknowledged." }
        ]);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchHistory(activeChat.id);
        }
    }, [activeChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async (otherId) => {
        try {
            const res = await api.get(`/chat/history/${otherId}`);
            setMessages(res.data);
        } catch {
            enqueueSnackbar("Message sync failed", { variant: "error" });
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeChat) return;
        const msg = input;
        setInput("");
        try {
            await api.post("/chat/messages", {
                receiver_id: activeChat.id,
                content: msg
            });
            fetchHistory(activeChat.id);
        } catch {
            enqueueSnackbar("Encryption protocol error", { variant: "error" });
        }
    };

    if (loading) return <div className="p-12 animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="h-[600px] bg-slate-100 rounded-[3rem]" />
    </div>;

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] flex flex-col space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Neural Comms</h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] mt-2 italic flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Unified Messaging Gateway v2.4
                    </p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[4rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden flex">

                {/* Sidebar - Contacts */}
                <div className="w-96 border-r border-slate-50 flex flex-col">
                    <div className="p-8 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                type="text" placeholder="Search Matrix..."
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200/50 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {conversations.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setActiveChat(c)}
                                className={`w-full flex items-center gap-5 p-6 rounded-[2.5rem] transition-all duration-300 ${activeChat?.id === c.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/10' : 'hover:bg-slate-50'}`}
                            >
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${activeChat?.id === c.id ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>
                                        {c.name.charAt(0)}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 ${activeChat?.id === c.id ? 'border-slate-900' : 'border-white'} ${c.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`text-sm font-black uppercase tracking-tight truncate ${activeChat?.id === c.id ? 'text-white' : 'text-slate-900'}`}>{c.name}</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${activeChat?.id === c.id ? 'text-slate-500' : 'text-slate-300'}`}>Active</span>
                                    </div>
                                    <p className={`text-[10px] font-bold truncate ${activeChat?.id === c.id ? 'text-slate-400' : 'text-slate-500'}`}>{c.lastMsg}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50/30">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-10 py-6 bg-white border-b border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-500">
                                        {activeChat.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900 uppercase tracking-tighter">{activeChat.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${activeChat.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace {activeChat.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
                                </div>
                            </div>

                            {/* Messages Feed */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar" ref={scrollRef}>
                                <AnimatePresence>
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-10">
                                            <Shield size={64} className="mb-6" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">E2E Encrypted Channel</p>
                                        </div>
                                    ) : (
                                        messages.map((m, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${m.sender_name === user?.name ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] p-6 rounded-[2.5rem] ${m.sender_name === user?.name ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-none'}`}>
                                                    <p className="text-sm font-semibold leading-relaxed mb-3">{m.content}</p>
                                                    <div className="flex items-center justify-end gap-2 opacity-40">
                                                        <span className="text-[8px] font-black uppercase tracking-widest">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {m.sender_name === user?.name && <CheckCheck size={10} />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Input Matrix */}
                            <div className="p-10 bg-white border-t border-slate-50">
                                <form onSubmit={sendMessage} className="flex items-center gap-6">
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 text-slate-300">
                                            <button type="button" className="hover:text-blue-600 transition-colors"><Paperclip size={20} /></button>
                                            <div className="w-[1px] h-6 bg-slate-100" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Authorize Message Distribution..."
                                            className="w-full pl-20 pr-24 py-6 bg-slate-50 border border-slate-200/50 rounded-[2rem] outline-none focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-semibold text-slate-800"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                            <button type="button" className="text-slate-300 hover:text-yellow-500 transition-colors"><Smile size={20} /></button>
                                            <button
                                                type="submit"
                                                disabled={!input.trim()}
                                                className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 disabled:opacity-30 disabled:scale-100 transition-all active:scale-95"
                                            >
                                                <Send size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-20 text-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 border border-slate-200/50">
                                <Activity size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase mb-4">Neural Comms Offline</h3>
                            <p className="max-w-xs text-slate-500 font-bold text-sm uppercase tracking-widest leading-loose">Select an authorized node from the directory to initialize encrypted distribution protocol.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
