import https from 'https';
https.get('https://www.westmetall.com/en/markdaten.php?action=show_lme_copper', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.substring(1000, 3000)));
});
