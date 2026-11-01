export const rupiah = (n: number | string): string =>
    Number(n).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

/** Untuk kolom debit/kredit: angka 0 dikosongkan supaya tabel mudah dibaca. */
export const rupiahOrBlank = (n: number | string): string =>
    Number(n) === 0 ? '' : rupiah(n);

export const tableBox =
    'overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border';
