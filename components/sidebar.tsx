'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Shield,
  Users,
  Calendar,
  MessageCircle,
  Flag,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teams', label: 'Equipos', icon: Shield },
  { href: '/players', label: 'Jugadores', icon: Users },
  { href: '/matches', label: 'Partidos', icon: Calendar },
  { href: '/threads', label: 'Hilos', icon: MessageCircle },
  { href: '/reports', label: 'Reportes', icon: Flag },
];

export function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-kape-dark text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-extrabold">Kape Admin</h1>
        <p className="text-xs text-white/50 mt-1">TicoStar</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg transition',
                active
                  ? 'bg-kape-green text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/50 mb-2">Sesión</div>
        <div className="font-medium mb-3 truncate">{displayName}</div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition text-sm"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
