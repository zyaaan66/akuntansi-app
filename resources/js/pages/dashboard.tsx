import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';

type Shortcut = { title: string; text: string; href: string };

const cardClass =
    'block rounded-xl border border-sidebar-border/70 p-4 transition hover:bg-muted/50 dark:border-sidebar-border';

const laporan: Shortcut[] = [
    {
        title: 'Data Transaksi',
        text: 'Daftar semua jurnal yang sudah dicatat.',
        href: '/laporan/transaksi',
    },
    {
        title: 'Buku Besar',
        text: 'Rincian transaksi dan saldo per akun.',
        href: '/laporan/buku-besar',
    },
    {
        title: 'Neraca Saldo',
        text: 'Saldo semua akun, dicek seimbang atau tidak.',
        href: '/laporan/neraca-saldo',
    },
    {
        title: 'Laba Rugi',
        text: 'Pendapatan dikurangi beban pada suatu periode.',
        href: '/laporan/laba-rugi',
    },
    {
        title: 'Neraca',
        text: 'Aset, kewajiban, dan ekuitas per tanggal.',
        href: '/laporan/neraca',
    },
    {
        title: 'Posisi Keuangan',
        text: 'Seperti neraca, dirinci lancar dan tidak lancar.',
        href: '/laporan/posisi-keuangan',
    },
];

const akuntanMenu: Shortcut[] = [
    {
        title: 'Input Jurnal',
        text: 'Catat jurnal lewat form atau upload file CSV.',
        href: '/journals/create',
    },
    {
        title: 'Akun (COA)',
        text: 'Lihat dan tambah daftar akun.',
        href: '/accounts',
    },
];

const managerMenu: Shortcut[] = [
    {
        title: 'Akun (COA)',
        text: 'Lihat daftar akun.',
        href: '/accounts',
    },
];

export default function Dashboard() {
    const { auth } = usePage().props as unknown as {
        auth: { user: { name: string; role?: string } };
    };
    const isAkuntan = auth.user.role === 'akuntan';
    const menu = isAkuntan ? akuntanMenu : managerMenu;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-xl font-semibold">
                        Halo, {auth.user.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Anda masuk sebagai{' '}
                        <span className="font-medium">
                            {isAkuntan ? 'akuntan' : 'manager'}
                        </span>
                        .{' '}
                        {isAkuntan
                            ? 'Anda dapat mencatat jurnal dan melihat semua laporan.'
                            : 'Anda dapat melihat daftar akun dan semua laporan.'}
                    </p>
                </div>

                <section className="grid gap-3">
                    <h2 className="font-semibold">Pencatatan</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {menu.map((m) => (
                            <Link key={m.href} href={m.href} className={cardClass}>
                                <div className="font-medium">{m.title}</div>
                                <div className="text-sm text-muted-foreground">
                                    {m.text}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="grid gap-3">
                    <h2 className="font-semibold">Laporan</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {laporan.map((m) => (
                            <Link key={m.href} href={m.href} className={cardClass}>
                                <div className="font-medium">{m.title}</div>
                                <div className="text-sm text-muted-foreground">
                                    {m.text}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
