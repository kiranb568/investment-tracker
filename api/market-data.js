const ALLOWED_SYMBOLS = new Set(["^NSEI", "^NSEBANK", "^BSESN", "^INDIAVIX"]);
const ALLOWED_RANGES = new Set(["1d", "5d", "1mo"]);
const ALLOWED_INTERVALS = new Set(["5m", "15m", "1h", "1d"]);

module.exports = async function handler(request, response) {
    const symbol = request.query?.symbol;
    if (!ALLOWED_SYMBOLS.has(symbol)) {
        response.status(400).json({ error: "Unsupported market symbol" });
        return;
    }

    const range = ALLOWED_RANGES.has(request.query?.range) ? request.query.range : "1mo";
    const interval = ALLOWED_INTERVALS.has(request.query?.interval) ? request.query.interval : "1d";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&events=history`;
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
