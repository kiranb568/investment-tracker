const INSIGHT_INSTRUMENTS = ["NIFTY", "BANKNIFTY", "SENSEX"];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function hasCompleteSnapshot(snapshot) {
    return snapshot && ["previousClose", "open", "high", "low", "close"].every((key) => Number.isFinite(snapshot[key]));
}

function formatNumber(value) {
    return Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "Awaiting feed";
}

function formatMetric(value, suffix = "") {
    return Number.isFinite(value) ? `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}` : "Awaiting feed";
}

function getDirection(snapshot) {
    if (!hasCompleteSnapshot(snapshot)) {
        return "Awaiting feed";
    }

    if (snapshot.close > snapshot.previousClose && snapshot.close > snapshot.open) {
        return "Positive momentum";
    }

    if (snapshot.close < snapshot.previousClose && snapshot.close < snapshot.open) {
        return "Defensive momentum";
    }

    return "Range-bound";
}

function average(values) {
    const usable = values.filter(Number.isFinite);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : undefined;
}

function standardDeviation(values) {
    const mean = average(values);
    if (!Number.isFinite(mean)) return undefined;
    return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function getAdaptiveSignals(snapshot) {
    const history = snapshot?.history || [];
    const closes = history.map((point) => point.close).filter(Number.isFinite);
    const recent = closes.slice(-5);
    const baseline = closes.slice(-15);
    const returns = closes.slice(1).map((close, index) => ((close - closes[index]) / closes[index]) * 100);
    const shortAverage = average(recent);
    const baselineAverage = average(baseline);
    const realizedVolatility = Number.isFinite(standardDeviation(returns))
        ? standardDeviation(returns) * Math.sqrt(252)
        : undefined;
    const trend = Number.isFinite(shortAverage) && Number.isFinite(baselineAverage)
        ? (shortAverage > baselineAverage ? "Uptrend" : shortAverage < baselineAverage ? "Downtrend" : "Sideways")
        : "Awaiting feed";
    const divergence = Number.isFinite(shortAverage) && Number.isFinite(snapshot?.close)
        ? (snapshot.close > shortAverage ? "Price above 5-session mean" : "Price below 5-session mean")
        : "Awaiting feed";

    return { shortAverage, baselineAverage, realizedVolatility, trend, divergence };
}

function rememberObservation(instrument, snapshot) {
    if (!hasCompleteSnapshot(snapshot)) return 0;
    try {
        const key = "srishtiWealthAdaptiveObservations";
        const memory = JSON.parse(localStorage.getItem(key) || "{}");
        const observations = memory[instrument] || [];
        const signature = `${snapshot.fetchedAt || ""}:${snapshot.close}`;
        if (!observations.some((item) => item.signature === signature)) {
            observations.push({ signature, close: snapshot.close, recordedAt: new Date().toISOString() });
        }
        memory[instrument] = observations.slice(-60);
        localStorage.setItem(key, JSON.stringify(memory));
        return memory[instrument].length;
    } catch (error) {
        console.warn("Unable to retain adaptive market observations:", error);
        return 0;
    }
}

function getBuildUp(snapshot) {
    if (!Number.isFinite(snapshot?.futuresPriceChange) || !Number.isFinite(snapshot?.oiChange)) {
        return "Awaiting feed";
    }

    if (snapshot.futuresPriceChange > 0 && snapshot.oiChange > 0) return "Long build-up";
    if (snapshot.futuresPriceChange < 0 && snapshot.oiChange > 0) return "Short build-up";
    if (snapshot.futuresPriceChange > 0 && snapshot.oiChange < 0) return "Short covering";
    return "Long unwinding";
}

function calculateLevels(snapshot) {
    if (!hasCompleteSnapshot(snapshot)) {
        return { support: "Awaiting feed", resistance: "Awaiting feed", entry: "Withheld", exit: "Withheld" };
    }

    const pivot = (snapshot.high + snapshot.low + snapshot.close) / 3;
    const support = (2 * pivot) - snapshot.high;
    const resistance = (2 * pivot) - snapshot.low;
    return {
        support: formatNumber(support),
        resistance: formatNumber(resistance),
        entry: `Review only above ${formatNumber(resistance)}`,
        exit: `Reassess below ${formatNumber(support)}`
    };
}

function getRuntimeSnapshots() {
    return window.__SRISHTI_MARKET_SNAPSHOT__ || {};
}

function renderInsightCard(instrument, snapshot) {
    const levels = calculateLevels(snapshot);
    const connected = hasCompleteSnapshot(snapshot);
    const adaptive = getAdaptiveSignals(snapshot);
    const observations = rememberObservation(instrument, snapshot);
    return `
        <article class="ai-insight-card ${connected ? "is-connected" : "is-pending"}">
            <header>
                <div>
                    <small>${instrument === "SENSEX" ? "BSE INDEX" : "NSE INDEX / F&O"}</small>
                    <h3>${instrument}</h3>
                </div>
                <span>${connected ? "Live snapshot connected" : "Awaiting licensed feed"}</span>
            </header>
            <div class="ai-insight-grid">
                <div><small>Prev. Close</small><strong>${formatNumber(snapshot?.previousClose)}</strong></div>
                <div><small>Open</small><strong>${formatNumber(snapshot?.open)}</strong></div>
                <div><small>High / Low</small><strong>${formatNumber(snapshot?.high)} / ${formatNumber(snapshot?.low)}</strong></div>
                <div><small>Trend / Direction</small><strong>${adaptive.trend} · ${getDirection(snapshot)}</strong></div>
                <div><small>F&O OI Change</small><strong>${formatMetric(snapshot?.oiChange, "%")}</strong></div>
                <div><small>PCR</small><strong>${formatMetric(snapshot?.pcr)}</strong></div>
                <div><small>Build-up</small><strong>${getBuildUp(snapshot)}</strong></div>
                <div><small>Volatility / VIX</small><strong>${formatMetric(adaptive.realizedVolatility, "%")} / ${formatMetric(snapshot?.vix)}</strong></div>
                <div><small>Greeks</small><strong>${escapeHtml(snapshot?.greeks || "Awaiting option-chain feed")}</strong></div>
                <div><small>Divergence</small><strong>${escapeHtml(snapshot?.divergence || adaptive.divergence)}</strong></div>
                <div><small>Support / Resistance</small><strong>${levels.support} / ${levels.resistance}</strong></div>
                <div><small>Possible Entry / Exit</small><strong>${connected ? `${levels.entry}. ${levels.exit}.` : "Withheld until live inputs are connected"}</strong></div>
                <div><small>Adaptive Memory</small><strong>${observations ? `${observations} verified observation${observations === 1 ? "" : "s"}` : "Awaiting feed"}</strong></div>
                <div><small>Data Source</small><strong>${escapeHtml(snapshot?.source || "Awaiting feed")}</strong></div>
            </div>
        </article>
    `;
}

function renderAiInsights(container) {
    const snapshots = getRuntimeSnapshots();
    container.innerHTML = `
        <div class="ai-insight-heading">
            <div>
                <span>AI-ready Market Intelligence</span>
                <h2>Self-learning insight console</h2>
                <p>Adaptive delayed-market analytics evaluate OHLC history, direction, realized volatility, divergence, VIX, support, resistance, and scenario levels. F&O fields remain visibly pending until a licensed option-chain connector is added.</p>
            </div>
            <div class="ai-insight-status">
                <strong>${Object.keys(snapshots).length ? "Runtime snapshot detected" : "Live data connector required"}</strong>
                <small>Decision-support only. Not investment advice.</small>
            </div>
        </div>
        <div class="ai-insight-cards">
            ${INSIGHT_INSTRUMENTS.map((instrument) => renderInsightCard(instrument, snapshots[instrument])).join("")}
        </div>
        <div class="fno-connector-status">
            <div>
                <strong>Stock F&O intelligence connector</strong>
                <span>Ready for licensed option-chain integration</span>
            </div>
            <p>Stock-level Greeks, OI, PCR, expiry analysis, build-up classification, and contract-level scenarios are intentionally pending. NSE treats these analytics and delayed F&O feeds as licensed data products.</p>
            <a href="https://www.nseindia.com/market-data/analytical-products" target="_blank" rel="noopener noreferrer">Review NSE analytical products</a>
        </div>
        <p class="ai-insight-note">Delayed benchmark history is used for adaptive technical scenarios, not guaranteed predictions. Greeks, OI, PCR, and F&O build-up remain withheld until a licensed option-chain connector supplies them. This is decision support, not investment advice.</p>
    `;
}

function renderAiMarketPulse() {
    const badge = document.getElementById("pulse-badge");
    if (!badge) {
        return;
    }

    const snapshots = Object.values(getRuntimeSnapshots()).filter(hasCompleteSnapshot);
    const title = document.getElementById("pulse-title");
    const text = document.getElementById("pulse-text");
    const benchmarks = document.getElementById("pulse-bench");
    const commodities = document.getElementById("pulse-commodities");
    const risk = document.getElementById("pulse-risk");
    const icon = document.getElementById("pulse-icon");

    if (!snapshots.length) {
        badge.className = "pulse-badge";
        badge.textContent = "AI Feed Pending";
        title.textContent = "Connect a licensed live-market feed to activate Market Pulse.";
        text.textContent = "The AI-ready pulse intentionally withholds sentiment, predictions, and trade levels until verified NSE/BSE inputs are available.";
        benchmarks.textContent = "Awaiting feed";
        commodities.textContent = "Official MCX link";
        risk.textContent = "Not scored";
        icon.style.color = "#6d43c7";
        icon.innerHTML = '<svg viewBox="0 0 64 64"><path d="M18 22h28"></path><path d="M18 32h20"></path><path d="M18 42h14"></path><path d="M46 38v10"></path><path d="M41 43h10"></path></svg>';
        return;
    }

    const positiveCount = snapshots.filter((snapshot) => snapshot.close > snapshot.previousClose).length;
    const isConstructive = positiveCount >= Math.ceil(snapshots.length / 2);
    badge.className = `pulse-badge ${isConstructive ? "bullish" : "bearish"}`;
    badge.textContent = isConstructive ? "Constructive Bias" : "Defensive Bias";
    title.textContent = isConstructive ? "Verified benchmark inputs indicate constructive participation." : "Verified benchmark inputs indicate a defensive market posture.";
    text.textContent = "Market Pulse is generated from connected runtime snapshots. Review the detailed insight cards and official exchange sources before acting.";
    benchmarks.textContent = `${snapshots.length} connected`;
    commodities.textContent = "Official MCX link";
    risk.textContent = isConstructive ? "Measured" : "Elevated";
    icon.style.color = isConstructive ? "#11734b" : "#b93d5a";
    icon.innerHTML = isConstructive
        ? '<svg viewBox="0 0 64 64"><path d="M12 45l12-12 9 7 18-22"></path><path d="M42 18h9v9"></path></svg>'
        : '<svg viewBox="0 0 64 64"><path d="M12 19l12 12 9-7 18 22"></path><path d="M42 46h9v-9"></path></svg>';
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-ai-market-insights]").forEach(renderAiInsights);
    renderAiMarketPulse();
});

window.addEventListener("srishti:market-snapshot", () => {
    document.querySelectorAll("[data-ai-market-insights]").forEach(renderAiInsights);
    renderAiMarketPulse();
});
