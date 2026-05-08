const LIVE_MARKET_SYMBOLS = [
    { proName: "NSE:NIFTY", title: "Nifty 50" },
    { proName: "BSE:SENSEX", title: "Sensex" },
    { proName: "NSE:BANKNIFTY", title: "Bank Nifty" },
    { proName: "MCX:GOLD1!", title: "MCX Gold" },
    { proName: "MCX:CRUDEOIL1!", title: "MCX Crude" },
    { proName: "MCX:NATURALGAS1!", title: "MCX Natural Gas" }
];

function createTradingViewScript(src, config) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.async = true;
    script.textContent = JSON.stringify(config, null, 2);
    return script;
}

function showMarketFallback(container, compact = false) {
    container.innerHTML = `
        <div class="${compact ? "live-market-fallback compact" : "live-market-fallback"}">
            <strong>Live widget unavailable</strong>
            <span>Use official exchange pages while the market feed reconnects.</span>
            <div>
                <a href="https://www.nseindia.com/products-services/indices-nifty50-index" target="_blank" rel="noopener noreferrer">NSE</a>
                <a href="https://m.bseindia.com/IndicesView_New.aspx/Sensex.aspx" target="_blank" rel="noopener noreferrer">BSE</a>
                <a href="https://www.mcxindia.com/market-data/market-watch" target="_blank" rel="noopener noreferrer">MCX</a>
            </div>
        </div>
    `;
}

function mountMarketOverview(container) {
    container.innerHTML = "";
    const widgetHost = document.createElement("div");
    widgetHost.className = "tradingview-widget-container__widget";
    container.appendChild(widgetHost);
    container.appendChild(createTradingViewScript("https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js", {
        colorTheme: "dark",
        dateRange: "1D",
        showChart: true,
        locale: "en",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: "560",
        plotLineColorGrowing: "rgba(41, 255, 172, 1)",
        plotLineColorFalling: "rgba(255, 93, 129, 1)",
        gridLineColor: "rgba(239, 246, 255, 0.06)",
        scaleFontColor: "rgba(225, 235, 255, 0.72)",
        belowLineFillColorGrowing: "rgba(41, 255, 172, 0.12)",
        belowLineFillColorFalling: "rgba(255, 93, 129, 0.12)",
        belowLineFillColorGrowingBottom: "rgba(41, 255, 172, 0)",
        belowLineFillColorFallingBottom: "rgba(255, 93, 129, 0)",
        symbolActiveColor: "rgba(42, 218, 255, 0.18)",
        tabs: [
            {
                title: "NSE / BSE",
                symbols: LIVE_MARKET_SYMBOLS.slice(0, 3).map(({ proName, title }) => ({ s: proName, d: title }))
            },
            {
                title: "MCX",
                symbols: LIVE_MARKET_SYMBOLS.slice(3).map(({ proName, title }) => ({ s: proName, d: title }))
            }
        ]
    }));

    window.setTimeout(() => {
        if (!container.querySelector("iframe")) {
            showMarketFallback(container);
        }
    }, 7000);
}

function mountTickerTape(container) {
    container.innerHTML = "";
    container.appendChild(createTradingViewScript("https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js", {
        symbols: LIVE_MARKET_SYMBOLS,
        showSymbolLogo: true,
        isTransparent: true,
        displayMode: "adaptive",
        colorTheme: "dark",
        locale: "en"
    }));

    window.setTimeout(() => {
        if (!container.querySelector("iframe")) {
            showMarketFallback(container, true);
        }
    }, 7000);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-live-market-overview]").forEach(mountMarketOverview);
    document.querySelectorAll("[data-live-market-ticker]").forEach(mountTickerTape);
});
