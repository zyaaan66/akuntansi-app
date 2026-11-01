import { Head } from '@inertiajs/react';
import { ReportFilter } from '@/components/report-filter';
import { rupiah, rupiahOrBlank, tableBox } from '@/lib/format';

type Props = {
    filters: { sampai: string };
    report: {
        rows: { code: string; name: string; debit: number; credit: number }[];
        total_debit: number;
        total_credit: number;
        balanced: boolean;
    };
};

export default function TrialBalance({ filters, report }: Props) {
    return (
        <>
            <Head title="Neraca Saldo" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Neraca Saldo</h1>
                <ReportFilter
                    path="/laporan/neraca-saldo"
                    filters={filters}
                    asOf
                />

                <div className={tableBox}>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3">Kode</th>
                                <th className="p-3">Nama akun</th>
                                <th className="p-3 text-right">Debit</th>
                                <th className="p-3 text-right">Kredit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Belum ada transaksi.
                                    </td>
                                </tr>
                            )}
                            {report.rows.map((r) => (
                                <tr key={r.code} className="border-t">
                                    <td className="p-3 font-mono">{r.code}</td>
                                    <td className="p-3">{r.name}</td>
                                    <td className="p-3 text-right">
                                        {rupiahOrBlank(r.debit)}
                                    </td>
                                    <td className="p-3 text-right">
                                        {rupiahOrBlank(r.credit)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t font-semibold">
                                <td className="p-3" colSpan={2}>
                                    Total
                                </td>
                                <td className="p-3 text-right">
                                    {rupiah(report.total_debit)}
                                </td>
                                <td className="p-3 text-right">
                                    {rupiah(report.total_credit)}
                                </td>
                            </tr>
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
                        ? 'Seimbang: total debit sama dengan total kredit.'
                        : 'TIDAK seimbang: total debit berbeda dengan total kredit.'}
                </p>
            </div>
        </>
    );
}

TrialBalance.layout = {
    breadcrumbs: [{ title: 'Neraca Saldo', href: '/laporan/neraca-saldo' }],
};
