import { Head, Link } from '@inertiajs/react';
import { ReportFilter } from '@/components/report-filter';
import { rupiah, rupiahOrBlank, tableBox } from '@/lib/format';

type Line = {
    id: number;
    debit: string;
    credit: string;
    account: { code: string; name: string };
};
type JournalRow = {
    id: number;
    number: string;
    date: string;
    description: string;
    source: string;
    creator: { name: string } | null;
    lines: Line[];
};
type Props = {
    filters: { dari: string; sampai: string };
    journals: {
        data: JournalRow[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
};

export default function Transactions({ filters, journals }: Props) {
    return (
        <>
            <Head title="Data Transaksi" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Data Transaksi</h1>
                <ReportFilter path="/laporan/transaksi" filters={filters} />

                {journals.data.length === 0 && (
                    <p className="text-muted-foreground">
                        Tidak ada jurnal pada periode ini.
                    </p>
                )}

                {journals.data.map((j) => {
                    const totalDebit = j.lines.reduce(
                        (s, l) => s + Number(l.debit),
                        0,
                    );
                    const totalCredit = j.lines.reduce(
                        (s, l) => s + Number(l.credit),
                        0,
                    );

                    return (
                        <div key={j.id} className={tableBox}>
                            <div className="flex flex-wrap gap-x-4 bg-muted/50 p-3 text-sm">
                                <span className="font-mono font-semibold">
                                    {j.number}
                                </span>
                                <span>{j.date}</span>
                                <span className="flex-1">{j.description}</span>
                                <span className="text-muted-foreground">
                                    {j.source === 'upload' ? 'Upload' : 'Manual'}
                                    {j.creator ? ` - ${j.creator.name}` : ''}
                                </span>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {j.lines.map((l) => (
                                        <tr key={l.id} className="border-t">
                                            <td className="p-2 font-mono">
                                                {l.account.code}
                                            </td>
                                            <td className="p-2">
                                                {l.account.name}
                                            </td>
                                            <td className="p-2 text-right">
                                                {rupiahOrBlank(l.debit)}
                                            </td>
                                            <td className="p-2 text-right">
                                                {rupiahOrBlank(l.credit)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t font-medium">
                                        <td className="p-2" colSpan={2}>
                                            Total
                                        </td>
                                        <td className="p-2 text-right">
                                            {rupiah(totalDebit)}
                                        </td>
                                        <td className="p-2 text-right">
                                            {rupiah(totalCredit)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}

                <div className="flex items-center gap-4 text-sm">
                    {journals.prev_page_url && (
                        <Link href={journals.prev_page_url} className="underline">
                            Sebelumnya
                        </Link>
                    )}
                    <span>
                        Halaman {journals.current_page} dari {journals.last_page}{' '}
                        ({journals.total} jurnal)
                    </span>
                    {journals.next_page_url && (
                        <Link href={journals.next_page_url} className="underline">
                            Berikutnya
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}

Transactions.layout = {
    breadcrumbs: [{ title: 'Data Transaksi', href: '/laporan/transaksi' }],
};
