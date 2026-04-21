// Cloudflare Pages Function: /api/necta/schools
export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const query = (searchParams.get('query') || '').trim();
  const examType = searchParams.get('examType') || 'CSEE';
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  if (!examType || !year) {
    return new Response(JSON.stringify({ error: 'Exam type and year are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const schools = [];
    const isCode = /^[SP]\d{4}$/i.test(query);

    if (isCode) {
      // Direct fetch for school code
      const code = query.toLowerCase();
      const schoolUrl = `https://onlinesys.necta.go.tz/results/${year}/${examType.toLowerCase()}/results/${code}.htm`;
      const response = await fetch(schoolUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' } });
      
      if (response.ok) {
        const html = await response.text();
        const nameMatch = html.match(/<H3>[^<]*<P[^>]*>\s*([SP]\d{4}[^<]+)/i);
        if (nameMatch) {
          const fullName = nameMatch[1].trim();
          const cleanName = fullName.replace(/^[SP]\d{4}\s*-?\s*/i, '').trim();
          schools.push({ code: code.toUpperCase(), name: cleanName || code.toUpperCase(), href: `results/${code}.htm` });
        } else {
          schools.push({ code: code.toUpperCase(), name: code.toUpperCase(), href: `results/${code}.htm` });
        }
      }
    } else if (query.length > 0) {
      // Fetch specific letter index
      const firstLetter = query.charAt(0).toLowerCase();
      if (/[a-z]/.test(firstLetter)) {
        const indexUrl = `https://onlinesys.necta.go.tz/results/${year}/${examType.toLowerCase()}/indexfiles/index_${firstLetter}.htm`;
        const response = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' } });
        
        if (response.ok) {
          const html = await response.text();
          schools.push(...parseSchoolsFromHTML(html, query));
        } else {
          // Fallback to main index.htm if indexfiles/index_X.htm doesn't exist (older years)
          const mainUrl = `https://onlinesys.necta.go.tz/results/${year}/${examType.toLowerCase()}/index.htm`;
          const mainRes = await fetch(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' } });
          if (mainRes.ok) {
            const mainHtml = await mainRes.text();
            schools.push(...parseSchoolsFromHTML(mainHtml, query));
          }
        }
      }
    }

    return new Response(JSON.stringify(schools), { headers: corsHeaders });
  } catch (err) {
    console.error('Error fetching schools:', err);
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }
}

function parseSchoolsFromHTML(html, query) {
  const schools = [];
  const seen = new Set();
  const q = query.toLowerCase().replace(/[-_]/g, ' ').trim();

  // Match links like <a href="results/s0155.htm">S0155 TABORA BOYS</a>
  // Also handle <A HREF="...">
  const linkRegex = /<a[^>]+href=["']([^"']*\.htm)["'][^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].trim();

    // Extract school code (S#### or P####)
    const codeMatch = text.match(/([SP]\d{4})/i) || href.match(/([sp]\d{4})/i);
    if (!codeMatch) continue;

    const code = codeMatch[1].toUpperCase();
    if (seen.has(code)) continue;

    const name = text.replace(code, '').replace(/[-_]/g, ' ').trim();
    if (!name && !code) continue;

    const searchTarget = `${code} ${name}`.toLowerCase();
    
    if (!q || searchTarget.includes(q)) {
      schools.push({ code, name: name || code, href });
      seen.add(code);
    }

    if (schools.length >= 100) break;
  }

  return schools;
}
