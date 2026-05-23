'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';

interface Team { id: string; short_name: string; name: string; }
interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  jornada: number | null;
  stadium: string | null;
  home_team?: { short_name: string };
  away_team?: { short_name: string };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Match | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [m, t] = await Promise.all([
      supabase.from('matches').select('*, home_team:teams!home_team_id(short_name), away_team:teams!away_team_id(short_name)').order('scheduled_at', { ascending: false }),
      supabase.from('teams').select('id, short_name, name').order('name'),
    ]);
    if (m.error) toast.error(m.error.message);
    if (t.error) toast.error(t.error.message);
    setMatches((m.data as any) ?? []);
    setTeams(t.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar este partido?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Partido eliminado'); load(); }
  }

  return (
    <div>
      <PageHeader
        title="Partidos"
        description="Calendario y resultados de Liga Promerica + Mundial"
        action={
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-kape-orange hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo partido
          </button>
        }
      />

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Marcador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitante</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(m.scheduled_at).toLocaleString('es-CR')}</td>
                  <td className="px-4 py-3 font-medium">{m.home_team?.short_name ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-bold">{m.home_score ?? '-'} : {m.away_score ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">{m.away_team?.short_name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditing(m); setShowForm(true); }} className="text-blue-600"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">No hay partidos cargados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MatchForm
          match={editing}
          teams={teams}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    live: 'bg-red-100 text-red-700',
    finished: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-orange-100 text-orange-700',
  };
  const labels: Record<string, string> = {
    scheduled: 'Próximo', live: 'EN VIVO', finished: 'Finalizado', cancelled: 'Cancelado',
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] ?? ''}`}>{labels[status] ?? status}</span>;
}

function MatchForm({ match, teams, onClose, onSaved }: { match: Match | null; teams: Team[]; onClose: () => void; onSaved: () => void; }) {
  const [homeTeamId, setHomeTeamId] = useState(match?.home_team_id ?? '');
  const [awayTeamId, setAwayTeamId] = useState(match?.away_team_id ?? '');
  const [scheduledAt, setScheduledAt] = useState(match?.scheduled_at ? match.scheduled_at.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [status, setStatus] = useState(match?.status ?? 'scheduled');
  const [homeScore, setHomeScore] = useState(match?.home_score?.toString() ?? '');
  const [awayScore, setAwayScore] = useState(match?.away_score?.toString() ?? '');
  const [jornada, setJornada] = useState(match?.jornada?.toString() ?? '');
  const [stadium, setStadium] = useState(match?.stadium ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeTeamId === awayTeamId) {
      toast.error('Local y visitante no pueden ser iguales.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status,
      home_score: homeScore ? Number(homeScore) : null,
      away_score: awayScore ? Number(awayScore) : null,
      jornada: jornada ? Number(jornada) : null,
      stadium: stadium || null,
    };
    const { error } = match
      ? await supabase.from('matches').update(payload).eq('id', match.id)
      : await supabase.from('matches').insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(match ? 'Partido actualizado' : 'Partido creado'); onSaved(); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{match ? 'Editar' : 'Nuevo'} partido</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Local" value={homeTeamId} onChange={setHomeTeamId} options={teams.map(t => ({ value: t.id, label: t.name }))} required />
            <Select label="Visitante" value={awayTeamId} onChange={setAwayTeamId} options={teams.map(t => ({ value: t.id, label: t.name }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha y hora</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
          <Select label="Estado" value={status} onChange={setStatus} options={[
            { value: 'scheduled', label: 'Próximo' },
            { value: 'live', label: 'En vivo' },
            { value: 'finished', label: 'Finalizado' },
            { value: 'cancelled', label: 'Cancelado' },
          ]} />
          {(status === 'live' || status === 'finished') && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Goles local" value={homeScore} onChange={setHomeScore} type="number" />
              <Input label="Goles visitante" value={awayScore} onChange={setAwayScore} type="number" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Jornada" value={jornada} onChange={setJornada} type="number" />
            <Input label="Estadio" value={stadium} onChange={setStadium} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-kape-orange text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, ...rest }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" {...rest} />
    </div>
  );
}
function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean; }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required={required}>
        <option value="">— Elegí —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
