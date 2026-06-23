const DELAYED_MARKET_SOURCES = [
    {
        instrument: "NIFTY",
        symbol: "^NSEI",
        title: "Nifty 50",
        exchange: "NSE",
        officialHref: "https://www.nseindia.com/products-services/indices-nifty50-index",
        sourceHref: "https://finance.yahoo.com/quote/%5ENSEI/history/"
    },
    {
        instrument: "BANKNIFTY",
        symbol: "^NSEBANK",
        title: "Bank Nifty",
        exchange: "NSE",
        officialHref: "https://www.nseindia.com/products-services/indices-nifty-bank-index",
        sourceHref: "https://finance.yahoo.com/quote/%5ENSEBANK/history/"
    },
    {
        instrument: "SENSEX",
        symbol: "^BSESN",
        title: "Sensex",
        exchange: "BSE",
        officialHref: "https://m.bseindia.com/IndicesView_New.aspx/Sensex.aspx",
        sourceHref: "https://finance.yahoo.com/quote/%5EBSESN/history/"
    }
];

const VIX_SOURCE = {
    symbol: "^INDIAVIX",
    sourceHref: "https://finance.yahoo.com/quote/%5EINDIAVIX/history/"
};

let marketDataPromise;

function formatMarketNumber(value) {
    return Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "--";
}

function formatPercent(value) {
    if (!Number.isFinite(value)) return "--";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getSignalStatus(signal) {
    return signal?.status || (Number.isFinite(signal?.value) ? "Range" : "Awaiting");
}

function getChartUrl(symbol, range = "1mo", interval = "1d") {
    return `/api/market-data?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
}

async function fetchDelayedHistory(source, range = "1mo", interval = "1d") {
    const response = await fetch(getChartUrl(source.symbol, range, interval), { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`${source.title || source.symbol} feed returned ${response.status}`);
    }

    const result = (await response.json())?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const timestamps = result?.timestamp || [];
    if (!quote || !timestamps.length) {
        throw new Error(`${source.title || source.symbol} feed did not return history`);
    }

    const history = timestamps.map((timestamp, index) => ({
        timestamp,
        open: quote.open?.[index],
        high: quote.high?.[index],
        low: quote.low?.[index],
        close: quote.close?.[index],
        volume: quote.volume?.[index]
    })).filter((point) => [point.open, point.high, point.low, point.close].every(Number.isFinite));

    if (history.length < 2) {
        throw new Error(`${source.title || source.symbol} feed has insufficient history`);
    }

    return {
        ...source,
        range,
        interval,
        history,
        currency: result.meta?.currency || "INR",
        exchangeTimezoneName: result.meta?.exchangeTimezoneName || "Asia/Kolkata",
        fetchedAt: new Date().toISOString()
    };
}

function calculateWindowMove(history, points) {
    const usable = history.filter((point) => Number.isFinite(point.close));
    if (usable.length < 2) return undefined;
    const latest = usable.at(-1);
    const anchor = usable.at(Math.max(0, usable.length - 1 - points));
    if (!anchor || !Number.isFinite(anchor.close)) return undefined;
    return ((latest.close - anchor.close) / anchor.close) * 100;
}

function classifySignal(value) {
    if (!Number.isFinite(value)) return { status: "Awaiting", tone: "neutral" };
    if (value > 0.18) return { status: "Bullish", tone: "positive" };
    if (value < -0.18) return { status: "Bearish", tone: "negative" };
    return { status: "Range", tone: "neutral" };
}

function getTimeframeSignals(dailyHistory, intradayHistory) {
    const dayMove = calculateWindowMove(dailyHistory, 1);
    const fifteenMove = calculateWindowMove(intradayHistory, 3);
    const hourlyMove = calculateWindowMove(intradayHistory, 12);
    return [
        { label: "15m", value: fifteenMove, ...classifySignal(fifteenMove) },
        { label: "1h", value: hourlyMove, ...classifySignal(hourlyMove) },
        { label: "Daily", value: dayMove, ...classifySignal(dayMove) }
    ];
}

function createTrendLine(history, width = 620, height = 250) {
    const closes = history.map((point) => point.close).filter(Number.isFinite);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const spread = max - min || 1;
    return history.map((point, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - (((point.close - min) / spread) * height);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
}

function renderCandles(history, width = 620, height = 250) {
    const candles = history.slice(-18);
    const highs = candles.map((point) => point.high);
    const lows = candles.map((point) => point.low);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const spread = max - min || 1;
    const slot = width / candles.length;
    const candleWidth = Math.max(8, Math.min(20, slot * 0.46));
    const y = (value) => height - (((value - min) / spread) * height);

    return candles.map((point, index) => {
        const x = (index * slot) + (slot / 2);
        const openY = y(point.open);
        const closeY = y(point.close);
        const highY = y(point.high);
        const lowY = y(point.low);
        const bodyY = Math.min(openY, closeY);
        const bodyHeight = Math.max(4, Math.abs(openY - closeY));
        const tone = point.close >= point.open ? "up" : "down";
        return `
            <g class="candle ${tone}">
                <line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${highY.toFixed(1)}" y2="${lowY.toFixed(1)}"></line>
                <rect x="${(x - candleWidth / 2).toFixed(1)}" y="${bodyY.toFixed(1)}" width="${candleWidth.toFixed(1)}" height="${bodyHeight.toFixed(1)}" rx="3"></rect>
            </g>
        `;
    }).join("");
}

function createSnapshot(dailyData, intradayData, vix) {
    const latest = dailyData.history.at(-1);
    const previous = dailyData.history.at(-2);
    const signals = getTimeframeSignals(dailyData.history, intradayData?.history || []);
    return {
        previousClose: previous.close,
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
        vix,
        timeframeSignals: signals,
        intradayHistory: intradayData?.history || [],
        history: dailyData.history,
        source: "Yahoo Finance delayed chart endpoint",
        sourceHref: dailyData.sourceHref,
        fetchedAt: dailyData.fetchedAt
    };
}

function renderBenchmarkCard(bundle) {
    const { daily, intraday } = bundle;
    const latest = daily.history.at(-1);
    const previous = daily.history.at(-2);
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    const isPositive = change >= 0;
    const signals = getTimeframeSignals(daily.history, intraday?.history || []);
    const chartHistory = intraday?.history?.length > 8 ? intraday.history : daily.history;
    return `
        <article class="benchmark-widget ${isPositive ? "is-positive" : "is-negative"}">
            <header class="benchmark-head">
                <div>
                    <small>${daily.exchange} delayed market feed</small>
                    <strong>${daily.title}</strong>
                </div>
                <a href="${daily.officialHref}" target="_blank" rel="noopener noreferrer">Official</a>
            </header>
            <div class="benchmark-quote">
                <strong>${formatMarketNumber(latest.close)}</strong>
                <span>${change >= 0 ? "+" : ""}${formatMarketNumber(change)} · ${formatPercent(changePercent)}</span>
            </div>
            <div class="benchmark-chart-shell">
                <svg class="benchmark-candles" viewBox="0 0 620 250" role="img" aria-label="${daily.title} delayed trend and candlestick chart" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="${daily.instrument}-chart-bg" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stop-color="rgba(21,89,214,.18)"></stop>
                            <stop offset="100%" stop-color="rgba(255,204,72,.08)"></stop>
                        </linearGradient>
                    </defs>
                    <rect class="chart-plane" x="0" y="0" width="620" height="250" rx="24"></rect>
                    <path class="chart-grid" d="M0 62.5H620M0 125H620M0 187.5H620"></path>
                    ${renderCandles(chartHistory)}
                    <polyline class="benchmark-line" points="${createTrendLine(chartHistory)}"></polyline>
                </svg>
            </div>
            <div class="timeframe-strip">
                ${signals.map((signal) => `
                    <div class="timeframe-pill ${signal.tone}">
                        <small>${signal.label}</small>
                        <strong>${getSignalStatus(signal)}</strong>
                        <span>${Number.isFinite(signal.value) ? formatPercent(signal.value) : "Pending intraday feed"}</span>
                    </div>
                `).join("")}
            </div>
            <footer class="benchmark-footer">
                <span>${signals.map((signal) => `${signal.label}: ${getSignalStatus(signal)}`).join(" · ")}</span>
                <a href="${daily.sourceHref}" target="_blank" rel="noopener noreferrer">Delayed source</a>
            </footer>
        </article>
    `;
}

function renderBenchmarkError(source) {
    return `
        <article class="benchmark-widget is-pending">
            <header class="benchmark-head">
                <div><small>${source.exchange}</small><strong>${source.title}</strong></div>
                <a href="${source.officialHref}" target="_blank" rel="noopener noreferrer">Official</a>
            </header>
            <div class="benchmark-fallback">
                <strong>Delayed chart unavailable</strong>
                <span>Open the official exchange page while the public feed reconnects.</span>
            </div>
        </article>
    `;
}

async function fetchMarketBundle(source) {
    const [daily, intraday] = await Promise.all([
        fetchDelayedHistory(source, "1mo", "1d"),
        fetchDelayedHistory(source, "1d", "5m").catch(() => undefined)
    ]);
    return { daily, intraday };
}

async function loadDelayedMarketData() {
    if (marketDataPromise) {
        return marketDataPromise;
    }

    marketDataPromise = loadDelayedMarketDataOnce();
    return marketDataPromise;
}

async function loadDelayedMarketDataOnce() {
    const results = await Promise.allSettled([
        ...DELAYED_MARKET_SOURCES.map(fetchMarketBundle),
        fetchDelayedHistory({ ...VIX_SOURCE, title: "India VIX" }, "1mo", "1d")
    ]);
    const vixData = results.at(-1);
    const vix = vixData.status === "fulfilled" ? vixData.value.history.at(-1).close : undefined;
    const snapshots = {};

    results.slice(0, -1).forEach((result, index) => {
        if (result.status === "fulfilled") {
            const { daily, intraday } = result.value;
            snapshots[DELAYED_MARKET_SOURCES[index].instrument] = createSnapshot(daily, intraday, vix);
        }
    });

    window.__SRISHTI_MARKET_SNAPSHOT__ = snapshots;
    window.dispatchEvent(new CustomEvent("srishti:market-snapshot", { detail: snapshots }));
    return { results: results.slice(0, -1), snapshots, vix };
}

async function mountBenchmarkGrid(container) {
    container.innerHTML = '<div class="market-loading">Loading benchmark candlestick board...</div>';
    const { results, vix } = await loadDelayedMarketData();
    container.innerHTML = results.map((result, index) => result.status === "fulfilled"
        ? renderBenchmarkCard(result.value)
        : renderBenchmarkError(DELAYED_MARKET_SOURCES[index])
    ).join("");
    container.dataset.vix = Number.isFinite(vix) ? formatMarketNumber(vix) : "Unavailable";
}

async function mountTickerTape(container) {
    const { results, vix } = await loadDelayedMarketData();
    const items = results.map((result, index) => {
        if (result.status !== "fulfilled") {
            return `<a href="${DELAYED_MARKET_SOURCES[index].officialHref}" target="_blank" rel="noopener noreferrer"><strong>${DELAYED_MARKET_SOURCES[index].title}</strong><span>Feed reconnecting</span></a>`;
        }
        const latest = result.value.daily.history.at(-1);
        const previous = result.value.daily.history.at(-2);
        const percent = ((latest.close - previous.close) / previous.close) * 100;
        return `<a href="${result.value.daily.officialHref}" class="${percent >= 0 ? "is-positive" : "is-negative"}" target="_blank" rel="noopener noreferrer"><strong>${result.value.daily.title}</strong><span>${formatMarketNumber(latest.close)} · ${formatPercent(percent)}</span></a>`;
    });

    items.push(`<a href="${VIX_SOURCE.sourceHref}" target="_blank" rel="noopener noreferrer"><strong>India VIX</strong><span>${formatMarketNumber(vix)}</span></a>`);
    container.innerHTML = `<div class="delayed-market-ticker">${items.join("")}</div>`;
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-live-benchmark-grid]").forEach(mountBenchmarkGrid);
    document.querySelectorAll("[data-live-market-ticker]").forEach(mountTickerTape);
});
