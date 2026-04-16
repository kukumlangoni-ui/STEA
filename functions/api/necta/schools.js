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

    const eTypeLower = examType.toLowerCase();
    const eTypeUpper = examType.toUpperCase();

    if (isCode) {
      // Direct fetch for school code
      const code = query.toLowerCase();
      const codeUpper = query.toUpperCase();
      
      const urlsToTry = [
        `https://onlinesys.necta.go.tz/results/${year}/${eTypeLower}/results/${code}.htm`,
        `https://onlinesys.necta.go.tz/results/${year}/${eTypeLower}/results/${codeUpper}.htm`,
        `https://matokeo.necta.go.tz/${eTypeLower}${year}/results/${code}.htm`,
        `https://matokeo.necta.go.tz/${eTypeLower}${year}/results/${codeUpper}.htm`,
        `https://matokeo.necta.go.tz/results/${year}/${eTypeLower}/results/${code}.htm`,
        `https://maktaba.tetea.org/exam-results/${eTypeUpper}${year}/${code}.htm`,
        `https://maktaba.tetea.org/exam-results/${eTypeUpper}${year}/${codeUpper}.htm`,
        `https://maktaba.tetea.org/exam-results/${eTypeUpper}${year}/results/${code}.htm`,
        `https://maktaba.tetea.org/exam-results/${eTypeUpper}${year}/results/${codeUpper}.htm`,
        `https://necta.go.tz/results/${year}/${eTypeLower}/results/${code}.htm`,
        `https://onlinesys.necta.go.tz/results/${year}/${eTypeLower}/${code}.htm`,
        `https://matokeo.necta.go.tz/${eTypeLower}${year}/${code}.htm`
      ];

      let response = null;
      for (const url of urlsToTry) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' } });
          if (res.ok) {
            response = res;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (response) {
        const html = await response.text();
        const nameMatch = html.match(/<H3>[^<]*<P[^>]*>\s*([SP]\d{4}[^<]+)/i) || html.match(new RegExp(`${codeUpper}[^<]{2,60}`, 'i'));
        if (nameMatch) {
          const fullName = nameMatch[1] ? nameMatch[1].trim() : nameMatch[0].trim();
          const cleanName = fullName.replace(/^[SP]\d{4}\s*-?\s*/i, '').trim();
          schools.push({ code: codeUpper, name: cleanName || codeUpper, href: `results/${code}.htm` });
        } else {
          schools.push({ code: codeUpper, name: codeUpper, href: `results/${code}.htm` });
        }
      }
    } else if (query.length > 0) {
      // Fetch specific letter index
      const firstLetter = query.charAt(0).toLowerCase();
      if (/[a-z]/.test(firstLetter)) {
        const indexUrl = `https://onlinesys.necta.go.tz/results/${year}/${eTypeLower}/indexfiles/index_${firstLetter}.htm`;
        let response = null;
        try {
          response = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' } });
        } catch(e) {}
        
        if (response && response.ok) {
          const html = await response.text();
          schools.push(...parseSchoolsFromHTML(html, query));
        } else {
          // Fallback to main index.htm if indexfiles/index_X.htm doesn't exist (older years)
          const urlsToTry = [
            `https://onlinesys.necta.go.tz/results/${year}/${eTypeLower}/index.htm`,
            `https://matokeo.necta.go.tz/${eTypeLower}${year}/index.htm`,
            `https://matokeo.necta.go.tz/results/${year}/${eTypeLower}/index.htm`,
            `https://maktaba.tetea.org/exam-results/${eTypeUpper}${year}/index.htm`,
            `https://necta.go.tz/results/${year}/${eTypeLower}/index.htm`
          ];

          let mainRes = null;
          for (const url of urlsToTry) {
            try {
              const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; STEA/1.0)' } });
              if (res.ok) {
                mainRes = res;
                break;
              }
            } catch (e) {
              // Continue
            }
          }

          if (mainRes) {
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
