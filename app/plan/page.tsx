"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";
const CONTRACT_ABI = [
  "function getTotalUsers() external view returns (uint256)",
  "event MatrixActivated(address indexed user, address indexed referrer)"
];

export default function MatrixPlanPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [todayActivations, setTodayActivations] = useState<number>(0);
  const [yesterdayActivations, setYesterdayActivations] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      let provider;
      if (typeof window !== "undefined" && (window as any).ethereum) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
      } else {
        provider = new ethers.JsonRpcProvider("https://bsc-rpc.publicnode.com");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const total = await contract.getTotalUsers();
      const totalNum = Number(total);
      setTotalUsers(totalNum);

      if (totalNum === 0) {
        setLoadingStats(false);
        return;
      }

      const currentBlock = await provider.getBlockNumber();
      const filter = contract.filters.MatrixActivated();
      
      let events: any[] = [];
      const totalBlocksToScan = 70000;
      const chunkSize = 5000;
      
      for (let start = Math.max(0, currentBlock - totalBlocksToScan); start < currentBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize, currentBlock);
        try {
          const chunkEvents = await contract.queryFilter(filter, start, end);
          events.push(...chunkEvents);
        } catch (chunkErr) {}
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const last24HoursSec = nowSec - 86400;     
      const prev24HoursSec = nowSec - 172800;    

      let tCount = 0;
      let yCount = 0;

      for (const event of events) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          if (block && block.timestamp) {
            const ts = Number(block.timestamp);
            if (ts >= last24HoursSec) {
              tCount++;
            } else if (ts >= prev24HoursSec && ts < last24HoursSec) {
              yCount++;
            }
          }
        } catch (e) {}
      }

      setTodayActivations(tCount);
      setYesterdayActivations(yCount);
    } catch (err) {
      console.error("Error fetching blockchain data:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#030712", color: "#ffffff", minHeight: "100vh", paddingBottom: "80px" }}>
      <Navbar />

      <section style={{ padding: "100px 16px 40px 16px", textAlign: "center" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <span style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            padding: "8px 20px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "1.5px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            textTransform: "uppercase",
            display: "inline-block",
            marginBottom: "16px"
          }}>
            DECENTRALIZED PROTOCOL STRUCTURE
          </span>

          <h1 style={{ fontSize: "42px", fontWeight: "900", margin: "0 0 16px 0", color: "#ffffff", letterSpacing: "-1px" }}>
            Matrix Plan & Distribution Logic
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "15px", maxWidth: "700px", margin: "0 auto 40px auto", lineHeight: "1.6" }}>
            Explore how the Uppertheter Protocol securely splits every $50 USDT tier activation instantly on-chain with zero admin retention.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <div style={{ backgroundColor: "#0d131f", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "20px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "800", textTransform: "uppercase" }}>Total Registered Users</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#10b981", margin: "8px 0 4px 0" }}>
                {loadingStats ? "..." : totalUsers}
              </div>
              <div style={{ fontSize: "10px", color: "#38bdf8", fontWeight: "700" }}>Verified On-Chain</div>
            </div>

            <div style={{ backgroundColor: "#0d131f", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "20px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "800", textTransform: "uppercase" }}>Today's Activations</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#ffffff", margin: "8px 0 4px 0" }}>
                {loadingStats ? "..." : `+${todayActivations}`}
              </div>
              <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "700" }}>Active Today</div>
            </div>

            <div style={{ backgroundColor: "#0d131f", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "20px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "800", textTransform: "uppercase" }}>Yesterday's Activations</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#ffffff", margin: "8px 0 4px 0" }}>
                {loadingStats ? "..." : `+${yesterdayActivations}`}
              </div>
              <div style={{ fontSize: "10px", color: "#facc15", fontWeight: "700" }}>Previous Day</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}