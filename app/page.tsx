"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ethers } from "ethers";

// Demo/Placeholder ABI for USDT ERC20/BEP20 Transfer/Approve
const USDT_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

// Matrix Contract ABI with public view for ID checking
const MATRIX_CONTRACT_ABI = [
  "function activatePackage(uint256 packageId) public payable",
  "function buyTier(uint256 tierAmount) public",
  "function userList(uint256) public view returns (address)",
  "function users(address) public view returns (address referrer, address[3] seniors, bool isRegistered)"
];

const MATRIX_CONTRACT_ADDRESS = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export default function HomePage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);

  // State for 5-second red warning message inside Connect Wallet modal
  const [showConnectWarning, setShowConnectWarning] = useState(false);

  // State for QR Code view inside Wallet Modal
  const [showQrCode, setShowQrCode] = useState(false);

  // PUBLIC ID SEARCH STATE FOR TRANSPARENCY
  const [searchUserId, setSearchUserId] = useState("");
  const [searchError, setSearchError] = useState("");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Auto-hide warning message after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConnectWarning) {
      timer = setTimeout(() => {
        setShowConnectWarning(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showConnectWarning]);

  // Handler for dashboard navigation / protection
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      e.preventDefault();
      setShowConnectWarning(true);
      setShowQrCode(false);
      setIsWalletModalOpen(true);
    } else {
      router.push("/dashboard");
    }
  };

  // HANDLER FOR STAKE USDT NOW BUTTONS
  const handleStakeClick = () => {
    if (!isConnected) {
      setShowConnectWarning(true);
      setShowQrCode(false);
      setIsWalletModalOpen(true);
    } else {
      router.push("/dashboard?tab=stake");
    }
  };

  // PUBLIC TRANSPARENCY ID SEARCH HANDLER CONNECTED TO BLOCKCHAIN
  const handlePublicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    const cleanId = searchUserId.trim().replace("#", "");

    if (!cleanId) {
      setSearchError("Please enter a valid User ID number.");
      return;
    }

    const idNumber = parseInt(cleanId, 10);

    if (isNaN(idNumber) || idNumber < 1) {
      setSearchError("Invalid User ID! Please enter a positive number.");
      return;
    }

    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(MATRIX_CONTRACT_ADDRESS, MATRIX_CONTRACT_ABI, provider);
        
        // Array index starts from 0 (ID #1 is at index 0)
        const walletAddr = await contract.userList(idNumber - 1);
        
        if (walletAddr && walletAddr !== ethers.ZeroAddress) {
          router.push(`/dashboard?viewAddress=${walletAddr}`);
          return;
        } else {
          setSearchError(`Invalid User ID #${idNumber}! This ID does not exist in the matrix yet.`);
          return;
        }
      } else {
        // Fallback if ethereum provider is not injected
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
        const contract = new ethers.Contract(MATRIX_CONTRACT_ADDRESS, MATRIX_CONTRACT_ABI, provider);
        const walletAddr = await contract.userList(idNumber - 1);

        if (walletAddr && walletAddr !== ethers.ZeroAddress) {
          router.push(`/dashboard?viewAddress=${walletAddr}`);
          return;
        } else {
          setSearchError(`Invalid User ID #${idNumber}! This ID does not exist in the matrix yet.`);
          return;
        }
      }
    } catch (err) {
      console.error("Public ID lookup error:", err);
      setSearchError(`Invalid User ID #${idNumber}! This ID does not exist in the matrix yet.`);
    }
  };

  // MATRIX PACKAGES DATA ($50 ONLY)
  const matrixPackages = [
    {
      id: 1,
      priceNumber: 50,
      price: "$50",
      tier: "Starter Tier",
      desc: "Low-barrier entry to test the ecosystem with full access to direct sponsor and pool distributions.",
      isPopular: false,
      breakdown: [
        "40% Direct Sponsor ($20 USDT)",
        "20% Passive Pool ($10 USDT)",
        "20% Reward & Mystery Box ($10 USDT)",
        "15% 3 Level Senior ($7.5 USDT)",
        "5% Maintenance Fees ($2.5 USDT)"
      ]
    },
  ];

  // 100% USDT DISTRIBUTION DATA
  const distributionData = [
    {
      percentage: "40%",
      title: "Direct Sponsor Income",
      desc: "Instant payout directly routed to your direct inviter's wallet address upon network activation.",
      color: "#10b981",
      bgGlow: "rgba(16, 185, 129, 0.15)"
    },
    {
      percentage: "20%",
      title: "Global Passive Pool",
      desc: "Distributed among active matrix participants through automated Smart Contract pool triggers.",
      color: "#06b6d4",
      bgGlow: "rgba(6, 182, 212, 0.15)"
    },
    {
      percentage: "20%",
      title: "Rewards & Mystery Box",
      desc: "Allocated to active performance leaderboards and randomized instant mystery bonus boxes.",
      color: "#8b5cf6",
      bgGlow: "rgba(139, 92, 246, 0.15)"
    },
    {
      percentage: "15%",
      title: "3-Level Senior Pool",
      desc: "Split across 3 upper levels of your referral hierarchy to incentivize upline mentorship.",
      color: "#f59e0b",
      bgGlow: "rgba(245, 158, 11, 0.15)"
    },
    {
      percentage: "5%",
      title: "Protocol Infrastructure",
      desc: "Dedicated to continuous smart contract audits, server maintenance, and gas optimization.",
      color: "#ec4899",
      bgGlow: "rgba(236, 72, 153, 0.15)"
    }
  ];

  // STAKING VAULTS DATA
  const stakingVaults = [
    {
      days: "90-Day",
      badge: "FLEXIBLE STAKING",
      badgeColor: "#06b6d4",
      desc: "Short-term automated arbitrage vault designed for immediate liquid yields.",
      roi: "18% - 22% ROI"
    },
    {
      days: "180-Day",
      badge: "BALANCED GROWER",
      badgeColor: "#10b981",
      desc: "Medium-term quantitative yield strategy capturing market spread inefficiencies.",
      roi: "38% - 42% ROI"
    },
    {
      days: "365-Day",
      badge: "MAXIMUM YIELD",
      badgeColor: "#8b5cf6",
      desc: "Long-term high-frequency execution vault for optimized compounding returns.",
      roi: "87% - 93% ROI"
    }
  ];

  // TRADING FEATURES
  const tradingFeatures = [
    {
      icon: "⚡",
      title: "Sub-Millisecond Arbitrage",
      desc: "High-frequency algorithms execute simultaneous trades across top CEXs & DEXs, capturing instant price differences."
    },
    {
      icon: "🛡️",
      title: "Delta-Neutral Risk Model",
      desc: "Trading operations use delta-neutral hedging strategies to generate steady returns regardless of market volatility."
    },
    {
      icon: "🔗",
      title: "On-Chain Transparency",
      desc: "All vault distributions and smart contract execution logs are 100% verified and auditable on BscScan."
    }
  ];

  // 8 WEB3 FAQs
  const faqList = [
    {
      q: "What is the Web3 Yield Protocol & Matrix Network?",
      a: "It is a fully decentralized Web3 ecosystem built on the Binance Smart Chain (BSC). It combines automated 100% USDT smart contract matrix distribution with high-frequency quantitative yield vaults."
    },
    {
      q: "How does the 100% USDT Matrix Distribution work?",
      a: "When a user activates a $50 package, 100% of the funds are instantly split on-chain by the smart contract: 40% to Direct Sponsor, 20% to Passive Pool, 20% to Mystery Rewards, 15% to 3-Level Senior, and 5% to Protocol Maintenance."
    },
    {
      q: "How are the Quantitative Algo-Trading ROI returns generated?",
      a: "Staked capital is deployed into high-frequency, delta-neutral arbitrage algorithms operating across major exchanges (Binance, Bybit) and DEX liquidity pools to capture risk-free market price differences."
    },
    {
      q: "Do I need to deposit funds into a centralized wallet?",
      a: "No. The protocol operates in a non-custodial manner. All referral commissions and matrix rewards are paid out instantly and directly to your Web3 wallet address."
    },
    {
      q: "Which Web3 wallets are supported?",
      a: "You can connect using Trust Wallet, TokenPocket, or MetaMask via BEP-20 network integration."
    },
    {
      q: "What is the Public ID Search transparency feature?",
      a: "Public ID Search allows anyone to view the verified structure, performance, and volume of any ID on the network in View-Only mode, ensuring 100% operational transparency without exposing private keys."
    },
    {
      q: "Are the smart contracts fully audited and verified?",
      a: "Yes, our smart contract logic is verified on BscScan with immutable execution rules, eliminating admin backdoors and ensuring zero human intervention."
    }
  ];

  return (
    <div style={{ backgroundColor: "#030712", color: "#ffffff", minHeight: "100vh" }}>
      <Navbar />

      {/* HERO SECTION */}
      <section style={{ padding: "100px 16px 60px 16px", textAlign: "center" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
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
            display: "inline-block"
          }}>
            DECENTRALIZED MATRIX & YIELD PROTOCOL
          </span>

          <h1 style={{ 
            fontSize: "52px", 
            fontWeight: "900", 
            margin: "24px 0 16px 0", 
            color: "#ffffff", 
            letterSpacing: "-1px",
            lineHeight: "1.15",
            maxWidth: "900px",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Next-Gen Algorithmic Yield & Peer-to-Peer Network
          </h1>
          
          <p style={{ color: "#9ca3af", fontSize: "16px", maxWidth: "720px", margin: "0 auto 36px auto", lineHeight: "1.6" }}>
            Transparent smart-contract ecosystem with automated USDT distribution, community pools, and quantitative trading vaults.
          </p>

          <button
            onClick={handleDashboardClick}
            style={{
              padding: "16px 36px",
              borderRadius: "14px",
              backgroundColor: "#10b981",
              color: "#030712",
              fontWeight: "800",
              fontSize: "16px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            Go to Dashboard →
          </button>
        </div>
      </section>

      {/* PACKAGES SECTION */}
      <section style={{ padding: "40px 16px 80px 16px", textAlign: "center" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "900", margin: "0 0 12px 0", color: "#ffffff", letterSpacing: "-0.5px" }}>
            Choose Your Matrix Package
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "15px", maxWidth: "600px", margin: "0 auto 40px auto", lineHeight: "1.5" }}>
            Activate your tier to unlock instant 100% smart contract peer-to-peer distribution and yield vault access.
          </p>

          {/* ONE PACKAGES GRID ($50 ONLY) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", maxWidth: "800px", margin: "0 auto" }}>
            {matrixPackages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: "#0d131f",
                  borderRadius: "24px",
                  padding: "32px 24px",
                  border: pkg.isPopular ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                  textAlign: "left",
                  position: "relative",
                  boxShadow: pkg.isPopular ? "0 10px 30px rgba(16, 185, 129, 0.2)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                {pkg.isPopular && (
                  <span style={{
                    position: "absolute",
                    top: "-12px",
                    right: "24px",
                    backgroundColor: "#10b981",
                    color: "#030712",
                    fontSize: "11px",
                    fontWeight: "900",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    textTransform: "uppercase"
                  }}>
                    Most Popular
                  </span>
                )}

                <div>
                  <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "800", textTransform: "uppercase" }}>{pkg.tier}</div>
                  <div style={{ fontSize: "42px", fontWeight: "900", color: "#ffffff", margin: "8px 0" }}>{pkg.price} <span style={{ fontSize: "14px", color: "#6b7280" }}>USDT</span></div>
                  <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px", lineHeight: "1.5" }}>{pkg.desc}</p>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", marginBottom: "24px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", marginBottom: "10px", textTransform: "uppercase" }}>Distribution Breakdown:</div>
                    {pkg.breakdown.map((item, bIdx) => (
                      <div key={bIdx} style={{ fontSize: "13px", color: "#d1d5db", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#10b981" }}>✓</span> {item}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStakeClick}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "none",
                    backgroundColor: pkg.isPopular ? "#10b981" : "rgba(255, 255, 255, 0.1)",
                    color: pkg.isPopular ? "#030712" : "#ffffff",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Activate {pkg.price} Package →
                </button>
              </div>
            ))}
          </div>

          {/* PUBLIC TRANSPARENCY SEARCH BAR */}
          <div style={{ marginTop: "60px", maxWidth: "600px", margin: "60px auto 0 auto", backgroundColor: "#0d131f", padding: "28px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "8px" }}>🔍 Public Network Transparency Search</h3>
            <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>Enter any User ID to inspect public on-chain performance in View-Only mode.</p>
            
            <form onSubmit={handlePublicSearch} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Enter User ID (e.g. 1)"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#030712",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  outline: "none",
                  fontSize: "14px"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  backgroundColor: "#10b981",
                  color: "#030712",
                  fontWeight: "800",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Inspect ID
              </button>
            </form>
            {searchError && <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "10px", textAlign: "left" }}>{searchError}</div>}
          </div>
        </div>
      </section>

      {/* 100% USDT DISTRIBUTION BREAKDOWN SECTION */}
      <section style={{ padding: "80px 16px", backgroundColor: "#090d16", borderTop: "1px solid rgba(255, 255, 255, 0.05)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", textAlign: "center" }}>
          <span style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "1.5px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            textTransform: "uppercase",
            display: "inline-block"
          }}>
            TRANSPARENT SMART CONTRACT
          </span>

          <h2 style={{ fontSize: "36px", fontWeight: "900", margin: "16px 0 8px 0", color: "#ffffff" }}>
            100% USDT Matrix Distribution
          </h2>

          <p style={{ color: "#9ca3af", fontSize: "15px", maxWidth: "600px", margin: "0 auto 48px auto" }}>
            Matrix activation is split instantly on-chain by the smart contract with 0% admin retention.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {distributionData.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#0d131f",
                  border: `1px solid ${item.color}33`,
                  borderRadius: "20px",
                  padding: "28px 24px",
                  textAlign: "left",
                  boxShadow: `0 4px 20px ${item.bgGlow}`
                }}
              >
                <div style={{ fontSize: "38px", fontWeight: "900", color: item.color, marginBottom: "8px" }}>
                  {item.percentage}
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: "1.5", margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALGORITHMIC STAKING VAULTS SECTION */}
      <section style={{ padding: "80px 16px", backgroundColor: "#030712" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", textAlign: "center" }}>
          <span style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "1.5px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            textTransform: "uppercase",
            display: "inline-block"
          }}>
            QUANTITATIVE YIELD VAULTS
          </span>

          <h2 style={{ fontSize: "36px", fontWeight: "900", margin: "16px 0 8px 0", color: "#ffffff" }}>
            Algorithmic Crypto Staking Plans
          </h2>

          <p style={{ color: "#9ca3af", fontSize: "15px", maxWidth: "600px", margin: "0 auto 48px auto" }}>
            Lock USDT into automated yield vaults to earn real daily returns generated through low-risk market arbitrage.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {stakingVaults.map((vault, idx) => (
              <div key={idx} style={{
                backgroundColor: "#0d131f",
                borderRadius: "24px",
                padding: "32px 24px",
                border: `1px solid ${vault.badgeColor}44`,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: vault.badgeColor, backgroundColor: `${vault.badgeColor}15`, padding: "4px 12px", borderRadius: "20px", border: `1px solid ${vault.badgeColor}33` }}>
                      {vault.badge}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>🔒 {vault.days} Lock</span>
                  </div>

                  <h3 style={{ fontSize: "24px", fontWeight: "900", color: "#ffffff", marginBottom: "6px" }}>{vault.days} Vault</h3>
                  <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: "1.5", marginBottom: "20px" }}>{vault.desc}</p>

                  <div style={{ backgroundColor: "#030712", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Estimated Return</div>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#10b981", marginTop: "4px" }}>{vault.roi}</div>
                  </div>
                </div>

                <button 
                  onClick={handleStakeClick}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#10b981",
                    color: "#030712",
                    fontWeight: "800",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Stake USDT Now →
                </button>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "32px",
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "16px",
            padding: "16px 20px",
            fontSize: "13px",
            color: "#9ca3af",
            textAlign: "left"
          }}>
            <strong style={{ color: "#ffffff" }}>🛡️ Capital Breakdown:</strong> 90% goes directly into the Automated Algorithmic Trading Wallet for real market yield generation, 5% to Direct Senior Sponsor, and 5% to Protocol Maintenance Fees.
          </div>
        </div>
      </section>

      {/* VIP ALGO TRADING ROI REVENUE SECTION */}
      <section style={{ padding: "90px 16px", backgroundColor: "#030712" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{
            padding: "48px 32px",
            borderRadius: "28px",
            backgroundColor: "rgba(13, 19, 31, 0.8)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "250px",
              height: "250px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              filter: "blur(80px)",
              borderRadius: "50%",
              pointerEvents: "none"
            }} />

            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <span style={{
                backgroundColor: "rgba(6, 182, 212, 0.1)",
                color: "#06b6d4",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1.5px",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                textTransform: "uppercase",
                display: "inline-block"
              }}>
                HOW WE GENERATE YOUR ROI
              </span>

              <h2 style={{ fontSize: "36px", fontWeight: "900", margin: "16px 0 12px 0", color: "#ffffff" }}>
                Powered by AI Quantitative Algo-Trading
              </h2>

              <p style={{ color: "#9ca3af", fontSize: "15px", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" }}>
                We generate your returns through genuine high-frequency quantitative trading across Binance, Bybit, and DEX liquidity pools, rather than relying on speculative or unsustainable models.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              {tradingFeatures.map((feat, idx) => (
                <div key={idx} style={{
                  backgroundColor: "#030712",
                  padding: "28px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <div style={{ fontSize: "32px" }}>{feat.icon}</div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", margin: 0 }}>{feat.title}</h3>
                  <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: "1.6", margin: 0 }}>{feat.desc}</p>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "40px",
              padding: "20px",
              borderRadius: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "20px",
              textAlign: "center"
            }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#10b981" }}>Profitable Win Rate</div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Arbitrage Win Rate</div>
              </div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#06b6d4" }}>24/7/365</div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Automated Execution</div>
              </div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#8b5cf6" }}>0% Risk</div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Directional Market Exposure</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* INTERACTIVE FAQ SECTION */}
      <section style={{ padding: "80px 16px", backgroundColor: "#090d16" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", border: "1px solid rgba(16, 185, 129, 0.3)", display: "inline-block" }}>
              GOT QUESTIONS?
            </span>
            <h2 style={{ fontSize: "32px", fontWeight: "900", color: "#ffffff", marginTop: "16px" }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqList.map((faq, fIdx) => (
              <div 
                key={fIdx}
                onClick={() => setOpenFaq(openFaq === fIdx ? null : fIdx)}
                style={{
                  backgroundColor: "#0d131f",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  transition: "border 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "800", color: "#ffffff", fontSize: "15px" }}>
                  <span>{faq.q}</span>
                  <span style={{ color: "#10b981", fontSize: "18px" }}>{openFaq === fIdx ? "−" : "+"}</span>
                </div>
                {openFaq === fIdx && (
                  <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6", margin: "12px 0 0 0" }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORPORATE & CEO INFO SECTION */}
      <section style={{ padding: "40px 16px", backgroundColor: "#060911", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#10b981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Chief Executive Officer</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#ffffff" }}>David Henry</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#06b6d4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Global Corporate Headquarters</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#d1d5db" }}>140 Broadway, New York, NY 10005, USA</div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer style={{ padding: "40px 16px", backgroundColor: "#030712", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center", fontSize: "13px", color: "#6b7280" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div>© 2026 Web3 Yield Protocol. All rights reserved.</div>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>BscScan Verified Contract</a>
            <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Audit Report</a>
            <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}