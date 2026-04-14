// Cloudflare Pages Function: /api/necta/results/[examType]/[year]/[schoolCode]
export async function onRequest(context) {
  const { params } = context;
  const { examType, year, schoolCode } = params;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!examType || !year || !schoolCode) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400, headers: corsHeaders
    });
  }

  const url = `https://onlinesys.necta.go.tz/results/${year}/${examType.toLowerCase()}/results/${schoolCode.toLowerCase()}.htm`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Matokeo hayajapatikana. NECTA ilirudisha: ${response.status}. Hakikisha mwaka na namba ya shule ni sahihi.`
      }), { status: 404, headers: corsHeaders });
    }

    const html = await response.text();
    const result = parseNectaHTML(html, schoolCode);

    if (!result.students || result.students.length === 0) {
      return new Response(JSON.stringify({
        error: 'Hakuna matokeo yaliyopatikana kwa shule hii katika mwaka huu.'
      }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify(result), { headers: corsHeaders });
  } catch (err) {
    console.error('Error fetching results:', err);
    return new Response(JSON.stringify({
      error: 'Imeshindwa kupata matokeo kutoka NECTA. Jaribu tena baadaye.'
    }), { status: 500, headers: corsHeaders });
  }
}

function parseNectaHTML(html, schoolCode) {
  const result = {
    examTitle: '',
    schoolName: '',
    schoolCode: schoolCode.toUpperCase(),
    summary: [],
    students: []
  };

  // Extract title/school name from page
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.examTitle = titleMatch[1].trim();

  // Extract school name from bold/header text containing the school code
  const codeUpper = schoolCode.toUpperCase();
  const nameRegex = new RegExp(`${codeUpper}[^<]{2,60}`, 'i');
  const nameMatch = html.match(nameRegex);
  if (nameMatch) result.schoolName = nameMatch[0].trim();
  if (!result.schoolName) result.schoolName = `Shule Namba: ${codeUpper}`;

  // Parse tables
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHTML = tableMatch[1];
    const tableText = tableHTML.toLowerCase();

    const rows = extractRows(tableHTML);
    if (rows.length === 0) continue;

    // Summary table (division breakdown)
    if ((tableText.includes('division') || tableText.includes('div.')) && 
        (tableText.includes(' i ') || tableText.includes(' ii ') || tableText.includes('iii'))) {
      if (rows.length > 1 && result.summary.length === 0) {
        result.summary = rows;
      }
      continue;
    }

    // Student results table
    if (tableText.includes('cno') || tableText.includes('index no') || 
        tableText.includes('candidate') || tableText.includes('s/n')) {
      
      let headerRow = -1;
      let cnoIdx = 0, sexIdx = 1, aggrIdx = 2, divIdx = 3, subjIdx = 4;

      // Find header row
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const rowText = rows[i].join(' ').toLowerCase();
        if (rowText.includes('cno') || rowText.includes('index') || rowText.includes('candidate')) {
          headerRow = i;
          rows[i].forEach((cell, idx) => {
            const c = cell.toLowerCase();
            if (c.includes('cno') || c.includes('index') || c.includes('cand')) cnoIdx = idx;
            else if (c === 'sex' || c === 'f/m' || c === 'gender') sexIdx = idx;
            else if (c.includes('aggr') || c.includes('point') || c.includes('total')) aggrIdx = idx;
            else if (c.includes('div')) divIdx = idx;
            else if (c.includes('subj') || c.includes('detail') || c.includes('subject')) subjIdx = idx;
          });
          break;
        }
      }

      const startRow = headerRow >= 0 ? headerRow + 1 : 0;

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;
        const firstCell = row[0] || '';
        // Must look like a candidate number
        if (!/[A-Z0-9]{3,}/i.test(firstCell) && !/\d{4}/.test(firstCell)) continue;
        if (firstCell.toLowerCase().includes('total') || firstCell.toLowerCase().includes('grand')) continue;

        result.students.push({
          indexNumber: row[cnoIdx] || firstCell,
          sex: row[sexIdx] || '',
          points: row[aggrIdx] || '',
          division: row[divIdx] || '',
          subjects: row[subjIdx] || ''
        });
      }
    }
  }

  return result;
}

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
      // Strip inner HTML tags and clean whitespace
      const text = cellMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      cells.push(text);
    }

    if (cells.length > 0) rows.push(cells);
  }

  return rows;
}
