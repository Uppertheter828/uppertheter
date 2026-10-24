"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

const CONTRACT_ADDRESS = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";
const ABI = [
  "function users(address) external view returns (address referrer, bool isRegistered, uint256 registrationTime, uint256 directReferralsCount)",
  "function hasStaked(address) external view returns (bool)"
];

const DAY = 86400;
const UNLOCK_DAYS = 60;     // registration ke baad wait
const MINTING_DAYS = 150;   // unlock ke baad itne din me $60 poora
const TOTAL_REWARD = 60;

export default function PassivePoolPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [info, setInfo] = useState<{ regTime: number; hasReferral: boolean; staked: boolean } | null>(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    load();
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth) return;
      const provider = new ethers.BrowserProvider(eth);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) return;
      setConnected(true);

      const addr = accounts[0].address;
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const u = await c.users(addr);
      if (!u.isRegistered) return;
      const staked = await c.hasStaked(addr);

      setRegistered(true);
      setInfo({
        regTime: Number(u.registrationTime),
        hasReferral: Number(u.directReferralsCount) > 0,
        staked
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const box = { backgroundColor: "#0d131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px" } as const;

  if (loading) {
    return <div style={{ background: "#030712", minHeight: "100vh", color: "#10b981", padding: 100, textAlign: "center" }}>Loading...</div>;
  }

  if (!connected || !registered || !info) {
    return (
      <div style={{ background: "#030712", minHeight: "100vh", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <div style={{ ...box, maxWidth: 480, textAlign: "center" }}>
          <h2 style={{ color: "#ef4444" }}>Registration Required</h2>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Connect your registered wallet to view the Passive Pool reward tracker.</p>
          <button onClick={() => router.push("/register")} style={{ background: "#10b981", border: "none", borderRadius: 12, padding: 14, fontWeight: 900, cursor: "pointer" }}>
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  const unlockTime = info.regTime + UNLOCK_DAYS * DAY;
  const endTime = unlockTime + MINTING_DAYS * DAY;
  const eligible = !info.hasReferral && !info.staked;

  let minted = 0;
  if (eligible && now > unlockTime) {
    minted = TOTAL_REWARD * Math.min(now - unlockTime, endTime - unlockTime) / (endTime - unlockTime);
  }
  const completed = eligible && now >= endTime;
  const waiting = eligible && now < unlockTime;
  const daysToUnlock = Math.ceil((unlockTime - now) / DAY);
  const progress = Math.min(100, (minted / TOTAL_REWARD) * 100);
  const fmt = (t: number) => new Date(t * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  let status = "Minting Active";
  if (!eligible) status = "Not Eligible";
  else if (waiting) status = `Unlocks in ${daysToUnlock} day(s)`;
  else if (completed) status = "Completed - Payout Pending";

  return (
    <div style={{ background: "#030712", color: "#fff", minHeight: "100vh", paddingBottom: 80 }}>
      <Navbar />
      <section style={{ padding: "100px 16px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, margin: "0 0 12px" }}>Passive Pool Reward Tracker</h1>
          <p style={{ color: "#9ca3af", fontSize: 14, maxWidth: 700, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Register, then stay without any direct referral or staking for {UNLOCK_DAYS} days. Your ${TOTAL_REWARD} USDT
            reward then builds up over {MINTING_DAYS} days. After completion, the team sends the payout to your wallet manually.
          </p>

          {!eligible ? (
            <div style={{ ...box, border: "1px solid rgba(239,68,68,0.3)" }}>
              <h3>Not Eligible</h3>
              <p style={{ color: "#9ca3af", fontSize: 13 }}>
                Passive Pool is only for IDs with no direct referral and no staking.
                {info.hasReferral && " This ID has a direct referral."}
                {info.staked && " This ID has staked."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
                <div style={{ ...box, textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 800 }}>REGISTERED ON</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>{fmt(info.regTime)}</div>
                </div>
                <div style={{ ...box, textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 800 }}>MINTING STARTS</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>{fmt(unlockTime)}</div>
                </div>
                <div style={{ ...box, textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 800 }}>MINTING COMPLETES</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>{fmt(endTime)}</div>
                </div>
              </div>

              <div style={{ ...box, textAlign: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#10b981", fontFamily: "monospace" }}>
                  ${minted.toFixed(6)} <span style={{ fontSize: 18, color: "#9ca3af" }}>/ ${TOTAL_REWARD}.00 USDT</span>
                </div>
                <div style={{ height: 12, background: "#030712", borderRadius: 10, overflow: "hidden", margin: "16px 0" }}>
                  <div style={{ width: `${progress}%`, background: "#10b981", height: "100%" }} />
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>
                  Progress: {progress.toFixed(2)}% | Status: <span style={{ color: "#38bdf8" }}>{status}</span>
                </div>

                {completed && (
                  <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.3)", color: "#facc15", fontSize: 13, fontWeight: 700 }}>
                    Minting complete. Your ${TOTAL_REWARD} USDT payout will be sent manually to your wallet by the team.
                  </div>
                )}

                <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 12, lineHeight: 1.6 }}>
                  ⚠️ Rule: If this ID makes any direct referral or any staking at any time
                  before the payout is sent, the Passive Pool reward is cancelled and the
                  minted amount resets to $0. This cannot be reversed.
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}