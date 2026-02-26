import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, LayoutDashboard, Stethoscope, Shield, LogOut, Menu, Bell, Search } from "lucide-react";

export default function AppLayout({ children }) {
    const { user, logout, role } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { label: "Overview", to: `/${role}-dashboard`, icon: <LayoutDashboard size={20} /> },
        { label: "Operational Log", to: "/records", icon: <Shield size={20} /> },
        { label: "Neural Comms", to: "/messages", icon: <Activity size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50/50 font-sans">
            {/* Sidebar */}
            <aside className={`bg-white border-r border-slate-200/60 transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-80' : 'w-24'} flex flex-col relative z-40 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.03)]`}>
                <div className="p-8 flex items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-[1.25rem] shadow-xl shadow-blue-500/20 flex-shrink-0">
                        <Activity size={24} className="text-white" />
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">INOVEDA</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational v2</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-6 mt-12 space-y-3">
                    {menuItems.map((item, i) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <Link
                                key={i}
                                to={item.to}
                                className={`flex items-center gap-5 px-5 py-4 rounded-[1.5rem] transition-all duration-300 ${isActive ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'} ${item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                {sidebarOpen && <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>}
                                {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-8">
                    <div className={`bg-slate-50 border border-slate-100 rounded-[2rem] p-4 flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'}`}>
                        <div className="w-10 h-10 bg-slate-200 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-slate-500">
                            {user?.name?.charAt(0)}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] font-black text-slate-900 uppercase truncate">{user?.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{role} Mode</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-24 px-10 flex justify-between items-center bg-white/40 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-slate-400 hover:border-slate-300 hover:text-slate-900 transition-all active:scale-95">
                            <Menu size={20} />
                        </button>
                        <div className="hidden lg:flex items-center bg-slate-100/50 border border-slate-200/40 rounded-2xl px-5 py-3 w-96 group focus-within:bg-white focus-within:border-blue-200 transition-all">
                            <Search size={18} className="text-slate-300 group-focus-within:text-blue-500 transition-colors mr-3" />
                            <input type="text" placeholder="Search workspace..." className="bg-transparent text-sm font-bold outline-none w-full text-slate-700 placeholder:text-slate-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <button className="relative p-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all active:scale-95">
                            <Bell size={20} />
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
                        </button>
                        <div className="h-10 w-px bg-slate-200" />
                        <div className="flex items-center gap-6">
                            <button onClick={logout} className="px-6 py-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 flex items-center gap-3">
                                <LogOut size={16} /> Termination
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 pt-12 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
