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
  // Gerbang password RINGAN di sisi browser (bukan keamanan sungguhan -
  // siapa pun yang bisa melihat source code halaman ini bisa membaca hash-nya
  // dan mem-brute-force password pendek). Hanya untuk mencegah orang yang
  // kebetulan dapat link situs langsung melihat data.
  // Hash SHA-256 dari password (bukan teks polos). Untuk mengganti password,
  // hitung ulang hash-nya, misalnya di console browser:
  //   crypto.subtle.digest('SHA-256', new TextEncoder().encode('password-baru'))
  //     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
  passwordHash: "818bfaf1f2955781ae97c5db84ded472a5d7c13b41a40fdd007a4b1d5c7a9f63",
};
