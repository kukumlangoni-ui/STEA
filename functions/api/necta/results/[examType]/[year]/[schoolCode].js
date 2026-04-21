/**
 * Cloudflare Pages Function — NECTA Results Lookup v4
 * Route: /api/necta/results/:examType/:year/:schoolCode
 *
 * Fixed bugs vs v3:
 *  - resolveHref now uses proper URL-join (base+relative) instead of stripping path
 *  - Year validation no longer blocks current year when results exist
 *  - 404 from NECTA → "results not published" not "school not found"
 *  - Audit trail via console.log visible in CF dashboard
 *
 * Architecture:
 *  Step 1: Direct URL:  /results/{year}/{exam}/results/{code}.htm
 *  Step 2: Index scrape: /results/{year}/{exam}/index.htm → find link → fetch
 *  Step 3: Parse HTML → structured JSON
 */

const NECTA_BASE = 'https://onlinesys.necta.go.tz';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
};

// Known NECTA exam path identifiers
const EXAM_PATHS = {
  csee: 'csee', acsee: 'acsee', psle: 'psle', ftna: 'ftna',
  // common aliases
  form4: 'csee', form6: 'acsee', std7: 'psle', form2: 'ftna',
};

// ── normalizeSchoolCodeForNecta ──────────────────────────────────────────────
// NECTA URLs use lowercase codes: s0021 not S0021
function normalizeSchoolCodeForNecta(code) {
  if (!code) return '';
  return code.trim().toLowerCase().replace(/\s+/g, '');
}

// ── resolveHref ──────────────────────────────────────────────────────────────
// Correctly resolve a relative href against a base URL
// e.g. href="results/s0021.htm" + base="https://necta.../results/2024/csee/index.htm"
//   → "https://necta.../results/2024/csee/results/s0021.htm"
function resolveHref(href, baseUrl) {
  if (!href) return null;
  href = href.trim();

  // Already absolute
  if (href.startsWith('http://') || href.startsWith('https://')) return href;

  // Root-relative: /results/...
  if (href.startsWith('/')) return `${NECTA_BASE}${href}`;

  // Relative: resolve against the directory of baseUrl
  // baseUrl = "https://host/path/to/index.htm"
  // base dir = "https://host/path/to/"
  const baseDir = baseUrl.replace(/\/[^/]*$/, '/');   // strip filename, keep trailing slash
  // Handle ../ traversal
  let parts = (baseDir + href).split('/');
  const resolved = [];
  for (const p of parts) {
    if (p === '..') resolved.pop();
    else if (p !== '.') resolved.push(p);
  }
  return resolved.join('/');
}

// ── isValidResultsPage ───────────────────────────────────────────────────────
function isValidResultsPage(html, codeHint) {
  if (!html || html.length < 400) return false;
  const lower = html.toLowerCase();
  // NECTA results pages always contain these words
  return (
    lower.includes('candidate') ||
    lower.includes('division') ||
    lower.includes('cno') ||
    (codeHint && lower.includes(codeHint.slice(0, 3)))
  );
}

// ── fetch with timeout ────────────────────────────────────────────────────────
async function fetchWithTimeout(url, ms = 18000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept': 'text/html,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${NECTA_BASE}/`,
      },
      cf: { cacheTtl: 7200 },
    });
    clearTimeout(timer);
    return r;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── findSchoolInIndex ────────────────────────────────────────────────────────
// Scrapes index.htm and returns the best matching href for a school
function findSchoolInIndex(indexHtml, codeLower, codeUpper, schoolName) {
  const results = { href: null, foundText: null, strategies: [] };

  // Extract all <a href="*.htm"> links
  const linkRx = /<a[^>]+href=["']([^"']+\.htm)["'][^>]*>([^<]*)<\/a>/gi;
  const links = [];
  let m;
  while ((m = linkRx.exec(indexHtml)) !== null) {
    links.push({ href: m[1].trim(), text: m[2].trim() });
  }
  results.totalLinks = links.length;

  // Strategy 1: exact school code in href path
  for (const { href, text } of links) {
    if (href.toLowerCase().includes(`/${codeLower}.htm`) ||
        href.toLowerCase().includes(`/${codeLower}`) ||
        href.toLowerCase().endsWith(codeLower + '.htm')) {
      results.href = href;
      results.foundText = text;
      results.strategies.push('code-in-href');
      return results;
    }
  }

  // Strategy 2: school code appears in link text
  for (const { href, text } of links) {
    if (text.toUpperCase().includes(codeUpper)) {
      results.href = href;
      results.foundText = text;
      results.strategies.push('code-in-text');
      return results;
    }
  }

  // Strategy 3: normalize school name, match words
  if (schoolName && schoolName.trim()) {
    const words = schoolName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    let best = null, bestScore = 0;
    for (const { href, text } of links) {
      const textN = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      const score = words.filter(w => textN.includes(w)).length;
      if (score > bestScore && score >= Math.min(2, words.length)) {
        bestScore = score;
        best = { href, text };
      }
    }
    if (best) {
      results.href = best.href;
      results.foundText = best.text;
      results.strategies.push(`name-words(score=${bestScore})`);
      return results;
    }
  }

  results.strategies.push('no-match');
  return results;
}

// ── parseNectaHTML ───────────────────────────────────────────────────────────
function parseNectaHTML(html, rawCode, examType, year) {
  const codeUpper = rawCode.trim().toUpperCase();
  const result = {
    examTitle: '',
    schoolName: codeUpper,
    schoolCode: codeUpper,
    examType: examType.toUpperCase(),
    year: parseInt(year),
    summary: [],
    students: [],
  };

  // Page title
  const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleM) result.examTitle = titleM[1].trim().replace(/\s+/g, ' ');

  // School name — multiple patterns
  const namePatterns = [
    new RegExp(String.raw`${codeUpper}\s*[-–:]\s*([^\n<]{4,90})`, 'i'),
    new RegExp(String.raw`<[Pp][^>]*>\s*${codeUpper}[^<]{3,80}`, 'i'),
    new RegExp(String.raw`<[Bb][^>]*>\s*${codeUpper}[^<]{3,60}</[Bb]>`, 'i'),
    /<[Hh][123][^>]*>([^<]{10,80})<\/[Hh][123]>/i,
  ];
  for (const pat of namePatterns) {
    const nm = html.match(pat);
    if (nm) {
      let name = nm[1] || nm[0];
      name = name.replace(/<[^>]+>/g, '').trim();
      name = name.replace(new RegExp(String.raw`^${codeUpper}\s*[-–:]\s*`, 'i'), '').trim();
      if (name.length > 3 && !/^(the|a|an)$/i.test(name)) {
        result.schoolName = name;
        break;
      }
    }
  }

  // Parse tables
  const tableRx = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tblM;
  while ((tblM = tableRx.exec(html)) !== null) {
    const tHTML = tblM[1];
    const tLow = tHTML.toLowerCase();
    const rows = extractRows(tHTML);
    if (!rows.length) continue;

    // Summary / division table
    if (!result.summary.length && rows.length >= 2 &&
        (tLow.includes('division') || tLow.includes('div.')) &&
        (tLow.includes(' i ') || tLow.includes(' ii ') || tLow.includes('iii'))) {
      result.summary = rows.filter(r => r.some(c => c.length > 0));
      continue;
    }

    // Candidates table
    if (tLow.includes('cno') || tLow.includes('index no') ||
        tLow.includes('candidate') || tLow.includes('exam no')) {
      let hdrIdx = -1;
      let cnoCol = 0, sexCol = 1, aggrCol = 2, divCol = 3, subjCol = 4;

      for (let i = 0; i < Math.min(rows.length, 6); i++) {
        const rt = rows[i].join(' ').toLowerCase();
        if (rt.includes('cno') || rt.includes('index') ||
            rt.includes('candidate') || rt.includes('exam no')) {
          hdrIdx = i;
          rows[i].forEach((cell, idx) => {
            const c = cell.toLowerCase().trim();
            if (c === 'cno' || c.includes('index') || c.includes('cand')) cnoCol = idx;
            else if (c === 'sex' || c === 'f/m' || c === 'gender') sexCol = idx;
            else if (c.includes('aggr') || c.includes('point') || c.includes('total')) aggrCol = idx;
            else if (c.includes('div')) divCol = idx;
            else if (c.includes('subj') || c.includes('detail') || c.includes('result')) subjCol = idx;
          });
          break;
        }
      }

      const start = hdrIdx >= 0 ? hdrIdx + 1 : 0;
      for (let i = start; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;
        const first = (row[cnoCol] || row[0] || '').trim();
        if (!first || first.length < 3) continue;
        if (!/[A-Z]\d{3,}/i.test(first) && !/\d{4}/.test(first)) continue;
        if (/^(total|grand|summary|division|div)/i.test(first)) continue;
        if (first.toUpperCase() === codeUpper) continue;
        result.students.push({
          indexNumber: first,
          sex: (row[sexCol] || '').trim(),
          points: (row[aggrCol] || '').trim(),
          division: (row[divCol] || '').trim().replace(/^DIV\.?\s*/i, ''),
          subjects: (row[subjCol] || '').trim(),
        });
      }
    }
  }

  return result;
}

function extractRows(tableHTML) {
  const rows = [];
  const rowRx = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rM;
  while ((rM = rowRx.exec(tableHTML)) !== null) {
    const cells = [];
    const cellRx = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cM;
    while ((cM = cellRx.exec(rM[1])) !== null) {
      cells.push(
        cM[1].replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
          .replace(/\s+/g, ' ').trim()
      );
    }
    if (cells.length && cells.some(c => c.length)) rows.push(cells);
  }
  return rows;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ════════════════════════════════════════════════════════════════════════════
export async function onRequest(context) {
  const { params, request } = context;
  const { examType, year, schoolCode } = params;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*',
                 'Access-Control-Allow-Methods': 'GET, OPTIONS',
                 'Access-Control-Max-Age': '86400' }
    });
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  const log = (tag, obj) =>
    console.log(`[NECTA v4] ${tag} :: ${JSON.stringify(obj)}`);

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!examType || !year || !schoolCode) {
    return new Response(JSON.stringify({
      error: 'Vigezo vimekosekana. Jaza aina ya mtihani, mwaka, na namba ya shule.',
      errorCode: 'MISSING_PARAMS',
    }), { status: 400, headers: CORS });
  }

  const parsedYear = parseInt(year);
  if (isNaN(parsedYear) || parsedYear < 1988 || parsedYear > 2100) {
    return new Response(JSON.stringify({
      error: `Mwaka si sahihi: "${year}". Tumia mwaka kama 2024.`,
      errorCode: 'INVALID_YEAR',
    }), { status: 400, headers: CORS });
  }

  const examPath = EXAM_PATHS[examType.toLowerCase()] || examType.toLowerCase();
  const codeLower = normalizeSchoolCodeForNecta(schoolCode); // e.g. "s0021"
  const codeUpper = schoolCode.trim().toUpperCase();        // e.g. "S0021"
  const schoolName = new URL(request.url).searchParams.get('name') || '';

  log('REQUEST', { examType: examPath, year: parsedYear, code: codeLower, name: schoolName });

  // ── Step 1: Direct page ────────────────────────────────────────────────────
  const directUrl = `${NECTA_BASE}/results/${parsedYear}/${examPath}/results/${codeLower}.htm`;
  log('STEP1_DIRECT', { url: directUrl });

  let html = null;
  let sourceUrl = null;

  try {
    const r1 = await fetchWithTimeout(directUrl);
    log('STEP1_STATUS', { status: r1.status });

    if (r1.ok) {
      const text = await r1.text();
      if (isValidResultsPage(text, codeLower)) {
        html = text;
        sourceUrl = directUrl;
        log('STEP1_SUCCESS', { htmlLen: html.length });
      } else {
        log('STEP1_INVALID', { htmlLen: text.length, preview: text.slice(0, 150) });
      }
    } else {
      log('STEP1_HTTP_ERROR', { status: r1.status });
    }
  } catch (e) {
    const isTimeout = e.name === 'AbortError';
    log('STEP1_EXCEPTION', { error: e.message, isTimeout });
    if (isTimeout) {
      return new Response(JSON.stringify({
        error: 'NECTA server imechukua muda mrefu kujibu. Jaribu tena baadaye.',
        errorCode: 'TIMEOUT',
      }), { status: 503, headers: CORS });
    }
  }

  // ── Step 2: Index page fallback ────────────────────────────────────────────
  if (!html) {
    const indexUrl = `${NECTA_BASE}/results/${parsedYear}/${examPath}/index.htm`;
    log('STEP2_INDEX', { url: indexUrl });

    let indexHtml = null;
    let indexStatus = null;

    try {
      const r2 = await fetchWithTimeout(indexUrl);
      indexStatus = r2.status;
      log('STEP2_INDEX_STATUS', { status: indexStatus });

      if (r2.ok) {
        indexHtml = await r2.text();
        log('STEP2_INDEX_FETCHED', { htmlLen: indexHtml.length });
      } else if (r2.status === 404) {
        // Index page itself not found → results not published for this year/exam
        log('STEP2_INDEX_404', { year: parsedYear, exam: examPath });
        return new Response(JSON.stringify({
          error: `Matokeo ya ${examPath.toUpperCase()} ${parsedYear} bado hayajachapishwa kwenye NECTA, au mwaka huu hauna matokeo. Jaribu mwaka uliopita.`,
          errorCode: 'YEAR_NOT_PUBLISHED',
          directUrl,
          indexUrl,
        }), { status: 404, headers: CORS });
      } else {
        log('STEP2_INDEX_HTTP_ERROR', { status: r2.status });
        return new Response(JSON.stringify({
          error: `NECTA haipatikani kwa muda huu (HTTP ${r2.status}). Jaribu tena baadaye.`,
          errorCode: 'SOURCE_UNAVAILABLE',
        }), { status: 503, headers: CORS });
      }
    } catch (e) {
      const isTimeout = e.name === 'AbortError';
      log('STEP2_EXCEPTION', { error: e.message, isTimeout });
      return new Response(JSON.stringify({
        error: isTimeout
          ? 'NECTA server haikujibu (timeout). Jaribu tena baadaye.'
          : `Hitilafu ya mtandao: ${e.message}`,
        errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      }), { status: 503, headers: CORS });
    }

    // Scrape index to find this school's link
    if (indexHtml) {
      const found = findSchoolInIndex(indexHtml, codeLower, codeUpper, schoolName);
      log('STEP2_SEARCH', { code: codeLower, name: schoolName, found });

      if (!found.href) {
        // School code genuinely not in this year's index → honest message
        return new Response(JSON.stringify({
          error: `Shule ${codeUpper} haijaonekana kwenye orodha ya NECTA ya ${examPath.toUpperCase()} ${parsedYear}. Inawezekana shule hii haikushiriki mtihani huu mwaka huu.`,
          errorCode: 'NOT_IN_INDEX',
          directUrl,
          indexUrl,
          indexSearched: true,
          linksScanned: found.totalLinks,
        }), { status: 404, headers: CORS });
      }

      // Resolve the relative href correctly against the index URL
      const schoolPageUrl = resolveHref(found.href, indexUrl);
      log('STEP2_RESOLVED_URL', { raw: found.href, resolved: schoolPageUrl });

      try {
        const r3 = await fetchWithTimeout(schoolPageUrl);
        log('STEP2_SCHOOL_PAGE_STATUS', { status: r3.status, url: schoolPageUrl });

        if (r3.ok) {
          const text = await r3.text();
          if (isValidResultsPage(text, codeLower)) {
            html = text;
            sourceUrl = schoolPageUrl;
            log('STEP2_SUCCESS', { htmlLen: html.length });
          } else {
            log('STEP2_INVALID_PAGE', { htmlLen: text.length });
            return new Response(JSON.stringify({
              error: `Tumepata shule ${codeUpper} kwenye orodha ya NECTA, lakini ukurasa wa matokeo hauna data inayotarajiwa.`,
              errorCode: 'PARSE_EMPTY',
              schoolPageUrl,
            }), { status: 200, headers: CORS });
          }
        } else {
          return new Response(JSON.stringify({
            error: `Tumepata shule ${codeUpper} kwenye orodha ya NECTA, lakini matokeo yake hayajapatikana (HTTP ${r3.status}).`,
            errorCode: 'RESULTS_NOT_FOUND',
            schoolPageUrl,
          }), { status: 404, headers: CORS });
        }
      } catch (e) {
        return new Response(JSON.stringify({
          error: 'Imeshindwa kupakia ukurasa wa matokeo ya shule. Jaribu tena.',
          errorCode: 'NETWORK_ERROR',
        }), { status: 503, headers: CORS });
      }
    }
  }

  // Both steps failed with no html
  if (!html) {
    return new Response(JSON.stringify({
      error: `Imeshindwa kupata matokeo ya ${codeUpper} kwa ${examPath.toUpperCase()} ${parsedYear}. Hakikisha namba ya shule na mwaka ni sahihi.`,
      errorCode: 'RESULTS_NOT_FOUND',
      directUrl,
    }), { status: 404, headers: CORS });
  }

  // ── Step 3: Parse ──────────────────────────────────────────────────────────
  try {
    const result = parseNectaHTML(html, schoolCode, examPath, parsedYear.toString());
    log('PARSE', { schoolName: result.schoolName, students: result.students.length });

    if (!result.students.length) {
      return new Response(JSON.stringify({
        ...result,
        error: `Matokeo ya ${codeUpper} yamepatikana lakini hayana orodha ya wanafunzi. NECTA inaweza kuwa imebadilisha muundo.`,
        errorCode: 'PARSE_EMPTY',
        _sourceUrl: sourceUrl,
      }), { status: 200, headers: CORS });
    }

    result._sourceUrl = sourceUrl;
    return new Response(JSON.stringify(result), { headers: CORS });

  } catch (e) {
    log('PARSE_ERROR', { error: e.message });
    return new Response(JSON.stringify({
      error: 'Imeshindwa kusoma matokeo ya NECTA. Wasiliana na STEA.',
      errorCode: 'PARSE_ERROR',
    }), { status: 500, headers: CORS });
  }
}
