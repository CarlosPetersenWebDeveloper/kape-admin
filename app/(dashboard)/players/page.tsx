'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  nickname: string | null;
  team_id: string | null;
  position: string | null;
  jersey_number: number | null;
  active: boolean;
  team?: { short_name: string };
}
interface Team { id: string; short_name: string; name: string; }

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from('players').select('*, team:teams(short_name)').order('full_name');
    if (filterTeam) q = q.eq('team_id', filterTeam);
    const [p, t] = await Promise.all([q, supabase.from('teams').select('id, short_name, name').order('name')]);
    if (p.error) toast.error(p.error.message);
    setPlayers((p.data as any) ?? []);
    setTeams(t.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterTeam]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Borrar a "${name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Jugador eliminado'); load(); }
  }

  return (
    <div>
      <PageHeader
        title="Jugadores"
        description="Plantillas de equipos y selecciones"
        action={
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-kape-orange hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo jugador
          </button>
        }
      />

      <div className="mb-4">
        <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">Todos los equipos</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {players.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{p.nickname ?? p.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.team?.short_name ?? '—'}</td>
                  <td className="px-4 py-3">{p.position ?? '—'}</td>
                  <td className="px-4 py-3">{p.jersey_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-blue-600"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(p.id, p.full_name)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {players.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-500">Sin jugadores</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <PlayerForm player={editing} teams={teams} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function PlayerForm({ player, teams, onClose, onSaved }: { player: Player | null; teams: Team[]; onClose: () => void; onSaved: () => void; }) {
  const [fullName, setFullName] = useState(player?.full_name ?? '');
  const [nickname, setNickname] = useState(player?.nickname ?? '');
  const [teamId, setTeamId] = useState(player?.team_id ?? '');
  const [position, setPosition] = useState(player?.position ?? 'MF');
  const [jersey, setJersey] = useState(player?.jersey_number?.toString() ?? '');
  const [active, setActive] = useState(player?.active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      full_name: fullName,
      nickname: nickname || null,
      team_id: teamId || null,
      position,
      jersey_number: jersey ? Number(jersey) : null,
      active,
    };
    const { error } = player
      ? await supabase.from('players').update(payload).eq('id', player.id)
      : await supabase.from('players').insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(player ? 'Jugador actualizado' : 'Jugador creado'); onSaved(); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{player ? 'Editar' : 'Nuevo'} jugador</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apodo</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Equipo</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
              <option value="">— Elegí —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Posición</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="GK">Portero</option>
                <option value="DF">Defensa</option>
                <option value="MF">Mediocampo</option>
                <option value="FW">Delantero</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Camiseta</label>
              <input type="number" value={jersey} onChange={(e) => setJersey(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span className="text-sm">Activo</span>
              </label>
            </div>
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
