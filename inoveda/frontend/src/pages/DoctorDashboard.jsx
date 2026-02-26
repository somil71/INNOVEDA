import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { cachedGet } from "../api";
import { motion } from "framer-motion";
import {
    Users,
    Stethoscope,
    Activity,
    Search,
    ChevronRight,
    Filter,
    Plus,
    ArrowUpRight,
    ClipboardList,
    Mail,
    MapPin
} from "lucide-react";
import { useSnackbar } from "notistack";

export default function DoctorDashboard() {
    const { enqueueSnackbar } = useSnackbar();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        Promise.all([
            cachedGet("/doctor/dashboard", "doctor_dashboard_cache"),
            api.get("/doctor/patients")
        ]).then(([dash, pts]) => {
            setData(dash);
            setPatients(pts.data);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-12 animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem]" />)}
        </div>
        <div className="h-[500px] bg-slate-50 rounded-[3rem]" />
    </div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: "Active Case Load", val: patients.length, color: "blue", icon: <Users size={24} /> },
                    { label: "Consultations", val: data?.today_consultations || 0, color: "slate", icon: <ClipboardList size={24} /> },
                    { label: "Emergency Cues", val: data?.critical_alerts || 0, color: "red", icon: <Activity size={24} /> },
                    { label: "Incoming Comms", val: 3, color: "emerald", icon: <Mail size={24} /> }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-slate-50 transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : stat.color === 'red' ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white'}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">{stat.label}</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-10">

                {/* Patient Management (Col 8) */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[4rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Assigned Patients</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Clinical Oversight Cache</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex-1 md:w-80 flex items-center bg-slate-50 border border-slate-200/50 rounded-2xl px-5 py-3 focus-within:bg-white focus-within:border-blue-300 transition-all group">
                                <Search size={18} className="text-slate-300 group-focus-within:text-blue-500 mr-3" />
                                <input
                                    type="text" placeholder="Search Patient ID..."
                                    className="bg-transparent text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400 w-full"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl shadow-sm hover:text-slate-900 hover:border-slate-300 transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-12 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Identity</th>
                                    <th className="px-12 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Regional Block</th>
                                    <th className="px-12 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Evaluation Status</th>
                                    <th className="px-12 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/40 transition-all group cursor-pointer">
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 shadow-sm transition-transform group-hover:scale-110">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <p className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-slate-300" />
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{p.village}</p>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Evaluated Hub</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <Link to="/messages" className="bg-slate-50 text-slate-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all inline-block">
                                                Open Terminal
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {patients.length === 0 && (
                        <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest bg-slate-50/20">
                            No patients assigned in current cycle
                        </div>
                    )}
                </div>

                {/* Side Panel (Col 4) */}
                <div className="col-span-12 lg:col-span-4 space-y-10">
                    {/* Quick Rx Action */}
                    <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(15,23,42,0.3)] min-h-[400px] flex flex-col justify-between">
                        <div className="absolute top-[-40px] right-[-40px] opacity-[0.05] pointer-events-none group-hover:scale-125 transition-transform duration-[2s]">
                            <Stethoscope size={300} />
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-10 backdrop-blur-xl border border-white/5">
                                <Stethoscope size={24} className="text-blue-400" />
                            </div>
                            <h3 className="text-4xl font-black mb-6 leading-tight tracking-tighter italic">Clinical Command <br /> RX Terminal.</h3>
                            <p className="text-slate-400 text-sm font-medium mb-12 leading-relaxed opacity-80">Authorize medicine distributions and digital signatures for district Pharmacies.</p>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-6 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <Plus size={18} /> New Prescription
                        </button>
                    </div>

                    {/* Surveillance Feed */}
                    <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-premium">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <Activity size={18} className="text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-900">Regional Pulse</span>
                            </div>
                            <div className="bg-blue-50 px-3 py-1 rounded-full"><span className="text-[8px] font-black text-blue-600 animate-pulse uppercase">Live Feed</span></div>
                        </div>
                        <div className="space-y-6">
                            {[
                                { village: "Indore West", risk: "Normal", color: "emerald" },
                                { village: "Raisen Sector 4", risk: "Elevated", color: "orange" }
                            ].map((r, i) => (
                                <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100/50 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 uppercase mb-1">{r.village}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Surveillance Block active</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.color === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>
                                        {r.risk}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-10 py-5 bg-slate-100 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                            Open District Map
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

