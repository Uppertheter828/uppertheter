"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface NavbarProps {
  userId?: string;
  isConnected?: boolean;
  setIsConnected?: React.Dispatch<React.SetStateAction<boolean>>;
  isWalletModalOpen?: boolean;
  setIsWalletModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onConnectClick?: () => void;
}

export default function Navbar({ 
  userId = "1", 
  isConnected, 
  setIsConnected, 
  isWalletModalOpen, 
  setIsWalletModalOpen, 
  onConnectClick 
}: NavbarProps) {
  const contractAddress = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [connectedState, setConnectedState] = useState<boolean>(false);
  
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [gasPrice, setGasPrice] = useState<string>("3.5");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem("connected_wallet_address");
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setConnectedState(true);
      if (setIsConnected) setIsConnected(true);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem("connected_wallet_address");
    setWalletAddress("");
    setConnectedState(false);
    if (setIsConnected) setIsConnected(false);
    setShowProfileDropdown(false);
    triggerToast("🔌 Disconnected securely.");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`📋 ${label} copied!`);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const navLinks = [
    { name: "🏠 Home", href: "/" },
    { name: "🚀 Register / Join Matrix", href: "/register" },
    { name: "⚡ Dashboard", href: "/dashboard" },
    { name: "📊 Matrix Plan", href: "/plan" },
    { name: "🌊 Passive Pool", href: "/passive-pool" },
    { name: "🏆 Leaderboard", href: "/leaderboard" },
    { name: "🧮 Staking Calculator", href: "/calculator" },
    { name: "📞 Contact Us", href: "/contact" },
  ];

  return (
    <>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          backgroundColor: "rgba(16, 185, 129, 0.95)", color: "#030712", padding: "10px 18px",
          borderRadius: "12px", fontWeight: "800", fontSize: "12px", whiteSpace: "nowrap",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)", backdropFilter: "blur-md"
        }}>
          {toastMessage}
        </div>
      )}

      {/* TOP TRANSPARENCY BAR */}
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100%", zIndex: 51,
        backgroundColor: "#02050f", borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        height: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 8px", fontSize: "9px", color: "#9ca3af", overflowX: "auto", whiteSpace: "nowrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 5px #10b981" }}></span>
            BSC Mainnet
          </span>
          <span>⛽ {gasPrice} Gwei</span>
        </div>
        <div>
          <a 
            href={`https://bscscan.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#10b981", textDecoration: "none", fontWeight: "700" }}
          >
            Contract ↗
          </a>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <header style={{
        position: "fixed", top: "24px", left: 0, width: "100%", zIndex: 50,
        backgroundColor: "rgba(3, 7, 18, 0.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)", height: "56px",
        display: "flex", alignItems: "center"
      }}>
        <div style={{
          maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "0 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          {/* BRAND LOGO (LEFT) */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#10b981", fontWeight: "900", fontSize: "12px"
            }}>
              ▲
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                UPPER<span style={{ color: "#10b981" }}>THETER</span>
              </span>
              <span style={{ display: "block", fontSize: "6px", color: "#10b981", fontWeight: "700", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                DECENTRALIZED
              </span>
            </div>
          </Link>

          {/* RIGHT ACTIONS: HAMBURGER (RIGHT SIDE) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            
            {connectedState && (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <div 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", padding: "4px 8px",
                    fontWeight: "800", fontSize: "10px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "flex-end"
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                    {formatAddress(walletAddress)} ▾
                  </span>
                </div>

                {showProfileDropdown && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, width: "220px",
                    backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "16px", boxShadow: "0 15px 30px rgba(0,0,0,0.9)", padding: "8px",
                    zIndex: 101, display: "flex", flexDirection: "column", gap: "4px"
                  }}>
                    <button 
                      onClick={() => copyToClipboard(walletAddress, "Wallet Address")}
                      style={{
                        width: "100%", padding: "8px 10px", background: "none", border: "none",
                        color: "#ffffff", fontSize: "12px", fontWeight: "600", textAlign: "left",
                        borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                      }}
                    >
                      <span>📋</span> Copy Full Address
                    </button>

                    <Link 
                      href="/dashboard"
                      onClick={() => setShowProfileDropdown(false)}
                      style={{
                        width: "100%", padding: "8px 10px", color: "#ffffff", fontSize: "12px", fontWeight: "600",
                        textDecoration: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px"
                      }}
                    >
                      <span>⚡</span> Dashboard
                    </Link>

                    <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "2px 0" }}></div>

                    <button 
                      onClick={handleDisconnect}
                      style={{
                        width: "100%", padding: "8px 10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "#ef4444", fontSize: "12px", fontWeight: "700", textAlign: "left",
                        borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                      }}
                    >
                      <span>🚪</span> Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsNavOpen(true)}
              style={{
                backgroundColor: "#0d131f", border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff", width: "32px", height: "32px", borderRadius: "8px",
                fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION DRAWER */}
      {isNavOpen && (
        <div onClick={() => setIsNavOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)", zIndex: 99 }} />
      )}

      <div style={{
        position: "fixed", top: 0, right: isNavOpen ? 0 : "-280px", width: "280px", height: "100vh",
        backgroundColor: "#030712", borderLeft: "1px solid rgba(255, 255, 255, 0.08)", zIndex: 100,
        padding: "20px", transition: "right 0.3s ease-in-out", display: "flex", flexDirection: "column",
        justifyContent: "space-between", boxShadow: "-10px 0 30px rgba(0,0,0,0.8)"
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: "900", color: "#10b981", letterSpacing: "1px" }}>MENU</span>
            <button onClick={() => setIsNavOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "18px", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
            {navLinks.map((link, idx) => {
              const isRegister = link.href === "/register";
              return (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={() => setIsNavOpen(false)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", borderRadius: "10px", 
                    backgroundColor: isRegister ? "rgba(16, 185, 129, 0.15)" : "#0d131f",
                    border: isRegister ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.05)", 
                    color: isRegister ? "#10b981" : "#ffffff",
                    textDecoration: "none", fontWeight: "700", fontSize: "13px"
                  }}
                >
                  <span>{link.name}</span>
                  <span style={{ color: "#10b981", fontSize: "11px" }}>→</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#6b7280", fontSize: "10px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
          © UPPERTHETER Protocol
        </div>
      </div>
    </>
  );
}