'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { Pin, PinOff, Trash2 } from 'lucide-react';

interface Thread {
  id: string;
  type: string;
  title: string;
  pinned: boolean;
  created_at: string;
  author?: { display_name: string };
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('threads')
      .select('*, author:profiles(display_name)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setThreads((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePin(t: Thread) {
    const supabase = createClient();
    const { error } = await supabase.from('threads').update({ pinned: !t.pinned }).eq('id', t.id);
    if (error) toast.error(error.message);
    else { toast.success(t.pinned ? 'Desfijado' : 'Fijado'); load(); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Borrar el hilo "${title}"? Se borran TODOS los comentarios también.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('threads').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Hilo eliminado'); load(); }
  }

  return (
    <div>
      <PageHeader title="Hilos" description="Foros generales y hilos automáticos de partidos" />

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {threads.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {t.pinned && <Pin size={14} className="inline mr-1 text-kape-orange" />}
                    {t.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'match' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.type === 'match' ? 'Partido' : 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{t.author?.display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(t.created_at).toLocaleDateString('es-CR')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => togglePin(t)} className="text-blue-600" title={t.pinned ? 'Desfijar' : 'Fijar'}>
                      {t.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button onClick={() => handleDelete(t.id, t.title)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {threads.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-500">No hay hilos</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
