import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Upload, FileText, ShoppingCart, ToggleLeft, ToggleRight } from "lucide-react";
import { useSnackbar } from "notistack";

const API_BASE = "http://localhost:8000";

function getFileName(filePath) {
    if (!filePath) return "document";
    const normalized = String(filePath).replaceAll("\\", "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1] || "document";
}

function toUploadsUrl(filePath) {
    if (!filePath) return "#";
    const normalized = String(filePath).replaceAll("\\", "/");
    const i = normalized.lastIndexOf("/uploads/");
    if (i >= 0) return `${API_BASE}${normalized.slice(i)}`;
    const fname = normalized.split("/").pop();
    return `${API_BASE}/uploads/${fname}`;
}

export default function Records() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [docs, setDocs] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [autoPay, setAutoPay] = useState(false);

    const [doctorPatients, setDoctorPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const isPatient = user?.role === "patient";
    const isDoctor = user?.role === "doctor";

    const selectedPatient = useMemo(
        () => doctorPatients.find((p) => String(p.id) === String(selectedPatientId)),
        [doctorPatients, selectedPatientId]
    );

    const loadPatientRecords = async () => {
        const [docsRes, rxRes, cartRes] = await Promise.all([
            api.get("/patient/documents"),
            api.get("/patient/prescriptions"),
            api.get("/patient/cart"),
        ]);
        setDocs(docsRes.data || []);
        setPrescriptions(rxRes.data || []);
        setCart(cartRes.data || { items: [], total: 0 });
    };

    const loadDoctorRecords = async () => {
        const ptsRes = await api.get("/doctor/patients");
        const pts = ptsRes.data || [];
        setDoctorPatients(pts);

        if (pts.length > 0) {
            const pid = pts[0].id;
            setSelectedPatientId(String(pid));
            const docsRes = await api.get(`/doctor/patient-documents/${pid}`);
            setDocs(docsRes.data || []);
        } else {
            setDocs([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (isPatient) {
                await loadPatientRecords();
            } else if (isDoctor) {
                await loadDoctorRecords();
            }
        } catch {
            enqueueSnackbar("Unable to load records", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.role]);

    const handleDoctorPatientChange = async (id) => {
        setSelectedPatientId(String(id));
        try {
            const docsRes = await api.get(`/doctor/patient-documents/${id}`);
            setDocs(docsRes.data || []);
        } catch {
            enqueueSnackbar("Unable to load patient documents", { variant: "error" });
        }
    };

    const onUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            await api.post("/patient/documents/upload", fd);
            enqueueSnackbar("Document uploaded", { variant: "success" });
            await loadPatientRecords();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.detail || "Upload failed", { variant: "error" });
        } finally {
            setUploading(false);
        }
    };

    const toggleAutoPay = async () => {
        try {
            const next = !autoPay;
            const res = await api.post(`/patient/auto-pay/${next}`);
            setAutoPay(Boolean(res.data?.auto_pay_enabled));
            enqueueSnackbar(`Auto-pay ${next ? "enabled" : "disabled"}`, { variant: "success" });
        } catch {
            enqueueSnackbar("Unable to update auto-pay", { variant: "error" });
        }
    };

    const markDosageComplete = async (name) => {
        try {
            await api.post(`/patient/dosage-complete/${encodeURIComponent(name)}`);
            enqueueSnackbar(`Marked '${name}' as completed`, { variant: "success" });
        } catch {
            enqueueSnackbar("Unable to mark dosage", { variant: "error" });
        }
    };

    const scheduleReminder = async (name) => {
        try {
            await api.post(`/patient/mock-schedule/${encodeURIComponent(name)}`);
            enqueueSnackbar(`Reminder scheduled for '${name}'`, { variant: "info" });
        } catch {
            enqueueSnackbar("Unable to schedule reminder", { variant: "error" });
        }
    };

    if (loading) {
        return <div className="p-8">Loading records...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Records</h1>
                    <p className="text-sm text-slate-500">
                        {isPatient ? "Your documents, prescriptions, and medicine cart" : "Patient document access"}
                    </p>
                </div>

                {isPatient && (
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm cursor-pointer">
                        <Upload size={16} />
                        {uploading ? "Uploading..." : "Upload Document"}
                        <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
                    </label>
                )}
            </div>

            {isDoctor && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <label className="text-xs text-slate-500">Select patient</label>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => handleDoctorPatientChange(e.target.value)}
                        className="mt-1 w-full md:w-80 border rounded-xl px-3 py-2"
                    >
                        {doctorPatients.length === 0 && <option value="">No assigned patients</option>}
                        {doctorPatients.map((p) => (
                            <option key={p.id} value={p.id}>{`${p.name} (#${p.id})`}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} />
                        <h2 className="font-semibold">
                            Documents {isDoctor && selectedPatient ? `for ${selectedPatient.name}` : ""}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {docs.length === 0 && <p className="text-sm text-slate-400">No documents found.</p>}
                        {docs.map((doc) => {
                            const url = toUploadsUrl(doc.file_path);
                            return (
                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                                    <div>
                                        <p className="text-sm font-medium">{getFileName(doc.file_path)}</p>
                                        <p className="text-xs text-slate-500">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : ""}</p>
                                    </div>
                                    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">
                                        Open
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isPatient && (
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h2 className="font-semibold mb-3">Prescriptions</h2>
                            {prescriptions.length === 0 && <p className="text-sm text-slate-400">No prescriptions yet.</p>}
                            <div className="space-y-2">
                                {prescriptions.map((p) => (
                                    <div key={p.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                                        <p className="text-sm font-medium">Prescription #{p.id}</p>
                                        <p className="text-xs text-slate-500">Doctor ID: {p.doctor_id}</p>
                                        <p className="text-xs text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={16} />
                                    <h2 className="font-semibold">Medicine Cart</h2>
                                </div>
                                <button onClick={toggleAutoPay} className="text-sm inline-flex items-center gap-1 text-slate-700">
                                    {autoPay ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    Auto-pay {autoPay ? "ON" : "OFF"}
                                </button>
                            </div>
                            {cart.items?.length === 0 && <p className="text-sm text-slate-400">Cart is empty.</p>}
                            <div className="space-y-3">
                                {(cart.items || []).map((item) => (
                                    <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{item.medicine_name}</p>
                                            <p className="text-sm">Rs {item.price}</p>
                                        </div>
                                        <p className="text-xs text-slate-500">Dosage: {item.dosage || "-"}</p>
                                        <p className="text-xs text-slate-500">Duration: {item.duration || "-"}</p>
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => markDosageComplete(item.medicine_name)}
                                                className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white"
                                            >
                                                Dosage Complete
                                            </button>
                                            <button
                                                onClick={() => scheduleReminder(item.medicine_name)}
                                                className="text-xs px-2 py-1 rounded-lg bg-slate-900 text-white"
                                            >
                                                Schedule Reminder
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm font-semibold">Total: Rs {cart.total || 0}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
