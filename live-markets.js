const LIVE_BENCHMARKS = [
    {
        symbol: "NSE:NIFTY",
        title: "Nifty 50",
        exchange: "NSE",
        href: "https://www.tradingview.com/symbols/NSE-NIFTY/"
    },
    {
        symbol: "NSE:BANKNIFTY",
        title: "Bank Nifty",
        exchange: "NSE",
        href: "https://www.tradingview.com/symbols/NSE-BANKNIFTY/"
    },
    {
        symbol: "BSE:SENSEX",
        title: "Sensex",
        exchange: "BSE",
        href: "https://www.tradingview.com/symbols/BSE-SENSEX/"
    }
];

function createTradingViewScript(src, config) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.async = true;
    script.textContent = JSON.stringify(config, null, 2);
    return script;
}

function createBenchmarkFallback(benchmark) {
    return `
        <div class="benchmark-fallback">
            <strong>${benchmark.title} feed is reconnecting</strong>
            <span>Open the chart source directly while the embedded quote refreshes.</span>
            <a href="${benchmark.href}" target="_blank" rel="noopener noreferrer">Open ${benchmark.title}</a>
        </div>
    `;
}

function mountBenchmarkChart(host, benchmark) {
    const widget = document.createElement("article");
    widget.className = "benchmark-widget";
    widget.innerHTML = `
        <header>
            <div>
                <small>${benchmark.exchange}</small>
                <strong>${benchmark.title}</strong>
            </div>
            <a href="${benchmark.href}" target="_blank" rel="noopener noreferrer">Full chart</a>
        </header>
        <div class="benchmark-widget-frame"></div>
    `;

    const frame = widget.querySelector(".benchmark-widget-frame");
    frame.appendChild(createTradingViewScript("https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js", {
        symbol: benchmark.symbol,
        width: "100%",
        height: "100%",
        locale: "en",
        dateRange: "1D",
        colorTheme: "light",
        isTransparent: true,
        autosize: true,
        largeChartUrl: benchmark.href
    }));
    host.appendChild(widget);

    window.setTimeout(() => {
        if (!frame.querySelector("iframe")) {
            frame.innerHTML = createBenchmarkFallback(benchmark);
        }
    }, 7000);
}

function mountBenchmarkGrid(container) {
    container.innerHTML = "";
    LIVE_BENCHMARKS.forEach((benchmark) => mountBenchmarkChart(container, benchmark));
}

function mountTickerTape(container) {
    container.innerHTML = "";
    container.appendChild(createTradingViewScript("https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js", {
        symbols: LIVE_BENCHMARKS.map(({ symbol, title }) => ({ proName: symbol, title })),
        showSymbolLogo: true,
        isTransparent: true,
        displayMode: "adaptive",
        colorTheme: "light",
        locale: "en"
    }));

    window.setTimeout(() => {
        if (!container.querySelector("iframe")) {
            container.innerHTML = `
                <div class="live-market-fallback compact">
                    <strong>Benchmark ticker reconnecting</strong>
                    <span>Open the official exchange pages for the current session snapshot.</span>
                    <div>
                        <a href="https://www.nseindia.com/products-services/indices-nifty50-index" target="_blank" rel="noopener noreferrer">NSE</a>
                        <a href="https://m.bseindia.com/IndicesView_New.aspx/Sensex.aspx" target="_blank" rel="noopener noreferrer">BSE</a>
                    </div>
                </div>
            `;
        }
    }, 7000);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-live-benchmark-grid]").forEach(mountBenchmarkGrid);
    document.querySelectorAll("[data-live-market-ticker]").forEach(mountTickerTape);
});
