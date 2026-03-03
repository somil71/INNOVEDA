import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Send, Bell } from "lucide-react";
import { useSnackbar } from "notistack";

function buildFallbackContacts(notifications) {
    const seen = new Set();
    const contacts = [];
    for (const n of notifications) {
        const m = n.message?.match(/#(\d+)/);
        if (!m) continue;
        const id = Number(m[1]);
        if (!seen.has(id)) {
            seen.add(id);
            contacts.push({ id, name: `User #${id}` });
        }
    }
    return contacts;
}

export default function Messages() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [contacts, setContacts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [manualContactId, setManualContactId] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const notifRes = await api.get("/chat/notifications");
                const notifData = Array.isArray(notifRes.data) ? notifRes.data : [];
                setNotifications(notifData);

                if (user?.role === "doctor") {
                    const pts = await api.get("/doctor/patients");
                    setContacts((pts.data || []).map((p) => ({ id: p.id, name: p.name || `Patient #${p.id}` })));
                } else {
                    setContacts(buildFallbackContacts(notifData));
                }
            } catch {
                enqueueSnackbar("Unable to load chat metadata", { variant: "error" });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [enqueueSnackbar, user?.role]);

    useEffect(() => {
        if (!activeChat) return;
        fetchHistory(activeChat.id);
    }, [activeChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sortedNotifications = useMemo(
        () => [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        [notifications]
    );

    const fetchHistory = async (otherId) => {
        try {
            const res = await api.get(`/chat/history/${otherId}`);
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch {
            enqueueSnackbar("Message sync failed", { variant: "error" });
        }
    };

    const addManualContact = () => {
        const id = Number(manualContactId);
        if (!id || id < 1) return;
        const existing = contacts.find((c) => c.id === id);
        const next = existing || { id, name: `User #${id}` };
        if (!existing) {
            setContacts((prev) => [next, ...prev]);
        }
        setActiveChat(next);
        setManualContactId("");
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeChat) return;

        const content = input.trim();
        setInput("");

        try {
            await api.post("/chat/messages", {
                receiver_id: activeChat.id,
                content,
            });
            await fetchHistory(activeChat.id);
        } catch {
            enqueueSnackbar("Unable to send message", { variant: "error" });
        }
    };

    if (loading) {
        return <div className="p-8">Loading messages...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-4 flex flex-col gap-4">
                <div>
                    <h1 className="text-xl font-bold">Messages</h1>
                    <p className="text-xs text-slate-500">Use contact list or enter a user id.</p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="number"
                        min="1"
                        value={manualContactId}
                        onChange={(e) => setManualContactId(e.target.value)}
                        placeholder="User ID"
                        className="flex-1 border rounded-xl px-3 py-2 text-sm"
                    />
                    <button onClick={addManualContact} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm">
                        Open
                    </button>
                </div>

                <div className="overflow-y-auto space-y-2">
                    {contacts.length === 0 && <p className="text-sm text-slate-400">No contacts yet.</p>}
                    {contacts.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveChat(c)}
                            className={`w-full text-left px-3 py-2 rounded-xl border text-sm ${activeChat?.id === c.id ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-100"}`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl border border-slate-100 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold">{activeChat ? `Chat with ${activeChat.name}` : "Select a chat"}</h2>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                    {!activeChat && <p className="text-sm text-slate-400">Choose a contact to load message history.</p>}
                    {activeChat && messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
                    {messages.map((m) => {
                        const mine = Number(m.sender_id) === Number(user?.id);
                        return (
                            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${mine ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>
                                    <p>{m.content}</p>
                                    <p className={`mt-1 text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>
                                        {new Date(m.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={activeChat ? "Type a message" : "Select a chat first"}
                        disabled={!activeChat}
                        className="flex-1 border rounded-xl px-3 py-2 text-sm"
                    />
                    <button type="submit" disabled={!activeChat || !input.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50">
                        <Send size={16} />
                    </button>
                </form>
            </div>

            <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={16} />
                    <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[70vh]">
                    {sortedNotifications.length === 0 && <p className="text-sm text-slate-400">No notifications.</p>}
                    {sortedNotifications.map((n) => (
                        <div key={n.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
