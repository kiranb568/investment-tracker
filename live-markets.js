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

function formatMarketNumber(value) {
    return Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "--";
}

function formatPercent(value) {
    if (!Number.isFinite(value)) return "--";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getChartUrl(symbol) {
    return `/api/market-data?symbol=${encodeURIComponent(symbol)}`;
}

async function fetchDelayedHistory(source) {
    const response = await fetch(getChartUrl(source.symbol), { cache: "no-store" });
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
        history,
        currency: result.meta?.currency || "INR",
        exchangeTimezoneName: result.meta?.exchangeTimezoneName || "Asia/Kolkata",
        fetchedAt: new Date().toISOString()
    };
}

function createPolyline(history, width = 520, height = 180) {
    const closes = history.map((point) => point.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const spread = max - min || 1;
    return history.map((point, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - (((point.close - min) / spread) * height);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
}

function createSnapshot(data, vix) {
    const latest = data.history.at(-1);
    const previous = data.history.at(-2);
    return {
        previousClose: previous.close,
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
        vix,
        history: data.history,
        source: "Yahoo Finance delayed chart endpoint",
        sourceHref: data.sourceHref,
        fetchedAt: data.fetchedAt
    };
}

function renderBenchmarkCard(data) {
    const latest = data.history.at(-1);
    const previous = data.history.at(-2);
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    const isPositive = change >= 0;
    return `
        <article class="benchmark-widget ${isPositive ? "is-positive" : "is-negative"}">
            <header>
                <div>
                    <small>${data.exchange} · Delayed feed</small>
                    <strong>${data.title}</strong>
                </div>
                <a href="${data.officialHref}" target="_blank" rel="noopener noreferrer">Official page</a>
            </header>
            <div class="benchmark-quote">
                <strong>${formatMarketNumber(latest.close)}</strong>
                <span>${change >= 0 ? "+" : ""}${formatMarketNumber(change)} · ${formatPercent(changePercent)}</span>
            </div>
            <svg class="benchmark-sparkline" viewBox="0 0 520 180" role="img" aria-label="${data.title} delayed one-month trend chart">
                <defs>
                    <linearGradient id="${data.instrument}-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="currentColor" stop-opacity=".22"></stop>
                        <stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
                    </linearGradient>
                </defs>
                <polyline class="benchmark-line" points="${createPolyline(data.history)}"></polyline>
            </svg>
            <footer>
                <span>O ${formatMarketNumber(latest.open)}</span>
                <span>H ${formatMarketNumber(latest.high)}</span>
                <span>L ${formatMarketNumber(latest.low)}</span>
                <a href="${data.sourceHref}" target="_blank" rel="noopener noreferrer">Delayed source</a>
            </footer>
        </article>
    `;
}

function renderBenchmarkError(source) {
    return `
        <article class="benchmark-widget">
            <header>
                <div><small>${source.exchange}</small><strong>${source.title}</strong></div>
                <a href="${source.officialHref}" target="_blank" rel="noopener noreferrer">Official page</a>
            </header>
            <div class="benchmark-fallback">
                <strong>Delayed chart unavailable</strong>
                <span>Open the official exchange page while the public feed reconnects.</span>
            </div>
        </article>
    `;
}

async function loadDelayedMarketData() {
    const results = await Promise.allSettled([
        ...DELAYED_MARKET_SOURCES.map(fetchDelayedHistory),
        fetchDelayedHistory({ ...VIX_SOURCE, title: "India VIX" })
    ]);
    const vixData = results.at(-1);
    const vix = vixData.status === "fulfilled" ? vixData.value.history.at(-1).close : undefined;
    const snapshots = {};

    results.slice(0, -1).forEach((result, index) => {
        if (result.status === "fulfilled") {
            snapshots[DELAYED_MARKET_SOURCES[index].instrument] = createSnapshot(result.value, vix);
        }
    });

    window.__SRISHTI_MARKET_SNAPSHOT__ = snapshots;
    window.dispatchEvent(new CustomEvent("srishti:market-snapshot", { detail: snapshots }));
    return { results: results.slice(0, -1), snapshots, vix };
}

async function mountBenchmarkGrid(container) {
    container.innerHTML = '<div class="market-loading">Loading delayed benchmark charts...</div>';
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
        const latest = result.value.history.at(-1);
        const previous = result.value.history.at(-2);
        const percent = ((latest.close - previous.close) / previous.close) * 100;
        return `<a href="${result.value.officialHref}" class="${percent >= 0 ? "is-positive" : "is-negative"}" target="_blank" rel="noopener noreferrer"><strong>${result.value.title}</strong><span>${formatMarketNumber(latest.close)} · ${formatPercent(percent)}</span></a>`;
    });

    items.push(`<a href="${VIX_SOURCE.sourceHref}" target="_blank" rel="noopener noreferrer"><strong>India VIX</strong><span>${formatMarketNumber(vix)}</span></a>`);
    container.innerHTML = `<div class="delayed-market-ticker">${items.join("")}</div>`;
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-live-benchmark-grid]").forEach(mountBenchmarkGrid);
    document.querySelectorAll("[data-live-market-ticker]").forEach(mountTickerTape);
});
