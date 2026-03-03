import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { cachedGet } from "../api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Zap, Activity, Users, AlertCircle, Send, Plus, Search, ChevronRight } from "lucide-react";
import { useSnackbar } from "notistack";

export default function AdminDashboard() {
    const { enqueueSnackbar } = useSnackbar();
    const [data, setData] = useState(null);
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            cachedGet("/admin/dashboard", "admin_dashboard_cache"),
            api.get("/admin/emergencies")
        ]).then(([dash, emg]) => {
            setData(dash);
            setEmergencies(emg.data);
        }).finally(() => setLoading(false));
    }, []);

    const dispatchAmbulance = async (id) => {
        try {
            await api.post(`/admin/emergencies/${id}/dispatch`);
            setEmergencies(emergencies.map(e => e.id === id ? { ...e, status: "ambulance_dispatched" } : e));
            enqueueSnackbar("Emergency Response Dispatched", { variant: "info" });
        } catch {
            enqueueSnackbar("Dispatch Command Restricted", { variant: "error" });
        }
    };

    if (loading) return <div className="p-12 animate-pulse space-y-12">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[3rem]" />)}
        </div>
        <div className="h-[450px] bg-slate-50 rounded-[4rem]" />
    </div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Sovereign Admin</h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] mt-2 italic flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" /> Regional Governance Core Active
                    </p>
                </div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3">
                    <Plus size={16} /> Data Export
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: "Regional Nodes", val: (data?.village_counts ? Object.keys(data.village_counts).length : 0), icon: <Shield size={24} /> },
                    { label: "Sync Events", val: (data?.disease_trends ? data.disease_trends.reduce((a, b) => a + b.count, 0) : 0), icon: <Activity size={24} /> },
                    { label: "SOS Queue", val: emergencies.filter(e => e.status === 'pending').length, icon: <AlertCircle size={24} />, highlight: true },
                    { label: "Latency Score", val: "0.2ms", icon: <Zap size={24} /> }
                ].map((stat, i) => (
                    <div key={i} className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] group transition-all duration-300 ${stat.highlight ? 'ring-2 ring-red-500/20 shadow-red-500/5' : 'hover:-translate-y-1.5'}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-slate-50 ${stat.highlight ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all'}`}>
                            {stat.icon}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* Analysis Module */}
            <div className="bg-white rounded-[4rem] p-16 border border-slate-100 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.08)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">Disease Intelligence Feed</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Neural metric synchronization active</p>
                    </div>
                    <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 gap-2">
                        <button className="px-6 py-3 font-black text-[10px] uppercase text-slate-400 tracking-widest hover:text-slate-900 transition-colors">24h</button>
                        <button className="px-6 py-3 bg-white shadow-sm rounded-xl font-black text-[10px] uppercase text-slate-900 tracking-widest border border-slate-200/40">7-Day Trend</button>
                    </div>
                </div>
                <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.disease_trends || []}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }} />
                            <Tooltip
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.12)', padding: '24px', backgroundColor: '#fff' }}
                                itemStyle={{ fontWeight: 900, color: '#0F172A', fontSize: '14px', textTransform: 'uppercase' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" animationDuration={2000} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10">

                {/* SOS Ledger */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[4rem] border border-slate-100 shadow-premium overflow-hidden">
                    <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 text-slate-900">
                        <h3 className="text-2xl font-black tracking-tight italic">Active Emergency Ledger</h3>
                        <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-ping" /><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-12 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Trace ID</th>
                                    <th className="px-12 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">State</th>
                                    <th className="px-12 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Timestamp</th>
                                    <th className="px-12 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {emergencies.map((emg, i) => (
                                    <tr key={i} className="hover:bg-slate-50/40 transition-all duration-300 group cursor-default">
                                        <td className="px-12 py-10">
                                            <div className="flex flex-col">
                                                <p className="text-base font-black text-slate-900 tracking-tight uppercase italic">SIGNAL-{emg.id}</p>
                                                <p className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">Geo-Synced Node</p>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${emg.status === 'pending' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'}`} />
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${emg.status === 'pending' ? 'text-red-600' : 'text-emerald-600'}`}>{emg.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-60 italic">{emg.created_at?.split('T')[0] || "Live Source"}</p>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            {emg.status === 'pending' && (
                                                <button
                                                    onClick={() => dispatchAmbulance(emg.id)}
                                                    className="bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-3 group-hover:-translate-x-2"
                                                >
                                                    <Send size={16} /> Discretionary Dispatch
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {emergencies.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest opacity-20 italic">Clean emergency queue in current window</div>}
                </div>

                {/* Sector Snapshot Sidepanel */}
                <div className="col-span-12 lg:col-span-4 space-y-10">
                    <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden group min-h-[450px] flex flex-col justify-between shadow-[0_48px_96px_-24px_rgba(15,23,42,0.3)]">
                        <div className="absolute top-[-80px] right-[-80px] opacity-[0.05] pointer-events-none group-hover:scale-125 transition-transform duration-[5s]"><Shield size={500} /></div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-12 border border-white/5 backdrop-blur-xl">
                                <Shield size={28} className="text-blue-500" />
                            </div>
                            <h3 className="text-4xl font-black mb-8 leading-[0.95] tracking-tighter italic">Regional <br /> Authority <br /> Console.</h3>
                            <p className="text-slate-400 text-base font-medium leading-relaxed opacity-60">Authorize high-level diagnostic overrides and manage regional emergency assets in real-time.</p>
                        </div>
                        <Link to="/messages" className="w-full bg-blue-600 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/30 hover:bg-white hover:text-slate-900 transition-all active:scale-95 mt-10 text-center">
                            Authorize District Report
                        </Link>
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-premium">
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex items-center gap-4">
                                <Activity size={20} className="text-blue-600" />
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900">Regional Sync Pulse</span>
                            </div>
                            <div className="bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100"><span className="text-[9px] font-black text-blue-600 animate-pulse uppercase">Active</span></div>
                        </div>
                        <div className="space-y-6">
                            {data?.village_counts && Object.entries(data.village_counts).map(([v, count], i) => (
                                <div key={i} className="flex justify-between items-center p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100/50 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight italic">{v} Hub</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter italic">{count}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Reports</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
