import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Banknote,
    Landmark,
    Scale,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { dashboard } from '@/routes';
import { rupiah, tableBox } from '@/lib/format';

type Props = {
    month: string;
    as_of: string;
    kpi: {
        cash: number;
        assets: number;
        revenue: number;
        expense: number;
        net_income: number;
    };
    balanced: boolean;
    chart: { month: string; revenue: number; expense: number }[];
    recent: {
        id: number;
        number: string;
        date: string;
        description: string;
        amount: number;
    }[];
};

const box =
    'rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border';

const parseDate = (d: string) => new Date(`${d}T00:00:00`);

const fullDate = (d: string) =>
    parseDate(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

const monthName = (m: string, style: 'long' | 'short') =>
    parseDate(`${m}-01`).toLocaleDateString('id-ID', {
        month: style,
        year: style === 'long' ? 'numeric' : '2-digit',
    });

const compact = (n: number) =>
    n.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

function Kpi({
    title,
    value,
    note,
    icon,
    tone = '',
}: {
    title: string;
    value: number;
    note: string;
    icon: ReactNode;
    tone?: string;
}) {
    return (
        <div className={box}>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{title}</span>
                {icon}
            </div>
            <div className={`mt-2 text-xl font-semibold ${tone}`}>
                Rp {rupiah(value)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{note}</div>
        </div>
    );
}

export default function Dashboard({
    month,
    as_of,
    kpi,
    balanced,
    chart,
    recent,
}: Props) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { name: string; role?: string } };
    };
    const isAkuntan = auth.user.role === 'akuntan';
    const label = monthName(month, 'long');
    const max = Math.max(1, ...chart.flatMap((c) => [c.revenue, c.expense]));
    const barHeight = (v: number) =>
        v > 0 ? Math.max(3, Math.round((v / max) * 160)) : 0;
    const loss = kpi.net_income < 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Halo, {auth.user.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ringkasan keuangan{' '}
                            <span className="font-medium">{label}</span>.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                            Bulan
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        router.get(
                                            '/dashboard',
                                            { bulan: e.target.value },
                                            { preserveScroll: true },
                                        );
                                    }
                                }}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
                            />
                        </label>
                        {isAkuntan && (
                            <Link
                                href="/journals/create"
                                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                + Input Jurnal
                            </Link>
                        )}
                    </div>
                </div>

                <div
                    className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                        balanced
                            ? 'border-green-600/30 bg-green-500/10 text-green-600'
                            : 'border-red-500/40 bg-red-500/10 text-red-500'
                    }`}
                >
                    <Scale className="size-5 shrink-0" />
                    <span>
                        {balanced
                            ? 'Neraca seimbang: neraca saldo seimbang dan Aset = Kewajiban + Ekuitas.'
                            : 'Neraca TIDAK seimbang. Periksa Neraca Saldo dan Neraca.'}
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Kpi
                        title="Kas dan Bank"
                        value={kpi.cash}
                        note={`per ${fullDate(as_of)}`}
                        icon={<Wallet className="size-4" />}
                    />
                    <Kpi
                        title="Total Aset"
                        value={kpi.assets}
                        note={`per ${fullDate(as_of)}`}
                        icon={<Landmark className="size-4" />}
                    />
                    <Kpi
                        title="Pendapatan"
                        value={kpi.revenue}
                        note={label}
                        icon={<TrendingUp className="size-4" />}
                    />
                    <Kpi
                        title="Beban"
                        value={kpi.expense}
                        note={label}
                        icon={<TrendingDown className="size-4" />}
                    />
                    <Kpi
                        title={loss ? 'Rugi Bersih' : 'Laba Bersih'}
                        value={kpi.net_income}
                        note={label}
                        icon={<Banknote className="size-4" />}
                        tone={loss ? 'text-red-500' : 'text-green-600'}
                    />
                </div>

                <section className={box}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold">
                            Pendapatan vs Beban (6 bulan)
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <span className="size-2.5 rounded-sm bg-emerald-500" />
                                Pendapatan
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="size-2.5 rounded-sm bg-rose-500" />
                                Beban
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {chart.map((c) => (
                            <div
                                key={c.month}
                                className="flex min-w-14 flex-1 flex-col items-center gap-2"
                                title={`${monthName(c.month, 'long')}\nPendapatan: Rp ${rupiah(c.revenue)}\nBeban: Rp ${rupiah(c.expense)}`}
                            >
                                <div className="flex h-44 items-end gap-1">
                                    <div className="flex flex-col items-center justify-end">
                                        <span className="mb-1 text-[10px] text-muted-foreground">
                                            {c.revenue > 0
                                                ? compact(c.revenue)
                                                : ''}
                                        </span>
                                        <div
                                            className="w-5 rounded-t bg-emerald-500"
                                            style={{
                                                height: barHeight(c.revenue),
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center justify-end">
                                        <span className="mb-1 text-[10px] text-muted-foreground">
                                            {c.expense > 0
                                                ? compact(c.expense)
                                                : ''}
                                        </span>
                                        <div
                                            className="w-5 rounded-t bg-rose-500"
                                            style={{
                                                height: barHeight(c.expense),
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {monthName(c.month, 'short')}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Jurnal terbaru</h2>
                        <Link
                            href="/laporan/transaksi"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            Lihat semua
                        </Link>
                    </div>

                    {recent.length === 0 ? (
                        <div className={`${box} text-sm text-muted-foreground`}>
                            Belum ada jurnal.
                            {isAkuntan && (
                                <>
                                    {' '}
                                    Mulai dari{' '}
                                    <Link
                                        href="/journals/create"
                                        className="font-medium text-foreground underline"
                                    >
                                        Input Jurnal
                                    </Link>
                                    .
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={tableBox}>
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-3">Nomor</th>
                                        <th className="p-3">Tanggal</th>
                                        <th className="p-3">Keterangan</th>
                                        <th className="p-3 text-right">
                                            Jumlah
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((j) => (
                                        <tr key={j.id} className="border-t">
                                            <td className="p-3 font-mono">
                                                {j.number}
                                            </td>
                                            <td className="p-3">
                                                {fullDate(j.date)}
                                            </td>
                                            <td className="p-3">
                                                {j.description}
                                            </td>
                                            <td className="p-3 text-right">
                                                {rupiah(j.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
