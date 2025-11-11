
// Contact Table -----------------------------------------------------------
const contactSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRW-Q4h-F7682R7AEAbvx76i5jVUoB6J8YSuoAdXyGtxbuIEt7lZYvs0I9yD_5rpIWmH-4sPWcgB8UF/pub?output=csv";
async function loadSheet() {
  try {
    const response = await fetch(contactSheetURL);
    const data = await response.text();

    // Split into rows
    const rows = data.split("\n")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    // Regex: split only on commas NOT inside quotes
    const parsedRows = rows.map(r =>
      r.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(cell =>
        cell.replace(/^"|"$/g, "").trim()
      ) || []
    );

    const table = document.getElementById("contactTable");

    // Build table headers
    let thead = "<tr>";
    parsedRows[0].forEach(h => thead += `<th>${h}</th>`);
    thead += "</tr>";
    table.querySelector("thead").innerHTML = thead;

    // Build table rows
    let tbody = "";
    parsedRows.slice(1).forEach(r => {
      tbody += "<tr>";
      r.forEach(c => {
        let cellValue = (c === "#DIV/0!" || c === "NaN") ? "" : c;
        tbody += `<td>${cellValue}</td>`;
      });
      tbody += "</tr>";
    });
    table.querySelector("tbody").innerHTML = tbody;

  // Attach data-labels so mobile stacked view shows header labels
  if (typeof attachDataLabels === 'function') attachDataLabels('contactTable');

  } catch (error) {
    console.error("Error loading sheet:", error);
  }
}
document.addEventListener("DOMContentLoaded", loadSheet);
//---------------------------------------------------------------------------

// Average Table -----------------------------------------------------------
const averageSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8otr4FhiKphMRikCmMun05LgrbM96mMOVjh14bDBmA4Iqp9boZ14ibHjDxxXUI-qlEQDb3quWpjVx/pub?gid=1357455712&single=true&output=csv";
async function loadSheet2() {
  try {
    const response = await fetch(averageSheetURL);
    const data = await response.text();

    // Split into rows
    const rows = data.split("\n")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    // Regex: split only on commas NOT inside quotes
    const parsedRows = rows.map(r =>
      r.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(cell =>
        cell.replace(/^"|"$/g, "").trim()
      ) || []
    );

    const table = document.getElementById("dataTable");

    // Build table headers
    let thead = "<tr>";
    parsedRows[0].forEach(h => thead += `<th>${h}</th>`);
    thead += "</tr>";
    table.querySelector("thead").innerHTML = thead;

    // Build table rows
    let tbody = "";
    parsedRows.slice(1).forEach(r => {
      tbody += "<tr>";
      r.forEach(c => {
        let cellValue = (c === "#DIV/0!" || c === "NaN") ? "" : c;
        tbody += `<td>${cellValue}</td>`;
      });
      tbody += "</tr>";
    });
    table.querySelector("tbody").innerHTML = tbody;

  // Attach data-labels so mobile stacked view shows header labels
  if (typeof attachDataLabels === 'function') attachDataLabels('dataTable');

  } catch (error) {
    console.error("Error loading sheet:", error);
  }
}
document.addEventListener("DOMContentLoaded", loadSheet2);

// Schedule Table (from user-provided Google Sheets CSV)
const scheduleSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRiURZeKKUE8g3VOLHN9ECdUmX5V8lBstIhGjYwV3mV4yjwAM0CwPnFZpPvMXUK8A/pub?gid=2115573356&single=true&output=csv";
// Helper: convert a published CSV URL to the published HTML (pubhtml) URL
function getPubHtmlUrl(csvUrl) {
  try {
    let u = csvUrl.replace('/pub?', '/pubhtml?');
    u = u.replace(/(&|\?)output=csv/, '');
    u = u.replace(/&&/g, '&').replace(/&$/, '');
    return u;
  } catch (e) {
    return csvUrl;
  }
}

// Try to load the published HTML version of the sheet (preserves formatting)
async function loadScheduleHTML() {
  try {
    const htmlUrl = getPubHtmlUrl(scheduleSheetURL);
    const resp = await fetch(htmlUrl);
    if (!resp.ok) return false;
    const text = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const fetchedTable = doc.querySelector('table');
    if (!fetchedTable) return false;
    const tableClone = fetchedTable.cloneNode(true);
    tableClone.id = 'scheduleTable';
    const container = document.querySelector('#schedule .table-responsive');
    if (!container) return false;
    container.innerHTML = '';
    container.appendChild(tableClone);
    if (typeof attachDataLabels === 'function') attachDataLabels('scheduleTable');
    return true;
  } catch (error) {
    return false;
  }
}
function parseCSV(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      // Escaped quote ("")
      current += '"';
      i++;
    } else if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of cell
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (only if NOT in quotes)
      if (current || row.length > 0) {
        row.push(current);
        if (row.some(cell => cell.trim() !== '')) {
          rows.push(row.map(c => c.trim()));
        }
        row = [];
        current = '';
      }
    } else {
      // Normal char, including newlines inside quotes
      current += char;
    }
  }

  // Push last row
  if (current || row.length > 0) {
    row.push(current);
    if (row.some(cell => cell.trim() !== '')) {
      rows.push(row.map(c => c.trim()));
    }
  }

  return rows;
}
async function loadSchedule() {
  try {
    const response = await fetch(scheduleSheetURL);
    const data = await response.text();

    const parsedRows = parseCSV(data);
    const table = document.getElementById("scheduleTable");
    if (!table) return;

  // headers
  const headers = parsedRows[0] || [];

    // determine which columns are Date or House-ish so we can format them
    const dateIdx = headers.findIndex(h => /date|day|when/i.test(h));
    const houseIdx = headers.findIndex(h => /house|location|venue|site|lanes|bowl|bowling/i.test(h));
  // Prepay/payment column (if present); fall back to last column
  let prepayIdx = headers.findIndex(h => /prepay|pay|payment|link/i.test(h));
  if (prepayIdx === -1) prepayIdx = Math.max(0, headers.length - 1);

    // Build thead and add class for house/date/prepay columns so CSS can target them
    let thead = "<tr>";
    headers.forEach((h, idx) => {
      const thClass = [];
      if (idx === dateIdx) thClass.push('col-date');
      if (idx === houseIdx) thClass.push('col-house');
      if (idx === prepayIdx) thClass.push('col-prepay');
      const classAttr = thClass.length ? ` class="${thClass.join(' ')}"` : '';
      thead += `<th${classAttr}>${h}</th>`;
    });
    thead += "</tr>";
    table.querySelector("thead").innerHTML = thead;

    // body
    let tbody = "";
    parsedRows.slice(1).forEach(row => {
      tbody += "<tr>";
      row.forEach((cell, i) => {
        let cellValue = (cell === "#DIV/0!" || cell === "NaN") ? "" : cell;

        // Format Date column to short form (e.g., Sep 27)
        if (i === dateIdx && cellValue) {
          // Try parse common date formats; fall back to original text
          const parsed = Date.parse(cellValue.replace(/\./g,' '));
          if (!isNaN(parsed)) {
            const d = new Date(parsed);
            try {
              cellValue = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } catch (e) {
              // ignore and keep original
            }
          }
        }

  // Shorten or allow wrapping for date/house/prepay columns by adding a class
  let classAttr = '';
  if (i === dateIdx) classAttr = ' class="col-date"';
  else if (i === houseIdx) classAttr = ' class="col-house"';
  else if (i === prepayIdx) classAttr = ' class="col-prepay"';

        // If this is the Prepay column, render per-row payment links when present
        if (i === prepayIdx) {
          const raw = (cell || '').trim();

          // Extract labeled links like "OPEN: https://..." or "Guest= https://..."
          const labeled = Array.from(raw.matchAll(/([^:,\n]+?)\s*[:=]\s*(https?:\/\/[^\s,;|"']+)/g))
            .map(m => ({ label: m[1].trim(), url: m[2] }));

          let pairs = [];

          if (labeled.length > 0) {
            // Use labels exactly as provided in the sheet (trimmed)
            pairs = labeled.map(p => ({ label: p.label, url: p.url }));
          } else if (raw) {
            // If no explicit labels, fall back to extracting URLs and guess labels
            const urls = Array.from(raw.matchAll(/https?:\/\/[^\s,;|"']+/g)).map(m => m[0]);
            if (urls.length === 1) {
              const labelGuess = /under/i.test(raw) ? 'Under' : 'Open';
              pairs.push({ label: labelGuess, url: urls[0] });
            } else if (urls.length >= 2) {
              pairs.push({ label: 'Open', url: urls[0] });
              pairs.push({ label: 'Under', url: urls[1] });
            }
          }

          if (pairs.length > 0) {
            const parts = pairs.map(p => {
              // Use a simple class for styling; keep the original label text for the button
              const text = (p.label || '').replace(/^\s+|\s+$/g, '');
              const escText = text || 'Link';
              return `<a class="div-pay" href="${p.url}" target="_blank" rel="noopener noreferrer">${escText}</a>`;
            });
            const linksHtml = `<div class="pay-links">${parts.join('')}</div>`;
            tbody += `<td${classAttr}>${linksHtml}</td>`;
          } else {
            // No links found for this row; render the original cell value (or blank)
            tbody += `<td${classAttr}>${cellValue}</td>`;
          }
        } else {
          tbody += `<td${classAttr}>${cellValue}</td>`;
        }
      });
      tbody += "</tr>";
    });
    table.querySelector("tbody").innerHTML = tbody;

    if (typeof attachDataLabels === "function") attachDataLabels("scheduleTable");

  } catch (error) {
    console.error("Error loading schedule sheet:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadSchedule);

// Load a multi-tournament CSV and render each tournament's rows into the
// matching per-tournament section. The CSV is expected to have the tournament
// identifier in the first column; other columns become the table columns.
async function loadMultiTournamentCSV(csvUrl) {
  function normalize(s) {
    return (s || '') .toString()
      .toLowerCase()
      .replace(/[\u2018\u2019\u201c\u201d]/g, "") // smart quotes
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  try {
    const resp = await fetch(csvUrl);
    if (!resp.ok) {
      console.warn('Failed to fetch tournament sheet:', resp.status);
      return false;
    }
    const text = await resp.text();
    const rows = parseCSV(text);
    if (!rows || rows.length < 2) return false;

    const headers = rows[0].slice(1); // drop first column (tournament key)

    // Build candidate map from per-tournament sections and select options
    const sections = Array.from(document.querySelectorAll('#tournaments section[id^="tournament-"]'))
      .map(sec => ({ id: sec.id, title: (sec.querySelector('h2')?.textContent || '').trim(), norm: normalize(sec.querySelector('h2')?.textContent || '') }));

    const selectOpts = Array.from(document.querySelectorAll('#tournamentSelect option'))
      .map(opt => ({ id: opt.value.replace(/^#/, ''), title: (opt.textContent || '').trim(), norm: normalize(opt.textContent || '') }))
      .filter(o => o.id);

    const candidates = sections.concat(selectOpts).reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});

    // Group rows by first-column raw key
    const groups = {};
    rows.slice(1).forEach(r => {
      const key = (r[0] || '').trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r.slice(1));
    });

    // For each section, find matching group(s) and render only that group's rows
    Object.values(candidates).forEach(candidate => {
      const secEl = document.getElementById(candidate.id);
      if (!secEl) return;

      // Find group whose normalized key equals candidate.norm, or contains/contained
      const matchedKeys = Object.keys(groups).filter(k => {
        const nk = normalize(k);
        if (!nk) return false;
        if (nk === candidate.norm) return true;
        if (candidate.norm.includes(nk) || nk.includes(candidate.norm)) return true;
        return false;
      });

      // If multiple matched keys, concatenate their rows; otherwise empty
      let matchedRows = [];
      matchedKeys.forEach(k => { matchedRows = matchedRows.concat(groups[k]); });

      // Render table for this section (only matchedRows)
      const tableId = candidate.id + '-sheet-table';
      if (matchedRows.length > 0) {
        const thead = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
        const tbody = matchedRows.map(r => '<tr>' + r.map(c => `<td>${(c === '#DIV/0!' || c === 'NaN') ? '' : c}</td>`).join('') + '</tr>').join('');
        const tableHtml = `\n<div class="table-responsive">\n  <table id="${tableId}" class="results-table">\n    <thead>${thead}</thead>\n    <tbody>${tbody}</tbody>\n  </table>\n</div>`;

        const existing = secEl.querySelector('table');
        if (existing) existing.parentElement.innerHTML = tableHtml;
        else {
          const titleEl = secEl.querySelector('h2');
          if (titleEl) titleEl.insertAdjacentHTML('afterend', tableHtml);
          else secEl.insertAdjacentHTML('beforeend', tableHtml);
        }

        if (typeof attachDataLabels === 'function') attachDataLabels(tableId);
      } else {
        // No matched rows: remove any existing sheet table to avoid stale data
        const existing = secEl.querySelector('table');
        if (existing) existing.parentElement.remove();
      }
    });

    // Log any groups that didn't match a candidate (helpful for debugging)
    Object.keys(groups).forEach(k => {
      const nk = normalize(k);
      const found = Object.values(candidates).some(c => {
        const cn = c.norm;
        return cn === nk || cn.includes(nk) || nk.includes(cn);
      });
      if (!found) console.warn('Unmatched tournament group in sheet:', k);
    });

    return true;
  } catch (e) {
    console.error('Error loading multi-tournament CSV', e);
    return false;
  }
}

// Auto-load the provided multi-tournament sheet into the tournament sections
document.addEventListener('DOMContentLoaded', () => {
  const csv = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSY2jkIuOcAuJbRy2LKOUn5648drBahnb9BDtkyhFHyFLXP2Vox3eBCpgi51joO2tfH9fTcFjKVmxRD/pub?gid=0&single=true&output=csv';
  loadMultiTournamentCSV(csv);
});

  
// On load: prefer the published HTML (preserves sheet styling). If that fails, use CSV parsing.
// Try to embed the published sheet via iframe; if that fails, fall back to HTML/CSV parsing
async function tryEmbedSheetIframe() {
  try {
    const iframeUrl = getPubHtmlUrl(scheduleSheetURL);
    const container = document.getElementById('sheetFrameContainer');
    const fallback = document.getElementById('sheetFrameFallback');
    if (!container) return false;

    const iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.style.width = '100%';
    iframe.style.height = '480px';
    iframe.style.border = '0';
    iframe.loading = 'lazy';

    // If iframe loads, we'll remove the fallback and hide the scheduleTableWrapper
    iframe.addEventListener('load', () => {
      if (fallback) fallback.style.display = 'none';
      const wrapper = document.getElementById('scheduleTableWrapper');
      if (wrapper) wrapper.style.display = 'none';
    });

    // If iframe fails (blocked by CORS/content-security), we'll remove it and return false
    iframe.addEventListener('error', () => {
      iframe.remove();
    });

    container.innerHTML = ''; // clear placeholder
    container.appendChild(iframe);
    return true;
  } catch (e) {
    console.warn('Iframe embed failed:', e);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Prefer iframe embed (keeps original sheet styling). If embed is blocked, try pubhtml, then CSV.
  const iframeOk = await tryEmbedSheetIframe();
  if (!iframeOk) {
    const htmlOk = await loadScheduleHTML();
    if (!htmlOk) await loadSchedule();
  }
});

// Tournament tile toggle: show/hide per-tournament details when a tile is selected
document.addEventListener('DOMContentLoaded', () => {
  const tiles = document.querySelectorAll('.tournament-tile');
  const allDetails = document.querySelectorAll('#tournaments section[id^="tournament-"]');
  function closeAllDetails(exceptId) {
    allDetails.forEach(sec => {
      if (sec.id === exceptId) return;
      sec.classList.remove('open');
      // explicitly hide via inline styles so CSS :target won't accidentally reveal it
      sec.style.display = 'none';
      sec.style.maxHeight = '0';
      sec.style.opacity = '0';
    });
  }

  // One-time cleanup: remove any stale inline styles that could leave a section visible
  allDetails.forEach(sec => {
    // start hidden
    sec.style.display = 'none';
    sec.style.maxHeight = '0';
    sec.style.opacity = '0';
    sec.classList.remove('open');
  });

  tiles.forEach(tile => {
    tile.addEventListener('click', (e) => {
      // allow normal nav when user uses ctrl/cmd or middle-click
      if (e.metaKey || e.ctrlKey || e.button === 1) return;
      e.preventDefault();
      const href = tile.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const targetId = href.substring(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      console.log('Tournament tile clicked:', targetId);
      const isOpen = targetEl.classList.contains('open');
      if (isOpen) {
        // close it
        targetEl.classList.remove('open');
        // ensure it's hidden (clear any residual styles on others via closeAllDetails)
        targetEl.style.display = 'none';
        targetEl.style.maxHeight = '0';
        targetEl.style.opacity = '0';
        // remove the hash without adding a new history entry
        history.replaceState(null, '', window.location.pathname + window.location.search);
        console.log('Closed:', targetId);
      } else {
        // open this one and close others
        closeAllDetails(targetId);
        // clear any inline styles that might block CSS rules
        targetEl.style.display = '';
        targetEl.style.maxHeight = '';
        targetEl.style.opacity = '';
  targetEl.classList.add('open');
  console.log('Opened:', targetId);
        // update the hash so direct links/back button work
        history.pushState(null, '', '#' + targetId);
        // scroll into view a bit so tile remains visible
        setTimeout(() => { targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      }
    });
  });

  // Handle browser back/forward and manual hash changes
  window.addEventListener('hashchange', () => {
    const id = location.hash ? location.hash.substring(1) : '';
    if (!id) {
      // no hash: close all
      closeAllDetails('');
      return;
    }
    // open the matched one and close others
    const el = document.getElementById(id);
    if (el) {
      closeAllDetails(id);
      // clear inline styles before showing
      el.style.display = '';
      el.style.maxHeight = '';
      el.style.opacity = '';
      el.classList.add('open');
      console.log('Hash opened:', id);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // On load: ensure all details are closed first, then open the hash if present
  closeAllDetails('');
  // Do not auto-open a tournament on page load; user must click a tile or navigate (hashchange)
  console.log('Initial hash on load (no auto-open):', location.hash || '(none)');
});

  // Search/filter function
  document.getElementById("searchInput").addEventListener("keyup", function() {
    const filter = this.value.toLowerCase();
    const table = document.getElementById("dataTable");
    const trs = table.querySelectorAll("tbody tr");

    trs.forEach(tr => {
      const text = tr.textContent.toLowerCase();
      tr.style.display = text.includes(filter) ? "" : "none";
    });
  });
//---------------------------------------------------------------------------

// Helper: add data-label attributes to table cells for responsive stacked view
function attachDataLabels(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = Array.from(row.children);
    cells.forEach((cell, i) => {
      const label = headers[i] || '';
      cell.setAttribute('data-label', label);
    });
  });
}

// Run after tables are populated (ensure called once DOMContentLoaded and sheet loads complete)
document.addEventListener('DOMContentLoaded', () => {
  // small delay to allow CSV loaders to populate tables if needed
  setTimeout(() => {
    attachDataLabels('dataTable');
    attachDataLabels('contactTable');
  }, 300);
});


// Navigation -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav a");
  // Only consider top-level page sections (children of main) for show/hide behavior
  const sections = document.querySelectorAll("main > section");

  // Ensure exactly one active section on load (default to #home)
  const anyActive = Array.from(sections).some(s => s.classList.contains("active"));
  if (!anyActive) {
    const home = document.getElementById("home");
    if (home) home.classList.add("active");
  }

  // Attach navigation handlers
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      // If this is the dropdown toggle (Tournaments label), ignore here so
      // hover/click behavior is handled by the dropdown-specific handlers.
      if (link.classList.contains('dropdown-toggle')) return;

      const href = link.getAttribute('href') || '';
      // Only intercept same-page hash links (e.g. "#schedule").
      // Links to other pages (e.g. "tournament-results.html#tournament-1") should be allowed to navigate.
      if (!href.startsWith('#')) return; // allow default navigation

      e.preventDefault(); // prevent default anchor jump
      const target = href.substring(1); // get id without #

      // Hide all sections (class + inline fallback)
      sections.forEach(section => {
        section.classList.remove("active");
        // start fade-out
        section.classList.remove("fade-in");
        section.style.display = "none";
      });

      // If navigating away from the tournaments page, ensure any open per-tournament
      // detail sections are closed and remove any tournament hash from the URL.
      if (target !== 'tournaments') {
        const tourDetails = document.querySelectorAll('#tournaments section[id^="tournament-"]');
        tourDetails.forEach(sec => {
          sec.classList.remove('open');
          sec.style.display = 'none';
          sec.style.maxHeight = '0';
          sec.style.opacity = '0';
        });
        // remove the fragment from the URL without adding history entry
        if (location.hash && location.hash.includes('tournament-')) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      // Update nav aria/current
      navLinks.forEach(n => n.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'page');

      // Close mobile menu if open (improves UX on small screens)
      const navbarEl = document.getElementById('navbar');
      const toggleBtn = document.getElementById('menu-toggle');
      if (navbarEl && navbarEl.classList.contains('show')) {
        navbarEl.classList.remove('show');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      }

      // If the clicked link is inside the tournaments dropdown, close the dropdown
      const dropdownParent = link.closest('.nav-dropdown');
      if (dropdownParent) {
        dropdownParent.classList.remove('open');
        const dt = dropdownParent.querySelector('.dropdown-toggle');
        if (dt) dt.setAttribute('aria-expanded', 'false');
      }

      // Show target section (safely) with fade-in
      const targetSection = document.getElementById(target);
      if (targetSection) {
        targetSection.style.display = "block"; // explicit fallback
        // Ensure any nested sections (e.g. per-tournament anchors) don't remain hidden via stale inline styles
        const nested = targetSection.querySelectorAll('section');
        nested.forEach(n => { n.style.display = ''; n.classList.remove('active'); });
        // force reflow then add class for CSS transition
        void targetSection.offsetWidth;
        targetSection.classList.add("fade-in");
        targetSection.classList.add("active");
      }
    });
  });

  // Menu toggle (mobile)
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  if (menuToggle && navbar) {
    menuToggle.setAttribute('role', 'button');
    menuToggle.setAttribute('aria-controls', 'navbar');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("show");
      menuToggle.setAttribute('aria-expanded', String(!!isOpen));
    });
  }
});

// -------------------------------------------------------------
// Dropdown toggle for Tournaments
document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdownParent = document.querySelector('.nav-dropdown');

  if (dropdownToggle && dropdownParent) {
    // Detect pointer capability; on pointer devices prefer hover behaviour
    const isPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isPointer) {
      // Desktop / pointer: open on hover
      dropdownParent.addEventListener('mouseenter', () => {
        dropdownParent.classList.add('open');
        dropdownToggle.setAttribute('aria-expanded', 'true');
      });
      dropdownParent.addEventListener('mouseleave', () => {
        dropdownParent.classList.remove('open');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      });
    } else {
      // Touch / mobile: keep click-to-toggle
      dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dropdownParent.classList.toggle('open');
        dropdownToggle.setAttribute('aria-expanded', String(!!isOpen));
      });

      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (!dropdownParent.contains(e.target)) {
          dropdownParent.classList.remove('open');
          dropdownToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
});

// Tournament select bar behavior
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('tournamentSelect');
  const goBtn = document.getElementById('tournamentGo');
  if (!select || !goBtn) return;

  function navigateToSelected() {
    const val = select.value || '';
    if (!val) return;
    // Avoid changing location.hash directly (browser will auto-scroll).
    // Use history.pushState to update URL without causing a scroll, then
    // programmatically open the target section without calling scrollIntoView.
    const id = val.startsWith('#') ? val.substring(1) : val;
    try {
      history.pushState(null, '', '#' + id);
    } catch (e) {
      // fallback if pushState not allowed
      location.hash = '#' + id;
    }

    // Open the selected tournament section without scrolling.
    const allDetails = document.querySelectorAll('#tournaments section[id^="tournament-"]');
    allDetails.forEach(sec => {
      if (sec.id === id) return;
      sec.classList.remove('open');
      sec.style.display = 'none';
      sec.style.maxHeight = '0';
      sec.style.opacity = '0';
    });

    const targetEl = document.getElementById(id);
    if (targetEl) {
      // Clear inline hiding styles so CSS can reveal it
      targetEl.style.display = '';
      targetEl.style.maxHeight = '';
      targetEl.style.opacity = '';
      targetEl.classList.add('open');
      // Intentionally do NOT call scrollIntoView — keeps the viewport position stable
    }
  }

  goBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToSelected();
  });

  // allow Enter key to trigger navigation when focused on the select
  select.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateToSelected();
    }
  });
});