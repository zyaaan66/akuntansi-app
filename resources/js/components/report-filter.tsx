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

export function ReportFilter({
    path,
    filters,
    asOf = false,
    extra = {},
    children,
}: Props) {
    const [dari, setDari] = useState(filters.dari ?? '');
    const [sampai, setSampai] = useState(filters.sampai);

    function submit(e: FormEvent) {
        e.preventDefault();

        const query: Record<string, string> = { ...extra, sampai };
        if (!asOf) {
            query.dari = dari;
        }
        Object.keys(query).forEach((k) => {
            if (query[k] === '') {
                delete query[k];
            }
        });

        router.get(path, query);
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
        </form>
    );
}
