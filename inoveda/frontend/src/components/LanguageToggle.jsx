import { Globe } from "lucide-react";

export default function LanguageToggle() {
    const currentLang = "en"; // Mock for now

    return (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/40 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-200 transition-all group">
            <Globe size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">
                {currentLang === "en" ? "English" : "Hindi"}
            </span>
        </div>
    );
}
