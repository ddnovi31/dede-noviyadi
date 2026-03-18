import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  fs.writeFileSync('rendered.html', content);
  
  await browser.close();
})();
