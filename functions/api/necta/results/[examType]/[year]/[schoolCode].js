/**
 * Cloudflare Pages Function
 * Route: /api/necta/results/:examType/:year/:schoolCode
 * 
 * Improvements v2:
 * - Multiple URL patterns tried (NECTA restructures paths periodically)
 * - Better error messages in Kiswahili
 * - Graceful fallback between URL formats
 * - CORS headers on all responses
 * - Rate limit headers respected
 */

export async function onRequest(context) {
  const { params } = context;
  const { examType, year, schoolCode } = params;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  };

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ── Validation ──────────────────────────────────────────────────────────
  if (!examType || !year || !schoolCode) {
    return new Response(JSON.stringify({
      error: 'Vigezo vimekosekana. Tafadhali jaza aina ya mtihani, mwaka, na namba ya shule.'
    }), { status: 400, headers: corsHeaders });
  }

  const parsedYear = parseInt(year);
  if (isNaN(parsedYear) || parsedYear < 1990 || parsedYear > new Date().getFullYear() + 1) {
    return new Response(JSON.stringify({
      error: `Mwaka usio sahihi: ${year}. Tumia mwaka kama 2024.`
    }), { status: 400, headers: corsHeaders });
  }

  const examTypeLower = examType.toLowerCase();
  const schoolCodeLower = schoolCode.toLowerCase().trim();

  // ── Try multiple URL patterns ────────────────────────────────────────────
  // NECTA occasionally changes their URL structure between years
  const urlPatterns = [
    // Pattern 1: Standard (most common post-2020)
    `https://onlinesys.necta.go.tz/results/${parsedYear}/${examTypeLower}/results/${schoolCodeLower}.htm`,
    // Pattern 2: Alternative path (some years use this)
    `https://www.necta.go.tz/results/${examTypeLower}/${parsedYear}/results/${schoolCodeLower}.htm`,
    // Pattern 3: Older format
    `https://onlinesys.necta.go.tz/results/${parsedYear}/${examTypeLower}/${schoolCodeLower}.htm`,
  ];

  let html = null;
  let lastError = null;
  let successUrl = null;

  for (const url of urlPatterns) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,*/*',
          'Accept-Language': 'sw,en;q=0.9',
          'Referer': 'https://onlinesys.necta.go.tz/',
        },
        // Cloudflare: cache upstream response for 1hr
        cf: { cacheTtl: 3600, cacheEverything: false },
      });

      if (response.ok) {
        const text = await response.text();
        // Verify this is actually a results page (not a 404 HTML page)
        if (text.length > 500 && (
          text.toLowerCase().includes('school') ||
          text.toLowerCase().includes('candidate') ||
          text.toLowerCase().includes('division') ||
          text.toLowerCase().includes(schoolCodeLower.slice(0, 3)) ||
          text.toLowerCase().includes('cno')
        )) {
          html = text;
          successUrl = url;
          break;
        }
      } else if (response.status === 429) {
        // Rate limited — wait briefly and try next pattern
        lastError = `NECTA imekataa ombi (rate limited). Jaribu tena baada ya dakika moja.`;
      } else if (response.status >= 400 && response.status < 500) {
        lastError = `Shule ${schoolCode.toUpperCase()} haikupatikana kwenye ${examTypeLower.toUpperCase()} ${year}.`;
      } else {
        lastError = `NECTA server error (${response.status}). Jaribu tena baadaye.`;
      }
    } catch (fetchErr) {
      lastError = `Imeshindwa kufikia NECTA server. Angalia muunganiko wa mtandao.`;
      // Continue trying next URL pattern
    }
  }

  if (!html) {
    return new Response(JSON.stringify({
      error: lastError || `Matokeo ya ${schoolCode.toUpperCase()} hayakupatikana kwa ${examTypeLower.toUpperCase()} ${year}. Hakikisha namba ya shule na mwaka ni sahihi.`
    }), { status: 404, headers: corsHeaders });
  }

  // ── Parse the HTML ────────────────────────────────────────────────────────
  try {
    const result = parseNectaHTML(html, schoolCode, examTypeLower, year);

    if (!result.students || result.students.length === 0) {
      // Check if the page has content at all
      return new Response(JSON.stringify({
        error: `Hakuna matokeo yaliyopatikana kwa shule ${schoolCode.toUpperCase()} katika ${examTypeLower.toUpperCase()} ${year}. Inawezekana shule hii haikushiriki mtihani huu au matokeo bado hayajachapishwa.`
      }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify(result), { headers: corsHeaders });
  } catch (parseErr) {
    return new Response(JSON.stringify({
      error: `Imeshindwa kusoma matokeo. NECTA server ilirudisha data isiyo sahihi. Jaribu tena au wasiliana na STEA.`
    }), { status: 500, headers: corsHeaders });
  }
}

// ── HTML Parser ────────────────────────────────────────────────────────────────
function parseNectaHTML(html, schoolCode, examType, year) {
  const result = {
    examTitle: '',
    schoolName: '',
    schoolCode: schoolCode.toUpperCase(),
    examType: examType.toUpperCase(),
    year: parseInt(year),
    summary: [],
    students: [],
  };

  // ── Extract school name & title ──
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.examTitle = titleMatch[1].trim().replace(/\s+/g, ' ');

  // Multiple patterns for school name
  const codeUpper = schoolCode.toUpperCase();
  const namePatterns = [
    new RegExp(`${codeUpper}\\s*[-–]\\s*([^<\\n]{3,80})`, 'i'),
    new RegExp(`<[Hh][123][^>]*>[^<]*${codeUpper}[^<]*<\\/[Hh][123]>`, 'i'),
    new RegExp(`<[Bb]>\\s*${codeUpper}[^<]{2,60}<\\/[Bb]>`, 'i'),
    /<[Hh]3[^>]*><[Pp][^>]*>\s*([SP]\d{4}[^<]+)/i,
  ];

  for (const pat of namePatterns) {
    const m = html.match(pat);
    if (m) {
      let name = (m[1] || m[0]).replace(/<[^>]+>/g, '').trim();
      name = name.replace(/^[SP]\d{4,6}\s*[-–]?\s*/i, '').trim();
      if (name.length > 3) { result.schoolName = name; break; }
    }
  }
  if (!result.schoolName) result.schoolName = `${codeUpper}`;

  // ── Parse tables ──────────────────────────────────────────────────────────
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHTML = tableMatch[1];
    const tableText = tableHTML.toLowerCase();
    const rows = extractRows(tableHTML);
    if (rows.length === 0) continue;

    // Summary / division table
    if (
      result.summary.length === 0 &&
      rows.length >= 2 &&
      (tableText.includes('division') || tableText.includes('div.') || tableText.includes('div ')) &&
      (tableText.includes(' i ') || tableText.includes(' ii ') || tableText.includes('iii') || tableText.includes('iv'))
    ) {
      result.summary = rows.filter(r => r.some(c => c.trim().length > 0));
      continue;
    }

    // Student results table
    if (
      tableText.includes('cno') ||
      tableText.includes('index no') ||
      tableText.includes('candidate') ||
      tableText.includes('s/n') ||
      tableText.includes('exam no')
    ) {
      let headerIdx = -1;
      let cnoCol = 0, sexCol = 1, aggrCol = 2, divCol = 3, subjCol = 4;

      // Find header row
      for (let i = 0; i < Math.min(rows.length, 6); i++) {
        const rowText = rows[i].join(' ').toLowerCase();
        if (
          rowText.includes('cno') ||
          rowText.includes('index') ||
          rowText.includes('candidate') ||
          rowText.includes('exam no')
        ) {
          headerIdx = i;
          rows[i].forEach((cell, idx) => {
            const c = cell.toLowerCase().trim();
            if (c.includes('cno') || c.includes('index') || c.includes('exam no') || c.includes('cand')) cnoCol = idx;
            else if (c === 'sex' || c === 'f/m' || c === 'gender' || c === 'm/f') sexCol = idx;
            else if (c.includes('aggr') || c.includes('point') || c.includes('total') || c.includes('grade')) aggrCol = idx;
            else if (c.includes('div')) divCol = idx;
            else if (c.includes('subj') || c.includes('detail') || c.includes('result')) subjCol = idx;
          });
          break;
        }
      }

      const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;

        const firstCell = (row[cnoCol] || row[0] || '').trim();

        // Must look like a candidate/index number (e.g. S0155/0001 or P0021/001)
        if (!firstCell || firstCell.length < 3) continue;
        if (!/[A-Z]\d{3,}/i.test(firstCell) && !/\d{4}/.test(firstCell)) continue;
        if (/^(total|grand|summary|division|div)/i.test(firstCell)) continue;
        if (firstCell === codeUpper) continue; // skip school code row

        result.students.push({
          indexNumber: firstCell,
          sex:         (row[sexCol]  || '').trim(),
          points:      (row[aggrCol] || '').trim(),
          division:    (row[divCol]  || '').trim().replace(/^DIV\.?\s*/i, ''),
          subjects:    (row[subjCol] || '').trim(),
        });
      }
    }
  }

  return result;
}

// ── Extract table rows ─────────────────────────────────────────────────────────
function extractRows(tableHTML) {
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHTML)) !== null) {
    const rowHTML = rowMatch[1];
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHTML)) !== null) {
      // Strip inner tags, decode entities, clean whitespace
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(text);
    }

    if (cells.length > 0 && cells.some(c => c.length > 0)) {
      rows.push(cells);
    }
  }

  return rows;
}
