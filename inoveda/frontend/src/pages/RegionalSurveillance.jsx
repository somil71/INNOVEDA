import { useEffect, useMemo, useState } from "react";
import { Activity, Globe } from "lucide-react";
import api from "../api";
import { useSnackbar } from "notistack";

export default function RegionalSurveillance() {
    const { enqueueSnackbar } = useSnackbar();
    const [dashboard, setDashboard] = useState(null);
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [dash, emg] = await Promise.all([api.get("/admin/dashboard"), api.get("/admin/emergencies")]);
                setDashboard(dash.data || null);
                setEmergencies(emg.data || []);
            } catch {
                enqueueSnackbar("Unable to load surveillance data", { variant: "error" });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [enqueueSnackbar]);

    const villages = useMemo(() => {
        if (!dashboard?.village_counts) return [];
        return Object.entries(dashboard.village_counts).map(([name, reports]) => ({ name, reports }));
    }, [dashboard]);

    if (loading) {
        return <div className="p-8">Loading surveillance...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold">Regional Surveillance</h1>
                <p className="text-sm text-slate-500">Live area summary from disease reports and emergency queue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">Villages reporting</p>
                    <p className="text-2xl font-bold">{villages.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">Total trend points</p>
                    <p className="text-2xl font-bold">{dashboard?.disease_trends?.length || 0}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">Outbreak alerts</p>
                    <p className="text-2xl font-bold">{dashboard?.outbreak_alerts?.length || 0}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">Pending emergencies</p>
                    <p className="text-2xl font-bold">{emergencies.filter((e) => e.status === "pending").length}</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe size={16} />
                        <h2 className="font-semibold">Village report volumes</h2>
                    </div>
                    <div className="space-y-3">
                        {villages.length === 0 && <p className="text-sm text-slate-400">No disease reports available.</p>}
                        {villages.map((v) => (
                            <div key={v.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                                <p className="text-sm font-medium">{v.name}</p>
                                <p className="text-sm">{v.reports} reports</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={16} />
                        <h2 className="font-semibold">Recent emergencies</h2>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {emergencies.length === 0 && <p className="text-sm text-slate-400">No emergency requests.</p>}
                        {emergencies.map((e) => (
                            <div key={e.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                                <p className="text-sm font-medium">Request #{e.id}</p>
                                <p className="text-xs text-slate-500">Patient ID: {e.patient_id}</p>
                                <p className="text-xs text-slate-500">Status: {e.status}</p>
                                <p className="text-xs text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleString() : ""}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
