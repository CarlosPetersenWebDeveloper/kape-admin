'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  short_name: string;
  city: string | null;
  primary_color: string | null;
  founded_year: number | null;
  team_type?: string;
  country?: string | null;
  fifa_code?: string | null;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Team | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadTeams() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    if (error) toast.error(error.message);
    setTeams(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadTeams();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Borrar "${name}"? Esta acción no se puede deshacer.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Equipo eliminado');
      loadTeams();
    }
  }

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(team: Team) {
    setEditing(team);
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Equipos"
        description="Gestioná los equipos de Liga Promerica, selecciones y otros torneos"
        action={
          <button
            onClick={openNew}
            className="bg-kape-orange hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} /> Nuevo equipo
          </button>
        }
      />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Corto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ciudad/País</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ background: t.primary_color ?? '#999' }}
                    />
                  </td>
                  <td className="px-6 py-3 font-medium">{t.name}</td>
                  <td className="px-6 py-3 text-gray-600">{t.short_name}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${t.team_type === 'national' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {t.team_type === 'national' ? 'Selección' : 'Club'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 text-sm">{t.city || t.country || '—'}</td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id, t.name)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">No hay equipos cargados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TeamForm
          team={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadTeams();
          }}
        />
      )}
    </div>
  );
}

function TeamForm({
  team,
  onClose,
  onSaved,
}: {
  team: Team | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team?.name ?? '');
  const [shortName, setShortName] = useState(team?.short_name ?? '');
  const [city, setCity] = useState(team?.city ?? '');
  const [color, setColor] = useState(team?.primary_color ?? '#0B6E4F');
  const [foundedYear, setFoundedYear] = useState(team?.founded_year?.toString() ?? '');
  const [teamType, setTeamType] = useState(team?.team_type ?? 'club');
  const [country, setCountry] = useState(team?.country ?? '');
  const [fifaCode, setFifaCode] = useState(team?.fifa_code ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload: Partial<Team> = {
      name,
      short_name: shortName,
      city: city || null,
      primary_color: color,
      founded_year: foundedYear ? Number(foundedYear) : null,
      team_type: teamType,
      country: country || null,
      fifa_code: fifaCode || null,
    };

    const { error } = team
      ? await supabase.from('teams').update(payload).eq('id', team.id)
      : await supabase.from('teams').insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(team ? 'Equipo actualizado' : 'Equipo creado');
      onSaved();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{team ? 'Editar' : 'Nuevo'} equipo</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={name} onChange={setName} required />
          <Input label="Nombre corto" value={shortName} onChange={setShortName} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={teamType} onChange={(e) => setTeamType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="club">Club</option>
                <option value="national">Selección</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color primario</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <Input label={teamType === 'national' ? 'País' : 'Ciudad'} value={teamType === 'national' ? country : city} onChange={teamType === 'national' ? setCountry : setCity} />
          {teamType === 'national' && (
            <Input label="Código FIFA (3 letras)" value={fifaCode} onChange={setFifaCode} maxLength={3} />
          )}
          <Input label="Año de fundación" value={foundedYear} onChange={setFoundedYear} type="number" />

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

function Input({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void; [k: string]: any }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
        {...rest}
      />
    </div>
  );
}
