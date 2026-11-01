import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BookText,
    ClipboardList,
    FilePlus,
    FileText,
    Landmark,
    LayoutGrid,
    Scale,
    TrendingUp,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Akun (COA)',
        href: '/accounts',
        icon: BookText,
    },
];

const reportNavItems: NavItem[] = [
    { title: 'Data Transaksi', href: '/laporan/transaksi', icon: FileText },
    { title: 'Buku Besar', href: '/laporan/buku-besar', icon: BookOpen },
    { title: 'Neraca Saldo', href: '/laporan/neraca-saldo', icon: Scale },
    { title: 'Laba Rugi', href: '/laporan/laba-rugi', icon: TrendingUp },
    { title: 'Neraca', href: '/laporan/neraca', icon: Landmark },
    {
        title: 'Posisi Keuangan',
        href: '/laporan/posisi-keuangan',
        icon: ClipboardList,
    },
];

// Menu khusus akuntan (server tetap membatasi lewat middleware role)
const akuntanNavItems: NavItem[] = [
    {
        title: 'Input Jurnal',
        href: '/journals/create',
        icon: FilePlus,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as unknown as {
        auth: { user: { role?: string } };
    };
    const items =
        auth.user.role === 'akuntan'
            ? [...mainNavItems, ...akuntanNavItems, ...reportNavItems]
            : [...mainNavItems, ...reportNavItems];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
