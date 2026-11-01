import { Head } from '@inertiajs/react';
import { ReportFilter } from '@/components/report-filter';
import { rupiah, tableBox } from '@/lib/format';

type Item = { code: string; name: string; amount: number };
type Group = {
    category: string;
    type: string;
    accounts: Item[];
    subtotal: number;
};
type Props = {
    filters: { sampai: string };
    detailed: boolean;
    report: {
        groups: Group[];
        total_assets: number;
        total_liabilities: number;
        total_equity: number;
        balanced: boolean;
    };
};

const TYPES = [
    { key: 'aset', title: 'Aset' },
    { key: 'kewajiban', title: 'Kewajiban' },
    { key: 'ekuitas', title: 'Ekuitas' },
];

function Block({
    title,
    items,
    subtotal,
    sub,
}: {
    title: string;
    items: Item[];
    subtotal: number;
    sub?: boolean;
}) {
    return (
        <>
            <tr className={sub ? '' : 'bg-muted/50'}>
                <td
                    className={`p-3 font-semibold capitalize ${sub ? 'pl-6 italic' : ''}`}
                    colSpan={3}
                >
                    {title}
                </td>
            </tr>
            {items.map((i) => (
                <tr key={i.code + i.name} className="border-t">
                    <td className="p-3 pl-6 font-mono">{i.code}</td>
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 text-right">{rupiah(i.amount)}</td>
                </tr>
            ))}
            <tr className="border-t font-medium">
                <td className="p-3 pl-6" colSpan={2}>
                    Total {title.toLowerCase()}
                </td>
                <td className="p-3 text-right">{rupiah(subtotal)}</td>
            </tr>
        </>
    );
}

export default function BalanceSheet({ filters, detailed, report }: Props) {
    const totals: Record<string, number> = {
        aset: report.total_assets,
        kewajiban: report.total_liabilities,
        ekuitas: report.total_equity,
    };
    const title = detailed ? 'Laporan Posisi Keuangan' : 'Neraca';
    const path = detailed ? '/laporan/posisi-keuangan' : '/laporan/neraca';

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">{title}</h1>
                <ReportFilter path={path} filters={filters} asOf />

                <div className={tableBox}>
                    <table className="w-full text-sm">
                        <tbody>
                            {TYPES.map((t) => {
                                const groups = report.groups.filter(
                                    (g) => g.type === t.key,
                                );

                                return (
                                    <FragmentFor
                                        key={t.key}
                                        title={t.title}
                                        groups={groups}
                                        total={totals[t.key]}
                                        detailed={detailed}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <p
                    className={
                        report.balanced
                            ? 'text-sm text-green-600'
                            : 'text-sm text-red-500'
                    }
                >
                    {report.balanced
                        ? `Seimbang: Aset ${rupiah(report.total_assets)} = Kewajiban + Ekuitas ${rupiah(report.total_liabilities + report.total_equity)}.`
                        : 'TIDAK seimbang: Aset berbeda dengan Kewajiban + Ekuitas.'}
                </p>
            </div>
        </>
    );
}

function FragmentFor({
    title,
    groups,
    total,
    detailed,
}: {
    title: string;
    groups: Group[];
    total: number;
    detailed: boolean;
}) {
    if (detailed) {
        return (
            <>
                <tr className="bg-muted/50">
                    <td className="p-3 font-semibold" colSpan={3}>
                        {title}
                    </td>
                </tr>
                {groups.map((g) => (
                    <Block
                        key={g.category}
                        title={g.category}
                        items={g.accounts}
                        subtotal={g.subtotal}
                        sub
                    />
                ))}
                <tr className="border-t bg-muted/50 font-semibold">
                    <td className="p-3" colSpan={2}>
                        Total {title}
                    </td>
                    <td className="p-3 text-right">{rupiah(total)}</td>
                </tr>
            </>
        );
    }

    return (
        <Block
            title={title}
            items={groups.flatMap((g) => g.accounts)}
            subtotal={total}
        />
    );
}

BalanceSheet.layout = {
    breadcrumbs: [{ title: 'Neraca', href: '/laporan/neraca' }],
};
