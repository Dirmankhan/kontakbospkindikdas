# Kontak BOSP Kinerja — Direktori Kontak Peserta Bimtek

Platform web statis untuk menampilkan dan mencari kontak peserta Bimtek
(Nama Peserta, Jabatan, No Hp, Jenis Bimtek, Kab/Kota, Jenjang Sekolah,
NPSN, Nama Sekolah, Nama Gugus), dengan tombol untuk langsung mengirim
pesan WhatsApp ke nomor yang dipilih.

## Cara kerja & privasi data

Repositori ini **publik**, sedangkan data peserta (nama dan nomor HP)
bersifat pribadi. Karena itu, data **tidak disimpan** di dalam repositori
ini sama sekali (tidak ada file CSV/JSON berisi data peserta yang
di-commit).

Sebagai gantinya, halaman (`index.html` + `assets/app.js`) mengambil data
langsung dari Google Spreadsheet sumber **di browser pengguna**, setiap
kali halaman dibuka:

- URL sumber: `https://docs.google.com/spreadsheets/d/<sheetId>/export?format=csv&gid=<gid>`
- ID spreadsheet dan gid diatur di `data/config.js`.

## Gerbang password (proteksi ringan)

Situs ini menampilkan layar password sebelum tabel data dimuat
(`data/config.js` → `passwordHash`, sebuah hash SHA-256, bukan teks polos).
Ini **hanya penghalang ringan** untuk mencegah orang yang kebetulan
mendapat link situs langsung melihat data — **bukan keamanan sungguhan**:
siapa pun yang cukup teknis bisa membaca hash-nya dari source code lalu
mem-brute-force password pendek, atau langsung membuka Google Sheet
sumbernya kalau tahu link-nya. Untuk perlindungan data yang sebenarnya,
batasi sharing Google Sheet ke akun/domain tertentu (lihat bagian di
bawah), bukan mengandalkan gerbang ini.

Setelah password benar dimasukkan sekali, status "sudah login" disimpan di
`sessionStorage` browser (hilang saat tab/browser ditutup).

Untuk mengganti password, hitung ulang hash SHA-256-nya lalu ganti nilai
`passwordHash` di `data/config.js`. Bisa dihitung lewat console browser:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('password-baru'))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
```

## Kontrol akses data (Google Sheet)

Karena itu, **kontrol akses terhadap data sepenuhnya bergantung pada
pengaturan share Google Sheet**, bukan pada repositori ini:

- Jika Sheet dibagikan sebagai **"Anyone with the link"**, siapa pun yang
  membuka situs ini bisa melihat datanya (tidak akan terindeks mesin
  pencari, tapi tetap bisa diakses siapa saja yang tahu URL situs).
- Jika ingin lebih terbatas, atur Sheet agar hanya bisa diakses oleh akun
  tertentu/domain organisasi (mis. akun `@kemendikdasmen.go.id` atau
  Google Workspace instansi). Pengunjung yang tidak login dengan akun yang
  diizinkan akan melihat pesan gagal memuat data.

Jadi: **atur ulang izin/keamanan cukup dari Google Sheet-nya**, tanpa perlu
mengubah kode di repo ini.

## Struktur proyek

```
index.html          Halaman utama (tabel, pencarian, filter)
assets/style.css     Tampilan
assets/app.js        Fetch + parse CSV, normalisasi nomor WA, render tabel,
                      pencarian, filter, dan pagination
data/config.js       ID Google Sheet & gid sumber data (bukan data itu sendiri)
```

## Menjalankan / deploy

Situs ini murni statis (HTML/CSS/JS, tanpa build step), jadi bisa dibuka
langsung atau di-deploy ke layanan hosting statis apa pun, misalnya
**GitHub Pages**:

1. Settings → Pages → Source: `Deploy from a branch` → pilih branch ini,
   folder `/ (root)`.
2. Buka URL GitHub Pages yang dihasilkan.

Untuk mencoba secara lokal, jalankan server statis sederhana lalu buka di
browser (jangan buka `index.html` langsung via `file://` karena beberapa
browser memblokir `fetch()` lintas origin dari file lokal):

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## Mengganti sumber data

Jika suatu saat form/spreadsheet sumber berganti, cukup ubah `sheetId` dan
`gid` di `data/config.js`. Nama-nama kolom yang dibaca dari sheet harus
persis sama dengan: `Nama Peserta`, `Jabatan`, `No Hp`, `Jenis Bimtek`,
`Kab/Kota`, `Jenjang Sekolah`, `NPSN`, `Nama Sekolah`, `Nama Gugus`
(kolom-kolom lain di sheet diabaikan).

## Normalisasi nomor WhatsApp

`assets/app.js` menormalkan nomor HP ke format internasional (`62...`)
untuk membuat tautan `https://wa.me/...`:

- `08xxxxxxxxxx` → `628xxxxxxxxxx`
- `+62xxxxxxxxxx` / `62xxxxxxxxxx` → dipakai apa adanya
- Spasi/tanda baca dibuang, huruf `O`/`o` dianggap salah ketik untuk `0`
- Entri yang tidak cocok pola nomor HP Indonesia (mis. NIP, teks seperti
  "Ada") ditampilkan sebagai teks biasa tanpa tombol WhatsApp

## Penampil kontrol (search & filter)

- Pencarian bebas: nama, no HP, nama sekolah, nama gugus, NPSN
- Filter: Kab/Kota, Jenjang Sekolah, Jenis Bimtek, Jabatan
- Pagination 50 data per halaman (total data mengikuti jumlah baris di sheet)
