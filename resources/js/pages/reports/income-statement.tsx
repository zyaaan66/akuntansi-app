import { Head } from '@inertiajs/react';
import { ReportFilter } from '@/components/report-filter';
import { rupiah, tableBox } from '@/lib/format';

type Item = { code: string; name: string; amount: number };
type Props = {
    filters: { dari: string; sampai: string };
    report: {
        revenues: Item[];
        expenses: Item[];
        total_revenue: number;
        total_expense: number;
        net_income: number;
    };
};

function Section({
    title,
    items,
    total,
}: {
    title: string;
    items: Item[];
    total: number;
}) {
    return (
        <>
            <tr className="bg-muted/50">
                <td className="p-3 font-semibold" colSpan={3}>
                    {title}
                </td>
            </tr>
            {items.length === 0 && (
                <tr className="border-t">
                    <td
                        className="p-3 text-muted-foreground"
                        colSpan={3}
                    >
                        Tidak ada.
                    </td>
                </tr>
            )}
            {items.map((i) => (
                <tr key={i.code} className="border-t">
                    <td className="p-3 font-mono">{i.code}</td>
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 text-right">{rupiah(i.amount)}</td>
                </tr>
            ))}
            <tr className="border-t font-medium">
                <td className="p-3" colSpan={2}>
                    Total {title.toLowerCase()}
                </td>
                <td className="p-3 text-right">{rupiah(total)}</td>
            </tr>
        </>
    );
}

export default function IncomeStatement({ filters, report }: Props) {
    return (
        <>
            <Head title="Laba Rugi" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Laporan Laba Rugi</h1>
                <ReportFilter path="/laporan/laba-rugi" filters={filters} />

                <div className={tableBox}>
                    <table className="w-full text-sm">
                        <tbody>
                            <Section
                                title="Pendapatan"
                                items={report.revenues}
                                total={report.total_revenue}
                            />
                            <Section
                                title="Beban"
                                items={report.expenses}
                                total={report.total_expense}
                            />
                            <tr className="border-t bg-muted/50 font-semibold">
                                <td className="p-3" colSpan={2}>
                                    {report.net_income >= 0
                                        ? 'Laba bersih'
                                        : 'Rugi bersih'}
                                </td>
                                <td className="p-3 text-right">
                                    {rupiah(report.net_income)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

IncomeStatement.layout = {
    breadcrumbs: [{ title: 'Laba Rugi', href: '/laporan/laba-rugi' }],
};
