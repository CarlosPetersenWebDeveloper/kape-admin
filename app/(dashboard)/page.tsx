import { createClient } from '@/lib/supabase/server';
import { Users, Shield, Calendar, Flag, MessageCircle } from 'lucide-react';

/** Dashboard home: cards con stats clave de TicoStar. */
export default async function DashboardHome() {
  const supabase = createClient();

  // Trae stats en paralelo
  const [teams, players, matches, threads, reports] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('threads').select('id', { count: 'exact', head: true }),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const stats = [
    { label: 'Equipos', value: teams.count ?? 0, icon: Shield, color: 'bg-blue-500' },
    { label: 'Jugadores activos', value: players.count ?? 0, icon: Users, color: 'bg-emerald-500' },
    { label: 'Partidos', value: matches.count ?? 0, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Hilos', value: threads.count ?? 0, icon: MessageCircle, color: 'bg-amber-500' },
    { label: 'Reportes pendientes', value: reports.count ?? 0, icon: Flag, color: 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Panel de control de TicoStar</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className={`${s.color} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
              <s.icon className="text-white" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Atajos rápidos</h2>
        <p className="text-gray-500 text-sm">
          Usá el menú lateral para gestionar equipos, jugadores, partidos y reportes.
        </p>
      </div>
    </div>
  );
}
