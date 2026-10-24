"use client";

import React, { useState } from "react";

export default function StakingCalculator() {
  // Available Staking Plans
  const plans = [
    { days: 90, roiPercentage: 20, label: "90 Days Lock (20% EST. ROI)" },
    { days: 180, roiPercentage: 42, label: "180 Days Lock (42% EST. ROI)" },
    { days: 365, roiPercentage: 90, label: "365 Days Lock (90% EST. ROI)" },
  ];

  const [selectedPlan, setSelectedPlan] = useState(plans[0]); // Default: 90 Days
  const [depositAmount, setDepositAmount] = useState<number>(50);

  // Calculations
  const estimatedYield = (depositAmount * selectedPlan.roiPercentage) / 100;
  const totalReturn = depositAmount + estimatedYield;

  return (
    <section style={{ padding: "80px 16px", backgroundColor: "#030712", color: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        {/* SUB-HEADER BADGE */}
        <span
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "1.5px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            textTransform: "uppercase",
            display: "inline-block",
            marginBottom: "16px",
          }}
        >
          QUANTITATIVE YIELD
        </span>

        {/* MAIN TITLE */}
        <h2 style={{ fontSize: "36px", fontWeight: "900", margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>
          Staking Vault Calculator
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 auto 40px auto" }}>
          Calculate your algorithmic trading returns based on lockup period and amount.
        </p>

        {/* CALCULATOR MAIN BOX */}
        <div
          style={{
            backgroundColor: "#0d131f",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "24px",
            padding: "32px 24px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* PLAN TABS (3 PLANS) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
              backgroundColor: "#030712",
              padding: "6px",
              borderRadius: "14px",
              marginBottom: "32px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            {plans.map((plan) => {
              const isActive = selectedPlan.days === plan.days;
              return (
                <button
                  key={plan.days}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: isActive ? "#10b981" : "transparent",
                    color: isActive ? "#030712" : "#9ca3af",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {plan.label}
                </button>
              );
            })}
          </div>

          {/* SLIDER BOX */}
          <div
            style={{
              backgroundColor: "#030712",
              padding: "24px",
              borderRadius: "18px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>Deposit Amount:</span>
              <span style={{ fontSize: "28px", fontWeight: "900", color: "#10b981" }}>
                ${depositAmount.toLocaleString()} USDT
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="10000"
              step="50"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#10b981",
                cursor: "pointer",
                height: "6px",
                borderRadius: "3px",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", marginTop: "10px" }}>
              <span>Min: $50 USDT</span>
              <span>Max: $10,000 USDT</span>
            </div>
          </div>

          {/* CALCULATED OUTPUT CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {/* Principal */}
            <div
              style={{
                backgroundColor: "#030712",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>Principal Capital</div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff" }}>
                ${depositAmount.toLocaleString()} USDT
              </div>
            </div>

            {/* Estimated Yield */}
            <div
              style={{
                backgroundColor: "#030712",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                Estimated Yield ({selectedPlan.roiPercentage}%)
              </div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#10b981" }}>
                +${estimatedYield.toFixed(2)} USDT
              </div>
            </div>

            {/* Total Return */}
            <div
              style={{
                backgroundColor: "#030712",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                Total Return ({selectedPlan.days} Days)
              </div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#38bdf8" }}>
                ${totalReturn.toFixed(2)} USDT
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}