(function () {
  "use strict";

  var CONFIG = window.APP_CONFIG || {};
  var PAGE_SIZE = 50;

  var state = {
    all: [],
    filtered: [],
    page: 1,
    search: "",
    kabKota: "",
    jenjang: "",
    jenisBimtek: "",
    jabatan: "",
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", function () {
    els.status = document.getElementById("status");
    els.controls = document.getElementById("controls");
    els.tableWrap = document.getElementById("table-wrap");
    els.tbody = document.getElementById("tbody");
    els.summary = document.getElementById("summary");
    els.pagination = document.getElementById("pagination");
    els.search = document.getElementById("search");
    els.filterKab = document.getElementById("filter-kab");
    els.filterJenjang = document.getElementById("filter-jenjang");
    els.filterBimtek = document.getElementById("filter-bimtek");
    els.filterJabatan = document.getElementById("filter-jabatan");
    els.resetBtn = document.getElementById("reset-filters");

    loadData();
  });

  // The exact gid of the response tab isn't always known (Google Forms can
  // create it as a non-zero gid, or the doc has multiple tabs), and a wrong
  // gid makes /export return HTTP 400. Try several candidate URLs and accept
  // the first one that actually contains the expected header columns.
  function candidateUrls() {
    var id = encodeURIComponent(CONFIG.sheetId);
    var ts = "&_ts=" + Date.now();
    var urls = [];
    if (CONFIG.gid) {
      urls.push(
        "https://docs.google.com/spreadsheets/d/" + id +
          "/export?format=csv&gid=" + encodeURIComponent(CONFIG.gid) + ts
      );
      urls.push(
        "https://docs.google.com/spreadsheets/d/" + id +
          "/gviz/tq?tqx=out:csv&gid=" + encodeURIComponent(CONFIG.gid) + ts
      );
    }
    // No/omitted gid defaults to the first visible sheet tab.
    urls.push(
      "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv" + ts
    );
    urls.push(
      "https://docs.google.com/spreadsheets/d/" + id + "/export?format=csv" + ts
    );
    return urls;
  }

  function fetchCsv(urls, index) {
    if (index >= urls.length) {
      return Promise.reject(
        new Error("Semua percobaan pengambilan data gagal (cek sharing & gid sheet).")
      );
    }
    return fetch(urls[index], { credentials: "omit" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        var rows = parseCSV(text);
        if (!rows.length || findColumn(rows[0], "Nama Peserta") === -1) {
          throw new Error("Header kolom tidak cocok pada URL ini.");
        }
        return rows;
      })
      .catch(function () {
        return fetchCsv(urls, index + 1);
      });
  }

  function loadData() {
    if (!CONFIG.sheetId) {
      showError("Konfigurasi sumber data (data/config.js) belum diisi.");
      return;
    }

    fetchCsv(candidateUrls(), 0)
      .then(function (rows) {
        state.all = mapRows(rows);
        state.filtered = state.all;
        populateFilters(state.all);
        bindControls();
        els.controls.hidden = false;
        els.tableWrap.hidden = false;
        els.status.hidden = true;
        applyFilters();
      })
      .catch(function (err) {
        console.error(err);
        showError(
          "Gagal memuat data dari Google Sheet. Pastikan sharing spreadsheet " +
            'diatur ke "Anyone with the link can view", lalu muat ulang halaman. ' +
            "(" + err.message + ")"
        );
      });
  }

  function showError(msg) {
    els.status.hidden = false;
    els.status.className = "status status--error";
    els.status.textContent = msg;
  }

  // Minimal RFC4180 CSV parser: handles quoted fields, embedded commas,
  // embedded newlines, and doubled-quote escaping.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;
    var len = text.length;

    while (i < len) {
      var ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += ch;
        i++;
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (ch === "\r") {
        i++;
        continue;
      }
      if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
        continue;
      }
      field += ch;
      i++;
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter(function (r) {
      return !(r.length === 1 && r[0] === "");
    });
  }

  function findColumn(header, name) {
    var idx = -1;
    for (var i = 0; i < header.length; i++) {
      if (header[i].trim() === name) idx = i;
    }
    return idx;
  }

  function mapRows(rows) {
    var header = rows[0];
    var cols = {
      nama: findColumn(header, "Nama Peserta"),
      jabatan: findColumn(header, "Jabatan"),
      noHp: findColumn(header, "No Hp"),
      jenisBimtek: findColumn(header, "Jenis Bimtek"),
      kabKota: findColumn(header, "Kab/Kota"),
      jenjangSekolah: findColumn(header, "Jenjang Sekolah"),
      npsn: findColumn(header, "NPSN"),
      namaSekolah: findColumn(header, "Nama Sekolah"),
      namaGugus: findColumn(header, "Nama Gugus"),
    };

    var missing = Object.keys(cols).filter(function (k) {
      return cols[k] === -1;
    });
    if (missing.length) {
      throw new Error("Kolom tidak ditemukan di sheet: " + missing.join(", "));
    }

    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row || row.every(function (c) { return c.trim() === ""; })) continue;
      var noHp = (row[cols.noHp] || "").trim();
      out.push({
        nama: (row[cols.nama] || "").trim(),
        jabatan: (row[cols.jabatan] || "").trim(),
        noHp: noHp,
        noHpWa: normalizeWa(noHp),
        jenisBimtek: (row[cols.jenisBimtek] || "").trim(),
        kabKota: (row[cols.kabKota] || "").trim(),
        jenjangSekolah: (row[cols.jenjangSekolah] || "").trim(),
        npsn: (row[cols.npsn] || "").trim(),
        namaSekolah: (row[cols.namaSekolah] || "").trim(),
        namaGugus: (row[cols.namaGugus] || "").trim(),
      });
    }
    return out;
  }

  function normalizeWa(raw) {
    var s = (raw || "").trim();
    if (!s) return null;
    s = s.replace(/[Oo]/g, "0");
    var digits = s.replace(/[^\d+]/g, "");
    if (digits.indexOf("+62") === 0) {
      digits = "62" + digits.slice(3);
    } else if (digits.indexOf("62") === 0) {
      // already in international form
    } else if (digits.indexOf("0") === 0) {
      digits = "62" + digits.slice(1);
    } else {
      return null;
    }
    digits = digits.replace(/\+/g, "");
    if (!/^628\d{7,12}$/.test(digits)) return null;
    return digits;
  }

  function uniqueSorted(list, key) {
    var set = {};
    list.forEach(function (item) {
      if (item[key]) set[item[key]] = true;
    });
    return Object.keys(set).sort(function (a, b) {
      return a.localeCompare(b, "id");
    });
  }

  function fillSelect(select, values, label) {
    select.innerHTML = "";
    var optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "Semua " + label;
    select.appendChild(optAll);
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  function populateFilters(list) {
    fillSelect(els.filterKab, uniqueSorted(list, "kabKota"), "Kab/Kota");
    fillSelect(els.filterJenjang, uniqueSorted(list, "jenjangSekolah"), "Jenjang");
    fillSelect(els.filterBimtek, uniqueSorted(list, "jenisBimtek"), "Jenis Bimtek");
    fillSelect(els.filterJabatan, uniqueSorted(list, "jabatan"), "Jabatan");
  }

  function bindControls() {
    var debounceTimer;
    els.search.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      var val = els.search.value;
      debounceTimer = setTimeout(function () {
        state.search = val.trim().toLowerCase();
        state.page = 1;
        applyFilters();
      }, 150);
    });
    els.filterKab.addEventListener("change", function () {
      state.kabKota = els.filterKab.value;
      state.page = 1;
      applyFilters();
    });
    els.filterJenjang.addEventListener("change", function () {
      state.jenjang = els.filterJenjang.value;
      state.page = 1;
      applyFilters();
    });
    els.filterBimtek.addEventListener("change", function () {
      state.jenisBimtek = els.filterBimtek.value;
      state.page = 1;
      applyFilters();
    });
    els.filterJabatan.addEventListener("change", function () {
      state.jabatan = els.filterJabatan.value;
      state.page = 1;
      applyFilters();
    });
    els.resetBtn.addEventListener("click", function () {
      state.search = "";
      state.kabKota = "";
      state.jenjang = "";
      state.jenisBimtek = "";
      state.jabatan = "";
      state.page = 1;
      els.search.value = "";
      els.filterKab.value = "";
      els.filterJenjang.value = "";
      els.filterBimtek.value = "";
      els.filterJabatan.value = "";
      applyFilters();
    });
  }

  function applyFilters() {
    var q = state.search;
    state.filtered = state.all.filter(function (item) {
      if (state.kabKota && item.kabKota !== state.kabKota) return false;
      if (state.jenjang && item.jenjangSekolah !== state.jenjang) return false;
      if (state.jenisBimtek && item.jenisBimtek !== state.jenisBimtek) return false;
      if (state.jabatan && item.jabatan !== state.jabatan) return false;
      if (q) {
        var haystack = (
          item.nama +
          " " +
          item.noHp +
          " " +
          item.namaSekolah +
          " " +
          item.namaGugus +
          " " +
          item.npsn
        ).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });
    render();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    var total = state.filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageItems = state.filtered.slice(start, start + PAGE_SIZE);

    els.summary.textContent =
      total === 0
        ? "Tidak ada kontak yang cocok dengan filter."
        : "Menampilkan " +
          (start + 1) +
          "–" +
          Math.min(start + PAGE_SIZE, total) +
          " dari " +
          total +
          " kontak (total data: " +
          state.all.length +
          ")";

    els.tbody.innerHTML = pageItems
      .map(function (item) {
        var phoneCell;
        if (item.noHpWa) {
          var text = encodeURIComponent(
            "Yth. Bapak/Ibu " + item.nama + ",\n\nKami dari BPMP Provinsi NTB ingin menyampaikan informasi terkait " +
              item.jenisBimtek +
              "."
          );
          phoneCell =
            '<a class="wa-btn" target="_blank" rel="noopener" href="https://wa.me/' +
            item.noHpWa +
            "?text=" +
            text +
            '" title="Kirim WhatsApp ke ' +
            escapeHtml(item.noHp) +
            '">' +
            waIcon() +
            '<span>' + escapeHtml(item.noHp) + '</span>' +
            "</a>";
        } else {
          phoneCell =
            '<span class="phone-invalid" title="Format nomor tidak dikenali">' +
            escapeHtml(item.noHp || "-") +
            "</span>";
        }
        return (
          "<tr>" +
          "<td>" + escapeHtml(item.nama) + "</td>" +
          "<td>" + escapeHtml(item.jabatan) + "</td>" +
          "<td>" + phoneCell + "</td>" +
          "<td>" + escapeHtml(item.jenisBimtek) + "</td>" +
          "<td>" + escapeHtml(item.kabKota) + "</td>" +
          "<td>" + escapeHtml(item.jenjangSekolah) + "</td>" +
          "<td>" + escapeHtml(item.npsn) + "</td>" +
          "<td>" + escapeHtml(item.namaSekolah) + "</td>" +
          "<td>" + escapeHtml(item.namaGugus) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    els.pagination.innerHTML = "";
    if (totalPages <= 1) return;

    function makeBtn(label, page, disabled, active) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.className = "page-btn" + (active ? " page-btn--active" : "");
      btn.disabled = !!disabled;
      btn.addEventListener("click", function () {
        state.page = page;
        render();
        els.tableWrap.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return btn;
    }

    els.pagination.appendChild(makeBtn("«", state.page - 1, state.page <= 1));

    var maxButtons = 7;
    var startPage = Math.max(1, state.page - 3);
    var endPage = Math.min(totalPages, startPage + maxButtons - 1);
    startPage = Math.max(1, endPage - maxButtons + 1);

    for (var p = startPage; p <= endPage; p++) {
      els.pagination.appendChild(makeBtn(String(p), p, false, p === state.page));
    }

    els.pagination.appendChild(
      makeBtn("»", state.page + 1, state.page >= totalPages)
    );
  }

  function waIcon() {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35c1.46.8 3.1 1.22 4.88 1.22 5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.06c-1.6 0-3.15-.43-4.5-1.24l-.32-.19-3.06.8.82-2.99-.21-.31A7.99 7.99 0 0 1 4.04 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8.04-8 8.06Zm4.4-6c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28Z"/>' +
      "</svg>"
    );
  }
})();
