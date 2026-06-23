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

function average(values) {
    const usable = values.filter(Number.isFinite);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : undefined;
}

function standardDeviation(values) {
    const mean = average(values);
    if (!Number.isFinite(mean)) return undefined;
    return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function getDirection(snapshot) {
    if (!hasCompleteSnapshot(snapshot)) return "Awaiting feed";
    if (snapshot.close > snapshot.previousClose && snapshot.close > snapshot.open) return "Positive momentum";
    if (snapshot.close < snapshot.previousClose && snapshot.close < snapshot.open) return "Defensive momentum";
    return "Range-bound";
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
        memory[instrument] = observations.slice(-90);
        localStorage.setItem(key, JSON.stringify(memory));
        return memory[instrument].length;
    } catch (error) {
        console.warn("Unable to retain adaptive market observations:", error);
        return 0;
    }
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
        entry: `Momentum review above ${formatNumber(resistance)}`,
        exit: `Risk review below ${formatNumber(support)}`
    };
}

function getRuntimeSnapshots() {
    return window.__SRISHTI_MARKET_SNAPSHOT__ || {};
}

function getTimeframeSignals(snapshot) {
    const fallback = [
        { label: "15m", tone: "neutral", value: undefined, detail: "Awaiting intraday feed" },
        { label: "1h", tone: "neutral", value: undefined, detail: "Awaiting intraday feed" },
        { label: "Daily", tone: "neutral", value: undefined, detail: "Awaiting daily feed" }
    ];

    return (snapshot?.timeframeSignals?.length ? snapshot.timeframeSignals : fallback).map((signal) => ({
        ...signal,
        detail: signal.detail || `${signal.label} bias ${signal.label === "Daily" ? "from daily close" : "from 5m delayed feed"}`
    }));
}

function getOptionsRead(snapshot, adaptive) {
    const vix = snapshot?.vix;
    const trend = adaptive.trend;
    const isVolHigh = Number.isFinite(vix) && vix >= 18;
    const isVolLow = Number.isFinite(vix) && vix <= 12;
    const direction = getDirection(snapshot);

    if (!hasCompleteSnapshot(snapshot)) {
        return {
            regime: "Awaiting feed",
            strategy: "Wait for benchmark and option-chain inputs.",
            risk: "Do not calculate strikes without verified feed."
        };
    }

    if (trend === "Uptrend" && direction !== "Defensive momentum") {
        return {
            regime: isVolHigh ? "Bullish with elevated premium" : "Bullish controlled premium",
            strategy: "Prefer defined-risk bullish structures; confirm option-chain OI before strike selection.",
            risk: isVolHigh ? "Avoid chasing inflated weekly premiums." : "Watch gamma expansion near resistance."
        };
    }

    if (trend === "Downtrend" && direction !== "Positive momentum") {
        return {
            regime: isVolHigh ? "Bearish high-volatility" : "Bearish measured-volatility",
            strategy: "Prefer defined-risk bearish structures; confirm put-side OI and PCR before entry.",
            risk: "Avoid short premium without stop and event-risk filter."
        };
    }

    return {
        regime: isVolLow ? "Range compression" : "Two-way range",
        strategy: "Wait for breakout confirmation or use neutral defined-risk spreads only after OI validation.",
        risk: "False breakouts likely near support/resistance bands."
    };
}

function renderTimeframeRail(snapshot) {
    return `
        <div class="insight-timeframes">
            ${getTimeframeSignals(snapshot).map((signal) => `
                <div class="insight-timeframe ${signal.tone}">
                    <small>${signal.label}</small>
                    <strong>${signal.label === "15m" ? "Scalp" : signal.label === "1h" ? "Intraday" : "Swing"}</strong>
                    <span>${Number.isFinite(signal.value) ? `${signal.label} ${signal.value >= 0 ? "+" : ""}${signal.value.toFixed(2)}%` : signal.detail}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderGreeksPanel(snapshot, optionsRead) {
    const greeks = snapshot?.greeks;
    return `
        <div class="greeks-panel">
            <div>
                <small>Live Greeks Intelligence</small>
                <strong>${greeks ? escapeHtml(greeks) : "Connector-ready"}</strong>
                <span>${greeks ? "Using connected option-chain Greeks." : "Delta, Gamma, Theta, Vega, OI, PCR and build-up require a licensed option-chain connector."}</span>
            </div>
            <div>
                <small>Options Regime</small>
                <strong>${escapeHtml(optionsRead.regime)}</strong>
                <span>${escapeHtml(optionsRead.strategy)}</span>
            </div>
            <div>
                <small>Premium Risk</small>
                <strong>VIX ${formatMetric(snapshot?.vix)}</strong>
                <span>${escapeHtml(optionsRead.risk)}</span>
            </div>
        </div>
    `;
}

function renderInsightCard(instrument, snapshot) {
    const levels = calculateLevels(snapshot);
    const connected = hasCompleteSnapshot(snapshot);
    const adaptive = getAdaptiveSignals(snapshot);
    const observations = rememberObservation(instrument, snapshot);
    const optionsRead = getOptionsRead(snapshot, adaptive);
    return `
        <article class="ai-insight-card ${connected ? "is-connected" : "is-pending"}">
            <header class="ai-card-head">
                <div>
                    <small>${instrument === "SENSEX" ? "BSE Index" : "NSE Index / Options Watch"}</small>
                    <h3>${instrument}</h3>
                </div>
                <span>${connected ? "Adaptive model live" : "Awaiting feed"}</span>
            </header>
            ${renderTimeframeRail(snapshot)}
            ${renderGreeksPanel(snapshot, optionsRead)}
            <div class="insight-decision-grid">
                <div><small>Trend / Direction</small><strong>${adaptive.trend} · ${getDirection(snapshot)}</strong></div>
                <div><small>Volatility</small><strong>${formatMetric(adaptive.realizedVolatility, "%")} realized · VIX ${formatMetric(snapshot?.vix)}</strong></div>
                <div><small>Divergence</small><strong>${escapeHtml(snapshot?.divergence || adaptive.divergence)}</strong></div>
                <div><small>Support / Resistance</small><strong>${levels.support} / ${levels.resistance}</strong></div>
                <div><small>Possible Entry / Exit</small><strong>${connected ? `${levels.entry}. ${levels.exit}.` : "Withheld until live inputs are connected"}</strong></div>
                <div><small>Adaptive Memory</small><strong>${observations ? `${observations} verified observations` : "Awaiting feed"}</strong></div>
            </div>
        </article>
    `;
}

function renderTradingTools() {
    return `
        <section class="trading-tools-console">
            <div class="ai-insight-heading compact">
                <div>
                    <span>Trading Toolkit</span>
                    <h2>Required options tools & calculators</h2>
                    <p>Functional calculators for disciplined pre-trade checks across position sizing, breakeven, pivots, premium stress, risk/reward, and theta decay.</p>
                </div>
            </div>
            <div data-trading-tools></div>
        </section>
    `;
}

function renderAiInsights(container) {
    const snapshots = getRuntimeSnapshots();
    container.innerHTML = `
        <div class="ai-insight-heading">
            <div>
                <span>AI Market Intelligence</span>
                <h2>Self-learning options insight console</h2>
                <p>Compact 15m, 1h, and daily decision-support signals evaluate delayed benchmark history, trend, volatility, divergence, VIX, support, resistance, and options-regime risk. Licensed Greeks/OI/PCR remain connector-gated so the platform does not display invented live Greeks.</p>
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
                <strong>Licensed F&O connector status</strong>
                <span>Ready for option-chain Greeks, OI, PCR, build-up and expiry analytics</span>
            </div>
            <p>Until a licensed NSE/BSE option-chain source is connected, Srishti Wealth uses benchmark and VIX-based options context while keeping live Greeks and contract OI/PCR clearly marked as pending.</p>
            <a href="https://www.nseindia.com/market-data/analytical-products" target="_blank" rel="noopener noreferrer">Review NSE analytical products</a>
        </div>
        ${renderTradingTools()}
        <p class="ai-insight-note">Delayed market history is used for adaptive scenarios, not guaranteed predictions. Verify entries, exits, Greeks, OI, PCR, and strikes with approved market-data sources before trading.</p>
    `;
    window.initializeTradingTools?.();
}

function renderAiMarketPulse() {
    const badge = document.getElementById("pulse-badge");
    if (!badge) return;

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
        title.textContent = "Connect verified market feeds to activate Market Pulse.";
        text.textContent = "Market Pulse withholds sentiment, predictions, and trade levels until verified NSE/BSE inputs are available.";
        benchmarks.textContent = "Awaiting feed";
        commodities.textContent = "Official MCX link";
        risk.textContent = "Not scored";
        icon.style.color = "#6d37cf";
        icon.innerHTML = '<svg viewBox="0 0 64 64"><path d="M18 22h28"></path><path d="M18 32h20"></path><path d="M18 42h14"></path><path d="M46 38v10"></path><path d="M41 43h10"></path></svg>';
        return;
    }

    const positiveCount = snapshots.filter((snapshot) => snapshot.close > snapshot.previousClose).length;
    const isConstructive = positiveCount >= Math.ceil(snapshots.length / 2);
    badge.className = `pulse-badge ${isConstructive ? "bullish" : "bearish"}`;
    badge.textContent = isConstructive ? "Constructive Bias" : "Defensive Bias";
    title.textContent = isConstructive ? "Verified benchmark inputs indicate constructive participation." : "Verified benchmark inputs indicate a defensive market posture.";
    text.textContent = "Market Pulse is generated from connected runtime snapshots. Review the insight cards and official exchange sources before acting.";
    benchmarks.textContent = `${snapshots.length} connected`;
    commodities.textContent = "Official MCX link";
    risk.textContent = isConstructive ? "Measured" : "Elevated";
    icon.style.color = isConstructive ? "#0c7a52" : "#c5364f";
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
