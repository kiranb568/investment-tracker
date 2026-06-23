function calculatorMarkup(instanceId = "main") {
    const field = (name, label, value = "", type = "number") => `
        <label>
            <span>${label}</span>
            <input type="${type}" data-tool-input="${name}" value="${value}" step="any">
        </label>
    `;

    return `
        <div class="calculator-console" data-tool-instance="${instanceId}">
            <article class="calculator-card" data-calculator="position">
                <h3>Position Size</h3>
                <p>Calculate quantity from capital, risk %, entry and stop.</p>
                <div class="calculator-fields">
                    ${field("capital", "Capital", "100000")}
                    ${field("riskPercent", "Risk %", "1")}
                    ${field("entry", "Entry", "100")}
                    ${field("stop", "Stop", "95")}
                </div>
                <output data-tool-output>Adjust values to calculate.</output>
            </article>
            <article class="calculator-card" data-calculator="breakeven">
                <h3>Options Breakeven</h3>
                <p>Calculate call and put breakeven from strike and premium.</p>
                <div class="calculator-fields">
                    <label>
                        <span>Option Type</span>
                        <select data-tool-input="optionType">
                            <option value="call">Call</option>
                            <option value="put">Put</option>
                        </select>
                    </label>
                    ${field("strike", "Strike", "24000")}
                    ${field("premium", "Premium", "120")}
                </div>
                <output data-tool-output>Adjust values to calculate.</output>
            </article>
            <article class="calculator-card" data-calculator="riskReward">
                <h3>Risk / Reward</h3>
                <p>Compare entry, stop and target before trade approval.</p>
                <div class="calculator-fields">
                    ${field("entry", "Entry", "100")}
                    ${field("stop", "Stop", "95")}
                    ${field("target", "Target", "112")}
                </div>
                <output data-tool-output>Adjust values to calculate.</output>
            </article>
            <article class="calculator-card" data-calculator="pivot">
                <h3>Pivot Levels</h3>
                <p>Generate pivot, S1/S2 and R1/R2 from verified OHLC.</p>
                <div class="calculator-fields">
                    ${field("high", "High", "102")}
                    ${field("low", "Low", "96")}
                    ${field("close", "Close", "100")}
                </div>
                <output data-tool-output>Adjust values to calculate.</output>
            </article>
            <article class="calculator-card" data-calculator="premiumStress">
                <h3>Premium Stress</h3>
                <p>Model 10%, 20%, and 30% premium decay/expansion.</p>
                <div class="calculator-fields">
                    ${field("premium", "Premium", "120")}
                    ${field("lotSize", "Lot Size", "50")}
                </div>
                <output data-tool-output>Adjust values to calculate.</output>
            </article>
            <article class="calculator-card" data-calculator="theta">
                <h3>Theta Clock</h3>
                <p>Estimate premium decay by days to expiry.</p>
                <div class="calculator-fields">
                    ${field("premium", "Premium", "120")}
                    ${field("theta", "Theta / Day", "8")}
                    ${field("days", "Days", "3")}
                </div>
                <output data-tool-output>Adjust values to calculate.</output>
            </article>
        </div>
    `;
}

function toNumber(card, name) {
    const value = card.querySelector(`[data-tool-input="${name}"]`)?.value;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
}

function money(value) {
    return Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "--";
}

function calculateCard(card) {
    const type = card.dataset.calculator;
    const output = card.querySelector("[data-tool-output]");
    if (!output) return;

    if (type === "position") {
        const capital = toNumber(card, "capital");
        const riskPercent = toNumber(card, "riskPercent");
        const entry = toNumber(card, "entry");
        const stop = toNumber(card, "stop");
        const riskPerUnit = Math.abs(entry - stop);
        const riskAmount = capital * (riskPercent / 100);
        const qty = riskPerUnit > 0 ? Math.floor(riskAmount / riskPerUnit) : 0;
        output.textContent = `Risk ₹${money(riskAmount)} · Qty ${money(qty)} · Risk/unit ₹${money(riskPerUnit)}`;
    }

    if (type === "breakeven") {
        const optionType = card.querySelector('[data-tool-input="optionType"]')?.value || "call";
        const strike = toNumber(card, "strike");
        const premium = toNumber(card, "premium");
        const breakeven = optionType === "call" ? strike + premium : strike - premium;
        output.textContent = `${optionType.toUpperCase()} breakeven: ${money(breakeven)}`;
    }

    if (type === "riskReward") {
        const entry = toNumber(card, "entry");
        const stop = toNumber(card, "stop");
        const target = toNumber(card, "target");
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        const ratio = risk > 0 ? reward / risk : 0;
        output.textContent = `Risk ${money(risk)} · Reward ${money(reward)} · R:R 1:${money(ratio)}`;
    }

    if (type === "pivot") {
        const high = toNumber(card, "high");
        const low = toNumber(card, "low");
        const close = toNumber(card, "close");
        const pivot = (high + low + close) / 3;
        const r1 = (2 * pivot) - low;
        const s1 = (2 * pivot) - high;
        const r2 = pivot + (high - low);
        const s2 = pivot - (high - low);
        output.textContent = `P ${money(pivot)} · R1 ${money(r1)} · S1 ${money(s1)} · R2 ${money(r2)} · S2 ${money(s2)}`;
    }

    if (type === "premiumStress") {
        const premium = toNumber(card, "premium");
        const lotSize = toNumber(card, "lotSize");
        output.textContent = `-10% ₹${money(premium * 0.9 * lotSize)} · -20% ₹${money(premium * 0.8 * lotSize)} · +20% ₹${money(premium * 1.2 * lotSize)}`;
    }

    if (type === "theta") {
        const premium = toNumber(card, "premium");
        const theta = toNumber(card, "theta");
        const days = toNumber(card, "days");
        const projected = Math.max(0, premium - (theta * days));
        output.textContent = `Projected premium ₹${money(projected)} · Estimated decay ₹${money(premium - projected)}`;
    }
}

function initializeTradingTools() {
    document.querySelectorAll("[data-trading-tools]").forEach((container, index) => {
        if (!container.dataset.toolsReady) {
            container.innerHTML = calculatorMarkup(container.id || `tools-${index}`);
            container.dataset.toolsReady = "true";
        }
        container.querySelectorAll(".calculator-card").forEach(calculateCard);
    });
}

document.addEventListener("input", (event) => {
    const card = event.target.closest?.(".calculator-card");
    if (card) calculateCard(card);
});

document.addEventListener("change", (event) => {
    const card = event.target.closest?.(".calculator-card");
    if (card) calculateCard(card);
});

document.addEventListener("DOMContentLoaded", initializeTradingTools);
window.initializeTradingTools = initializeTradingTools;
