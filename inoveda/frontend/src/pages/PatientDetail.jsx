import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { FileText, ChevronLeft } from "lucide-react";
import { useSnackbar } from "notistack";

const API_BASE = "http://localhost:8000";

function getFileName(filePath) {
    if (!filePath) return "document";
    const parts = String(filePath).replaceAll("\\", "/").split("/");
    return parts[parts.length - 1] || "document";
}

function toUploadsUrl(filePath) {
    if (!filePath) return "#";
    const normalized = String(filePath).replaceAll("\\", "/");
    const i = normalized.lastIndexOf("/uploads/");
    if (i >= 0) return `${API_BASE}${normalized.slice(i)}`;
    return `${API_BASE}/uploads/${normalized.split("/").pop()}`;
}

export default function PatientDetail() {
    const { id } = useParams();
    const { enqueueSnackbar } = useSnackbar();
    const [patient, setPatient] = useState(null);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [patientsRes, docsRes] = await Promise.all([
                    api.get("/doctor/patients"),
                    api.get(`/doctor/patient-documents/${id}`),
                ]);
                const p = (patientsRes.data || []).find((row) => String(row.id) === String(id)) || null;
                setPatient(p);
                setDocs(docsRes.data || []);
            } catch {
                enqueueSnackbar("Unable to load patient details", { variant: "error" });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [enqueueSnackbar, id]);

    const heading = useMemo(() => (patient ? `${patient.name} (#${patient.id})` : `Patient #${id}`), [id, patient]);

    if (loading) {
        return <div className="p-8">Loading patient details...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link to="/doctor-dashboard" className="p-2 rounded-xl border border-slate-200 text-slate-600">
                    <ChevronLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{heading}</h1>
                    <p className="text-sm text-slate-500">Village: {patient?.village || "-"} | Phone: {patient?.phone || "-"}</p>
                </div>
                <Link to="/messages" className="ml-auto px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
                    Open Messages
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h2 className="font-semibold mb-4">Documents</h2>
                <div className="space-y-3">
                    {docs.length === 0 && <p className="text-sm text-slate-400">No documents uploaded.</p>}
                    {docs.map((doc) => (
                        <div key={doc.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText size={16} />
                                <div>
                                    <p className="text-sm font-medium">{getFileName(doc.file_path)}</p>
                                    <p className="text-xs text-slate-500">
                                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : ""}
                                    </p>
                                </div>
                            </div>
                            <a href={toUploadsUrl(doc.file_path)} target="_blank" rel="noreferrer" className="text-sm text-blue-600">
                                Open
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
