import https from 'https';

https.get('https://onlinesys.necta.go.tz/results/2023/csee/index.htm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const linkRegex = /<a[^>]+href=["']([^"']*\.htm)["'][^>]*>([^<]+)<\/a>/gi;
    let match;
    let count = 0;
    while ((match = linkRegex.exec(data)) !== null && count < 5) {
      console.log(match[1], match[2]);
      count++;
    }
    if (count === 0) {
      console.log("No matches found with current regex.");
      // Let's try another regex
      const linkRegex2 = /href=["']([^"']*\.htm)["'][^>]*>([^<]+)/gi;
      let match2 = linkRegex2.exec(data);
      if (match2) console.log("Found with regex2:", match2[1], match2[2]);
    }
  });
});
