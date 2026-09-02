// Konfigurasi sumber data.
// Data TIDAK disimpan di repository ini (repo bersifat publik, data berisi
// informasi pribadi peserta). Halaman mengambil data langsung dari Google
// Spreadsheet saat dibuka di browser pengguna.
//
// Pastikan sharing Spreadsheet diatur ke "Anyone with the link" (atau
// dibatasi ke domain organisasi) - JANGAN "Restricted ke akun tertentu saja"
// karena fetch dari browser akan gagal jika pengguna tidak login dengan akun
// yang diizinkan.
window.APP_CONFIG = {
  // ID Google Spreadsheet (bagian di antara /d/ dan /edit pada URL sheet).
  sheetId: "1U5VCWds37zRfDwAblrBV2kwTPURpR38kZ2Hc-0GYPDc",
  // GID tab/sheet yang berisi data (0 = tab pertama).
  gid: "0",
};
