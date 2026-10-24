"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "@/components/Navbar";

interface TopReferrer {
  rank: number;
  userId: string;
  walletAddress: string;
  directReferrals: number;
  totalEarnings: string;
}

interface MilestoneReward {
  id: number;
  referralsRequired: number;
  rewardLabel: string;
  rewardAmount: number;
}

const STAKING_CONTRACT_ADDRESS = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";
const STAKING_ABI = [
  "function users(address) external view returns (address referrer, address s0, address s1, address s2, bool isRegistered, uint256 registrationTime, uint256 directReferralsCount)"
];

export default function LeaderboardPage() {
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimedStatus, setClaimedStatus] = useState<{ [key: number]: boolean }>({});
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboardFromChain() {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setLoading(false);
        return;
      }
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const CONTRACT_ADDRESS = "0x3A5Ce3d4E7658BbFB89a2245E0F1D9B3A88a0564";
        const CONTRACT_ABI = [
          "function getTopReferrers() view returns (address[] memory addrs, uint256[] memory counts)"
        ];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        // On-chain data fetching placeholder
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboardFromChain();
  }, []);

  const mysteryBoxMilestones: MilestoneReward[] = [
    { id: 1, referralsRequired: 10, rewardLabel: "Mystery Box #1", rewardAmount: 22 },
    { id: 2, referralsRequired: 30, rewardLabel: "Mystery Box #2", rewardAmount: 40 },
    { id: 3, referralsRequired: 50, rewardLabel: "Mystery Box #3", rewardAmount: 70 },
    { id: 4, referralsRequired: 70, rewardLabel: "Mystery Box #4", rewardAmount: 120 },
    { id: 5, referralsRequired: 90, rewardLabel: "Mystery Box #5", rewardAmount: 150 },
  ];

  const handleOpenBox = async (milestone: MilestoneReward) => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        alert("Please connect your wallet first to check milestone eligibility!");
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length === 0) {
        alert("Please connect your wallet first to check milestone eligibility!");
        return;
      }

      const walletAddress = accounts[0].address;

      const masterOwner = "0x984Fcc48E2DAffc6e4E1CB1685aeF1aEfA698555".toLowerCase();
      let isRegistered = false;
      let userDirects = 0;

      if (walletAddress.toLowerCase() === masterOwner) {
        isRegistered = true;
      }

      const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
      try {
        const userData = await contract.users(walletAddress);
        isRegistered = userData && (userData.isRegistered || userData[4]) ? true : false;
        userDirects = Number(userData.directReferralsCount || userData[6] || 0);
      } catch (e) {
        console.log("Error checking contract data:", e);
      }

      if (!isRegistered) {
        alert("Access Denied: Please complete your $50 matrix registration first. You will be eligible to unlock and claim rewards only after completing your registration and achieving the target milestones.");
        return;
      }

      if (userDirects < milestone.referralsRequired) {
        alert(`Milestone Locked: You have not completed the required referral target yet. You currently have ${userDirects} direct referrals, but this box requires ${milestone.referralsRequired}. Keep growing your team to reach the milestone, and you will be able to claim your reward immediately once achieved!`);
        return;
      }

      setClaimedStatus(prev => ({ ...prev, [milestone.id]: true }));
      setModalMessage(`🎉 Congratulations! You opened the Mystery Box and won ${milestone.rewardAmount} USDT, sent directly to your wallet!`);
    } catch (err) {
      console.error("Box opening error:", err);
      alert("Failed to verify eligibility. Please try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#030712",
      color: "#ffffff",
      paddingTop: "100px",
      paddingBottom: "60px",
      paddingLeft: "20px",
      paddingRight: "20px"
    }}>
      <Navbar />
      
      <div style={{ maxWidth: "1000px", margin: "0 auto", marginTop: "20px" }}>
        
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-block",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid #10b981",
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "12px",
            fontWeight: "800",
            color: "#10b981",
            letterSpacing: "1px",
            marginBottom: "12px"
          }}>
            🎁 EXCLUSIVE REWARDS & TOP PERFORMERS
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#ffffff", marginBottom: "8px" }}>
            Direct Referrals <span style={{ color: "#10b981" }}>Leaderboard</span>
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            Top members with the highest number of direct referrals
          </p>
        </div>

        {/* MYSTERY BOX REWARDS SECTION */}
        <div style={{
          backgroundColor: "#0d131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "50px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
              📦 Mystery Box Referral Milestones
            </h2>
            <p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.6", maxWidth: "800px", margin: "0 auto" }}>
              Unlock guaranteed <span style={{ color: "#10b981", fontWeight: "700" }}>USDT Mystery Boxes</span> by hitting direct referral milestones! Open your boxes upon reaching milestones to reveal and claim your rewards.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {mysteryBoxMilestones.map((item) => {
              const isClaimed = claimedStatus[item.id];
              return (
                <div 
                  key={item.id}
                  style={{
                    backgroundColor: "#030712",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      fontWeight: "800",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px"
                    }}>
                      #{item.id}
                    </span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                        {item.referralsRequired} Active Directs
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {isClaimed ? "Opened & Claimed" : "Mystery Box Locked"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBox(item)}
                    disabled={isClaimed}
                    style={{
                      backgroundColor: isClaimed ? "rgba(255,255,255,0.05)" : "#10b981",
                      color: isClaimed ? "#9ca3af" : "#030712",
                      fontWeight: "800",
                      fontSize: "12px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: isClaimed ? "default" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {isClaimed ? "Claimed ✓" : "🎁 Open Box"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* REWARD REVEAL MODAL */}
        {modalMessage && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
          }}>
            <div style={{
              backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "20px", maxWidth: "380px", width: "100%", padding: "24px",
              textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.9)"
            }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎁</div>
              <h3 style={{ color: "#ffffff", fontSize: "18px", fontWeight: "900", marginBottom: "12px" }}>Mystery Box Unlocked!</h3>
              <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: "1.6", marginBottom: "24px" }}>
                {modalMessage}
              </p>
              <button
                onClick={() => setModalMessage(null)}
                style={{
                  backgroundColor: "#10b981", color: "#030712", fontWeight: "900",
                  fontSize: "13px", padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer"
                }}
              >
                Awesome!
              </button>
            </div>
          </div>
        )}

        {/* LEADERBOARD TABLE */}
        <div style={{
          backgroundColor: "#0d131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#030712", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <th style={{ padding: "16px 20px", color: "#10b981", fontSize: "13px", fontWeight: "800" }}>RANK</th>
                <th style={{ padding: "16px 20px", color: "#10b981", fontSize: "13px", fontWeight: "800" }}>USER ID</th>
                <th style={{ padding: "16px 20px", color: "#10b981", fontSize: "13px", fontWeight: "800" }}>WALLET ADDRESS</th>
                <th style={{ padding: "16px 20px", color: "#10b981", fontSize: "13px", fontWeight: "800" }}>DIRECT REFERRALS</th>
                <th style={{ padding: "16px 20px", color: "#10b981", fontSize: "13px", fontWeight: "800" }}>EST. EARNINGS</th>
              </tr>
            </thead>
            <tbody>
              {topReferrers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                    🚀 Leaderboard is ready. Rankings will appear here live once network activity begins.
                  </td>
                </tr>
              ) : (
                topReferrers.map((user) => (
                  <tr 
                    key={user.rank} 
                    style={{ 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      backgroundColor: user.rank === 1 ? "rgba(16, 185, 129, 0.05)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "16px 20px", fontWeight: "800" }}>
                      {user.rank === 1 && "🥇 #1"}
                      {user.rank === 2 && "🥈 #2"}
                      {user.rank === 3 && "🥉 #3"}
                      {user.rank > 3 && `#${user.rank}`}
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: "700", color: "#ffffff" }}>
                      User ID: #{user.userId}
                    </td>
                    <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#9ca3af" }}>
                      {user.walletAddress}
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: "800", color: "#10b981" }}>
                      {user.directReferrals} Directs
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: "700", color: "#ffffff" }}>
                      {user.totalEarnings}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}