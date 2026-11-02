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

const utamaNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

const masterNavItems: NavItem[] = [
    { title: 'Akun (COA)', href: '/accounts', icon: BookText },
];

// Menu khusus akuntan (server tetap membatasi lewat middleware role)
const akuntanNavItems: NavItem[] = [
    { title: 'Input Jurnal', href: '/journals/create', icon: FilePlus },
];

const transaksiNavItems: NavItem[] = [
    { title: 'Data Transaksi', href: '/laporan/transaksi', icon: FileText },
];

const laporanNavItems: NavItem[] = [
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

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as unknown as {
        auth: { user: { role?: string } };
    };
    const isAkuntan = auth.user.role === 'akuntan';
    const transaksiItems = isAkuntan
        ? [...akuntanNavItems, ...transaksiNavItems]
        : transaksiNavItems;

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
                <NavMain label="Utama" items={utamaNavItems} />
                <NavMain label="Data Master" items={masterNavItems} />
                <NavMain label="Transaksi" items={transaksiItems} />
                <NavMain label="Laporan" items={laporanNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
