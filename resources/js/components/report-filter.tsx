import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    path: string;
    filters: { dari?: string; sampai: string };
    asOf?: boolean;
    extra?: Record<string, string>;
    children?: ReactNode;
};

// Format tanggal lokal YYYY-MM-DD (tanpa toISOString supaya tidak bergeser zona waktu)
const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const presets = [
    {
        label: 'Bulan ini',
        range: (n: Date) => [
            new Date(n.getFullYear(), n.getMonth(), 1),
            new Date(n.getFullYear(), n.getMonth() + 1, 0),
        ],
    },
    {
        label: 'Bulan lalu',
        range: (n: Date) => [
            new Date(n.getFullYear(), n.getMonth() - 1, 1),
            new Date(n.getFullYear(), n.getMonth(), 0),
        ],
    },
    {
        label: 'Tahun ini',
        range: (n: Date) => [
            new Date(n.getFullYear(), 0, 1),
            new Date(n.getFullYear(), 11, 31),
        ],
    },
];

export function ReportFilter({
    path,
    filters,
    asOf = false,
    extra = {},
    children,
}: Props) {
    const [dari, setDari] = useState(filters.dari ?? '');
    const [sampai, setSampai] = useState(filters.sampai);

    function go(from: string, to: string) {
        const query: Record<string, string> = { ...extra, sampai: to };
        if (!asOf) {
            query.dari = from;
        }
        Object.keys(query).forEach((k) => {
            if (query[k] === '') {
                delete query[k];
            }
        });

        router.get(path, query);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        go(dari, sampai);
    }

    function applyPreset(range: (n: Date) => Date[]) {
        const [from, to] = range(new Date());
        setDari(ymd(from));
        setSampai(ymd(to));
        go(ymd(from), ymd(to));
    }

    return (
        <form
            onSubmit={submit}
            className="flex flex-wrap items-end gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
        >
            {!asOf && (
                <div className="grid gap-2">
                    <Label htmlFor="dari">Dari tanggal</Label>
                    <Input
                        id="dari"
                        type="date"
                        value={dari}
                        onChange={(e) => setDari(e.target.value)}
                    />
                </div>
            )}
            <div className="grid gap-2">
                <Label htmlFor="sampai">
                    {asOf ? 'Per tanggal' : 'Sampai tanggal'}
                </Label>
                <Input
                    id="sampai"
                    type="date"
                    value={sampai}
                    onChange={(e) => setSampai(e.target.value)}
                />
            </div>
            {children}
            <Button type="submit">Tampilkan</Button>
            <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <Button
                        key={p.label}
                        type="button"
                        variant="outline"
                        onClick={() => applyPreset(p.range)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>
        </form>
    );
}
