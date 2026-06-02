const ALLOWED_SYMBOLS = new Set(["^NSEI", "^NSEBANK", "^BSESN", "^INDIAVIX"]);

module.exports = async function handler(request, response) {
    const symbol = request.query?.symbol;
    if (!ALLOWED_SYMBOLS.has(symbol)) {
        response.status(400).json({ error: "Unsupported market symbol" });
        return;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d&events=history`;
    try {
        const upstream = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "SrishtiWealth-MarketDashboard/1.0"
            }
        });

        if (!upstream.ok) {
            response.status(502).json({ error: "Delayed market source is temporarily unavailable" });
            return;
        }

        response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        response.status(200).json(await upstream.json());
    } catch (error) {
        console.error("Unable to retrieve delayed market data:", error);
        response.status(502).json({ error: "Unable to retrieve delayed market data" });
    }
};
