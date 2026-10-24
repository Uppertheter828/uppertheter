  "use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#030712", color: "#f9fafb", paddingTop: "90px", paddingBottom: "80px", paddingLeft: "16px", paddingRight: "16px", fontFamily: "'Inter', sans-serif" }}>
      <Navbar isConnected={isConnected} setIsConnected={setIsConnected} isWalletModalOpen={isWalletModalOpen} setIsWalletModalOpen={setIsWalletModalOpen} />

      <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* HEADER */}
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#10b981", fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", textTransform: "uppercase" }}>24/7 PROTOCOL SUPPORT</span>
          <h1 style={{ fontSize: "36px", fontWeight: "900", margin: "8px 0" }}>Contact Support</h1>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Get instant help through our Telegram Bot, official email, or by submitting a support ticket below.</p>
        </div>

        {/* QUICK SUPPORT OPTIONS (Telegram Bot & Email) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          
          {/* Telegram Bot Card */}
          <a
            href="https://t.me/uppertheter_help_bot" 
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#0d131f",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
              textDecoration: "none",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "24px" }}>🤖</div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#10b981", margin: 0 }}>Telegram Bot</h3>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Instant automated assistance & query resolution.</p>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#10b981", marginTop: "4px" }}>Open Bot →</span>
          </a>

          {/* Email Support Card */}
          <a
            href="mailto:uppertheter@support.com"
            style={{
              backgroundColor: "#0d131f",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
              textDecoration: "none",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "24px" }}>✉️</div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", margin: 0 }}>Email Support</h3>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>uppertheter@support.com</p>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#10b981", marginTop: "4px" }}>Send Email →</span>
          </a>

        </div>

        {/* CONTACT FORM */}
        <form onSubmit={handleSubmit} style={{ padding: "32px", borderRadius: "24px", backgroundColor: "#0d131f", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>Submit a Support Ticket</h2>
          
          <div>
            <label style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "700", display: "block", marginBottom: "6px" }}>Wallet Address / User ID</label>
            <input type="text" required placeholder="0x... or ID #66" style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#030712", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "700", display: "block", marginBottom: "6px" }}>Your Email (for reply)</label>
            <input type="email" required placeholder="name@example.com" style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#030712", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "700", display: "block", marginBottom: "6px" }}>Message / Inquiry</label>
            <textarea rows={4} required placeholder="Describe your issue or question..." style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#030712", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", resize: "none" }} />
          </div>

          <button type="submit" style={{ backgroundColor: "#10b981", color: "#030712", fontWeight: "900", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", marginTop: "8px" }}>
            {submitted ? "Message Sent Successfully! ✓" : "Send Support Request"}
          </button>
        </form>
      </div>
    </div>
  );
}