import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Account = {
    id: number;
    code: string;
    name: string;
    type: string;
    category: string;
    normal_balance: string;
    is_active: boolean;
};

type Props = {
    accounts: Account[];
    categories: Record<string, string[]>;
    canCreate: boolean;
};

const selectClass =
    'border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs';

export default function AccountsIndex({
    accounts,
    categories,
    canCreate,
}: Props) {
    const types = Object.keys(categories);

    const form = useForm({
        code: '',
        name: '',
        type: types[0],
        category: categories[types[0]][0],
    });

    function changeType(type: string) {
        form.setData((data) => ({
            ...data,
            type,
            category: categories[type][0],
        }));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/accounts', {
            onSuccess: () => form.reset('code', 'name'),
        });
    }

    return (
        <>
            <Head title="Akun (COA)" />
            <div className="flex flex-col gap-6 p-4">
                {canCreate && (
                    <form
                        onSubmit={submit}
                        className="grid gap-4 rounded-xl border border-sidebar-border/70 p-4 md:grid-cols-5 dark:border-sidebar-border"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="code">Kode</Label>
                            <Input
                                id="code"
                                value={form.data.code}
                                onChange={(e) =>
                                    form.setData('code', e.target.value)
                                }
                                placeholder="1-100"
                            />
                            {form.errors.code && (
                                <p className="text-sm text-red-500">
                                    {form.errors.code}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama akun</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="Kas"
                            />
                            {form.errors.name && (
                                <p className="text-sm text-red-500">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Jenis</Label>
                            <select
                                id="type"
                                className={selectClass}
                                value={form.data.type}
                                onChange={(e) => changeType(e.target.value)}
                            >
                                {types.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            {form.errors.type && (
                                <p className="text-sm text-red-500">
                                    {form.errors.type}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Kelompok</Label>
                            <select
                                id="category"
                                className={selectClass}
                                value={form.data.category}
                                onChange={(e) =>
                                    form.setData('category', e.target.value)
                                }
                            >
                                {categories[form.data.type].map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            {form.errors.category && (
                                <p className="text-sm text-red-500">
                                    {form.errors.category}
                                </p>
                            )}
                        </div>

                        <div className="flex items-end">
                            <Button type="submit" disabled={form.processing}>
                                Tambah akun
                            </Button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3">Kode</th>
                                <th className="p-3">Nama</th>
                                <th className="p-3">Jenis</th>
                                <th className="p-3">Kelompok</th>
                                <th className="p-3">Saldo normal</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Belum ada akun.
                                    </td>
                                </tr>
                            )}
                            {accounts.map((a) => (
                                <tr key={a.id} className="border-t">
                                    <td className="p-3 font-mono">{a.code}</td>
                                    <td className="p-3">{a.name}</td>
                                    <td className="p-3 capitalize">{a.type}</td>
                                    <td className="p-3 capitalize">
                                        {a.category}
                                    </td>
                                    <td className="p-3 capitalize">
                                        {a.normal_balance}
                                    </td>
                                    <td className="p-3">
                                        {a.is_active ? 'Aktif' : 'Nonaktif'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

AccountsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Akun (COA)',
            href: '/accounts',
        },
    ],
};