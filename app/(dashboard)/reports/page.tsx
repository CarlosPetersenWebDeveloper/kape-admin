'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface Report {
  id: string;
  comment_id: string;
  reason: string;
  status: string;
  created_at: string;
  comment?: { body: string; author_id: string; thread_id: string; status: string };
  reporter?: { display_name: string };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  async function load() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from('reports')
      .select('*, comment:comments(body, author_id, thread_id, status), reporter:profiles(display_name)')
      .order('created_at', { ascending: false });
    if (filter === 'pending') q = q.eq('status', 'pending');
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setReports((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function resolveAndHide(report: Report) {
    if (!confirm('¿Ocultar el comentario y marcar reporte como resuelto?')) return;
    const supabase = createClient();
    // 1. Ocultar el comentario
    if (report.comment_id) {
      await supabase.from('comments').update({ status: 'hidden' }).eq('id', report.comment_id);
    }
    // 2. Marcar reporte como resuelto
    const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
    if (error) toast.error(error.message);
    else { toast.success('Comentario oculto y reporte resuelto'); load(); }
  }

  async function dismiss(report: Report) {
    const supabase = createClient();
    const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', report.id);
    if (error) toast.error(error.message);
    else { toast.success('Reporte descartado'); load(); }
  }

  return (
    <div>
      <PageHeader title="Reportes" description="Moderación de comentarios reportados" />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded-lg text-sm ${filter === 'pending' ? 'bg-kape-orange text-white' : 'bg-gray-200'}`}>Pendientes</button>
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-lg text-sm ${filter === 'all' ? 'bg-kape-orange text-white' : 'bg-gray-200'}`}>Todos</button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : reports.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          🎉 No hay reportes pendientes
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'pending' ? 'bg-orange-100 text-orange-700' : r.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                    <span className="text-xs text-gray-500">Motivo: {r.reason}</span>
                    <span className="text-xs text-gray-400">· Reportado por {r.reporter?.display_name ?? 'Usuario'}</span>
                    <span className="text-xs text-gray-400">· {new Date(r.created_at).toLocaleString('es-CR')}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-red-400">
                    <p className="text-sm whitespace-pre-wrap">{r.comment?.body ?? '(comentario no disponible)'}</p>
                    {r.comment?.status !== 'visible' && (
                      <p className="text-xs text-gray-500 mt-1">Estado actual del comentario: {r.comment?.status}</p>
                    )}
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => resolveAndHide(r)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                      <Check size={14} /> Ocultar
                    </button>
                    <button onClick={() => dismiss(r)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                      <X size={14} /> Descartar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
