import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fetchHtml = async () => {
      const response = await fetch('https://www.westmetall.com/en/markdaten.php', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.text();
    };

    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) return null;
        const data = await response.json();
        return data.rates.IDR;
      } catch (e) {
        return null;
      }
    };

    const [html, exchangeRate] = await Promise.all([fetchHtml(), fetchExchangeRate()]);
    
    // Extract Date
    const dateMatch = html.match(/<th class="number">([^<]+)<\/th>/);
    const date = dateMatch ? dateMatch[1].trim() : 'Unknown Date';

    // Extract Copper Price (Settlement Kasse)
    const cuMatch = html.match(/Copper\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]+>\s*([\d,.]+)\s*<\/a>/);
    const cuPrice = cuMatch ? parseFloat(cuMatch[1].replace(/,/g, '')) : null;

    // Extract Aluminium Price (Settlement Kasse)
    const alMatch = html.match(/Aluminium\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]+>\s*([\d,.]+)\s*<\/a>/);
    const alPrice = alMatch ? parseFloat(alMatch[1].replace(/,/g, '')) : null;

    res.status(200).json({
      success: true,
      date,
      copper: cuPrice,
      aluminium: alPrice,
      exchangeRate
    });
  } catch (error) {
    console.error("Error fetching LME prices:", error);
    res.status(500).json({ success: false, error: "Failed to fetch LME prices", details: error instanceof Error ? error.message : String(error) });
  }
}
