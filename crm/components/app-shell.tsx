'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Bell,
  Building2,
  CalendarClock,
  FileSignature,
  Handshake,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  ScrollText,
  ShieldCheck,
  Tag,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotifications } from '@/lib/queries';
import { cn } from '@/lib/cn';

type NavItem = { href: string; label: string; icon: LucideIcon; ready?: boolean };

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, ready: true },
  { href: '/properties', label: 'Properties', icon: Building2, ready: true },
  { href: '/listing-agreements', label: 'Agreements', icon: ScrollText, ready: true },
  { href: '/contacts', label: 'Contacts', icon: Users, ready: true },
  { href: '/opportunities', label: 'Opportunities', icon: Target, ready: true },
  { href: '/viewings', label: 'Viewings', icon: CalendarClock, ready: true },
  { href: '/offers', label: 'Offers', icon: Tag, ready: true },
  { href: '/deals', label: 'Deals', icon: Handshake, ready: true },
  { href: '/contracts', label: 'Contracts', icon: FileSignature, ready: true },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, ready: true },
  { href: '/activities', label: 'Activities', icon: Activity, ready: true },
  { href: '/notifications', label: 'Notifications', icon: Bell, ready: true },
  { href: '/users', label: 'Users & Agents', icon: ShieldCheck, ready: true },
];

const SETTINGS_NAV: NavItem[] = [
  { href: '/settings/locations', label: 'Location data', icon: MapPin, ready: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.GET('/api/auth/me')).data,
  });

  // Failures resolve to undefined (never throws), so the shell renders fine without it.
  const { data: notif } = useNotifications();
  const unread = notif?.unreadCount ?? 0;

  async function logout() {
    await api.POST('/api/auth/logout');
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col bg-brand text-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-bold text-brand">M</div>
          <span className="text-lg font-semibold">MADEM</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            const className = cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
              active ? 'bg-white/15 font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
              !item.ready && 'cursor-not-allowed opacity-40 hover:bg-transparent',
            );
            if (!item.ready) {
              return (
                <div key={item.href} className={className} title="Coming soon">
                  <Icon className="h-4 w-4" /> {item.label}
                </div>
              );
            }
            const showBadge = item.href === '/notifications' && unread > 0;
            return (
              <Link key={item.href} href={item.href} className={className}>
                <Icon className="h-4 w-4" /> {item.label}
                {showBadge && (
                  <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-brand">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Settings</div>
          {SETTINGS_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'ml-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                  active ? 'bg-white/15 font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="px-2 pb-2 text-xs text-white/60">
            {me?.fullName ?? 'Loading…'}
            <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] text-gold">{me?.role}</span>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
