import https from 'https';
https.get('https://open.er-api.com/v6/latest/USD', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.parse(data).rates.IDR));
});
