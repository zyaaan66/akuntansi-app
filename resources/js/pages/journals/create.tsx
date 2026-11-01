import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AccountOption = { id: number; code: string; name: string };
type Line = { account_id: string; debit: string; credit: string };
type Props = { accounts: AccountOption[] };

const emptyLine = (): Line => ({ account_id: '', debit: '', credit: '' });
const today = () => new Date().toLocaleDateString('sv-SE');
const rupiah = (n: number) =>
    n.toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const selectClass =
    'border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs';
const boxClass =
    'rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border';

export default function JournalCreate({ accounts }: Props) {
    const { notice } = usePage().props as unknown as { notice?: string };

    const form = useForm<{
        date: string;
        description: string;
        lines: Line[];
    }>({
        date: today(),
        description: '',
        lines: [emptyLine(), emptyLine()],
    });

    const uploadForm = useForm<{ file: File | null }>({ file: null });
    const [fileKey, setFileKey] = useState(0);

    const errors = form.errors as Record<string, string | undefined>;
    const totalDebit = form.data.lines.reduce(
        (sum, l) => sum + (parseFloat(l.debit) || 0),
        0,
    );
    const totalCredit = form.data.lines.reduce(
        (sum, l) => sum + (parseFloat(l.credit) || 0),
        0,
    );
    const balanced =
        Math.round(totalDebit * 100) === Math.round(totalCredit * 100) &&
        totalDebit > 0;

    function updateLine(i: number, field: keyof Line, value: string) {
        form.setData(
            'lines',
            form.data.lines.map((l, idx) =>
                idx === i ? { ...l, [field]: value } : l,
            ),
        );
    }

    function addLine() {
        form.setData('lines', [...form.data.lines, emptyLine()]);
    }

    function removeLine(i: number) {
        form.setData(
            'lines',
            form.data.lines.filter((_, idx) => idx !== i),
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/journals', { onSuccess: () => form.reset() });
    }

    function submitUpload(e: FormEvent) {
        e.preventDefault();
        uploadForm.post('/journals/upload', {
            forceFormData: true,
            onSuccess: () => {
                uploadForm.reset();
                setFileKey((k) => k + 1);
            },
        });
    }

    return (
        <>
            <Head title="Input Jurnal" />
            <div className="flex flex-col gap-6 p-4">
                {notice && (
                    <div className="rounded-xl border border-green-600/40 bg-green-600/10 p-3 text-sm text-green-700 dark:text-green-400">
                        {notice}
                    </div>
                )}

                <form onSubmit={submit} className={`${boxClass} grid gap-4`}>
                    <h2 className="font-semibold">Input jurnal manual</h2>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Tanggal</Label>
                            <Input
                                id="date"
                                type="date"
                                value={form.data.date}
                                onChange={(e) =>
                                    form.setData('date', e.target.value)
                                }
                            />
                            {errors.date && (
                                <p className="text-sm text-red-500">
                                    {errors.date}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="description">Keterangan</Label>
                            <Input
                                id="description"
                                autoComplete="off"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Contoh: Penjualan tunai"
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-2">Akun</th>
                                    <th className="p-2">Debit</th>
                                    <th className="p-2">Kredit</th>
                                    <th className="p-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {form.data.lines.map((l, i) => (
                                    <tr key={i} className="border-t align-top">
                                        <td className="p-2">
                                            <select
                                                className={selectClass}
                                                value={l.account_id}
                                                onChange={(e) =>
                                                    updateLine(
                                                        i,
                                                        'account_id',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Pilih akun...
                                                </option>
                                                {accounts.map((a) => (
                                                    <option
                                                        key={a.id}
                                                        value={a.id}
                                                    >
                                                        {a.code} - {a.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors[`lines.${i}.account_id`] && (
                                                <p className="text-sm text-red-500">
                                                    {errors[`lines.${i}.account_id`]}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={l.debit}
                                                onChange={(e) =>
                                                    updateLine(
                                                        i,
                                                        'debit',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors[`lines.${i}.debit`] && (
                                                <p className="text-sm text-red-500">
                                                    {errors[`lines.${i}.debit`]}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={l.credit}
                                                onChange={(e) =>
                                                    updateLine(
                                                        i,
                                                        'credit',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors[`lines.${i}.credit`] && (
                                                <p className="text-sm text-red-500">
                                                    {errors[`lines.${i}.credit`]}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {form.data.lines.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        removeLine(i)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t font-medium">
                                    <td className="p-2">Total</td>
                                    <td className="p-2">{rupiah(totalDebit)}</td>
                                    <td className="p-2">
                                        {rupiah(totalCredit)}
                                    </td>
                                    <td className="p-2" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {errors.lines && (
                        <p className="text-sm text-red-500">{errors.lines}</p>
                    )}

                    <p
                        className={
                            balanced
                                ? 'text-sm text-green-600'
                                : 'text-sm text-amber-600'
                        }
                    >
                        {balanced
                            ? 'Seimbang: total debit sama dengan total kredit.'
                            : `Belum seimbang. Selisih ${rupiah(Math.abs(totalDebit - totalCredit))}.`}
                    </p>

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={addLine}>
                            Tambah baris
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Simpan jurnal
                        </Button>
                    </div>
                </form>

                <form
                    onSubmit={submitUpload}
                    className={`${boxClass} grid gap-3`}
                >
                    <h2 className="font-semibold">Upload jurnal (CSV)</h2>
                    <p className="text-sm text-muted-foreground">
                        Kolom: no_jurnal, tanggal (YYYY-MM-DD), keterangan,
                        kode_akun, debit, kredit. Baris dengan no_jurnal sama
                        digabung jadi satu jurnal. Angka ditulis polos tanpa
                        titik ribuan. Jika ada satu baris salah, tidak ada yang
                        disimpan.{' '}
                        <a
                            href="/contoh-jurnal.csv"
                            download
                            className="underline"
                        >
                            Unduh contoh file
                        </a>
                    </p>
                    <input
                        key={fileKey}
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        onChange={(e) =>
                            uploadForm.setData(
                                'file',
                                e.target.files?.[0] ?? null,
                            )
                        }
                    />
                    {uploadForm.errors.file && (
                        <pre className="whitespace-pre-wrap text-sm text-red-500">
                            {uploadForm.errors.file}
                        </pre>
                    )}
                    <div>
                        <Button
                            type="submit"
                            disabled={uploadForm.processing || !uploadForm.data.file}
                        >
                            Upload
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

JournalCreate.layout = {
    breadcrumbs: [
        {
            title: 'Input Jurnal',
            href: '/journals/create',
        },
    ],
};
