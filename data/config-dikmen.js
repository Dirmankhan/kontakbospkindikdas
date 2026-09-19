// Konfigurasi sumber data untuk halaman Jenjang Dikmen (SMA, SMK, SLB).
// Lihat data/config.js untuk penjelasan lengkap (privasi data, gerbang
// password, dst) - konfigurasi di sini mengikuti pola yang sama.
window.APP_CONFIG = {
  // ID Google Spreadsheet (bagian di antara /d/ dan /edit pada URL sheet).
  sheetId: "10q5lThIX8ZQSNzLjgharF95ah0MUKxNSKFC4YbDMBEQ",
  // GID tab/sheet yang berisi data (0 = tab pertama).
  gid: "0",
  // Sheet sumber ini pakai nama kolom yang sedikit berbeda dari sheet
  // PAUD/SD/SMP/SKB/PKBM: "No HP" (bukan "No Hp"), dan kolom jenjang
  // konsolidasi bernama "Jenjang" saja (bukan "Jenjang Sekolah"). Hanya
  // field yang berbeda perlu disebut di sini - selebihnya pakai default.
  columns: {
    noHp: "No HP",
    jenjangSekolah: "Jenjang",
  },
  // Password sama dengan halaman utama (lihat data/config.js).
  passwordHash: "818bfaf1f2955781ae97c5db84ded472a5d7c13b41a40fdd007a4b1d5c7a9f63",
};
