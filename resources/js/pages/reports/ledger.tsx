import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ReportFilter } from '@/components/report-filter';
import { Label } from '@/components/ui/label';
import { rupiah, rupiahOrBlank, tableBox } from '@/lib/format';

type Row = {
    date: string;
    number: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
};
type LedgerAccount = {
    code: string;
    name: string;
    normal: string;
    opening: number;
    rows: Row[];
    total_debit: number;
    total_credit: number;
    closing: number;
};
type Props = {
    filters: { dari: string; sampai: string; account_id: string };
    accountOptions: { id: number; code: string; name: string }[];
    ledger: LedgerAccount[];
};

const selectClass =
    'border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs';

export default function Ledger({ filters, accountOptions, ledger }: Props) {
    const [accountId, setAccountId] = useState(filters.account_id);

    return (
        <>
            <Head title="Buku Besar" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Buku Besar</h1>
                <ReportFilter
                    path="/laporan/buku-besar"
                    filters={filters}
                    extra={{ account_id: accountId }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="account_id">Akun</Label>
                        <select
                            id="account_id"
                            className={selectClass}
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        >
                            <option value="">Semua akun</option>
                            {accountOptions.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.code} - {a.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </ReportFilter>

                {ledger.length === 0 && (
                    <p className="text-muted-foreground">
                        Tidak ada transaksi pada periode ini.
                    </p>
                )}

                {ledger.map((a) => (
                    <div key={a.code} className={tableBox}>
                        <div className="bg-muted/50 p-3 text-sm font-semibold">
                            {a.code} - {a.name}{' '}
                            <span className="font-normal text-muted-foreground">
                                (saldo normal {a.normal})
                            </span>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr>
                                    <th className="p-2">Tanggal</th>
                                    <th className="p-2">No. Jurnal</th>
                                    <th className="p-2">Keterangan</th>
                                    <th className="p-2 text-right">Debit</th>
                                    <th className="p-2 text-right">Kredit</th>
                                    <th className="p-2 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t italic">
                                    <td className="p-2" colSpan={5}>
                                        Saldo awal
                                    </td>
                                    <td className="p-2 text-right">
                                        {rupiah(a.opening)}
                                    </td>
                                </tr>
                                {a.rows.map((r, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="p-2">{r.date}</td>
                                        <td className="p-2 font-mono">
                                            {r.number}
                                        </td>
                                        <td className="p-2">{r.description}</td>
                                        <td className="p-2 text-right">
                                            {rupiahOrBlank(r.debit)}
                                        </td>
                                        <td className="p-2 text-right">
                                            {rupiahOrBlank(r.credit)}
                                        </td>
                                        <td className="p-2 text-right">
                                            {rupiah(r.balance)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t font-medium">
                                    <td className="p-2" colSpan={3}>
                                        Total dan saldo akhir
                                    </td>
                                    <td className="p-2 text-right">
                                        {rupiah(a.total_debit)}
                                    </td>
                                    <td className="p-2 text-right">
                                        {rupiah(a.total_credit)}
                                    </td>
                                    <td className="p-2 text-right">
                                        {rupiah(a.closing)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </>
    );
}

Ledger.layout = {
    breadcrumbs: [{ title: 'Buku Besar', href: '/laporan/buku-besar' }],
};
