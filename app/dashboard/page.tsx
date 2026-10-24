"use client";

import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const STAKING_CONTRACT_ADDRESS = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";
const MASTER_OWNER = "0x984Fcc48E2DAffc6e4E1CB1685aeF1aEfA698555";

const USDT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const STAKING_ABI = [
  "function stake(uint256 _amount, uint256 _lockupDays) external",
  "function withdrawStake(uint256 _stakeIndex) external",
  "function getUserStakesCount(address _user) external view returns (uint256)",
  "function userStakes(address, uint256) external view returns (uint256 amount, uint256 startTime, uint256 lockupDuration, uint256 expectedRoiAmount, bool isWithdrawn)",
  "function users(address) external view returns (address referrer, bool isRegistered, uint256 registrationTime, uint256 directReferralsCount)",
  "function getSeniors(address _user) external view returns (address[3])",
  "function getTotalUsers() external view returns (uint256)",
  "function userList(uint256) external view returns (address)",
  "event MatrixActivated(address indexed user, address indexed referrer, uint256 timestamp)",
  "event Staked(address indexed user, uint256 indexed stakeIndex, uint256 amount, uint256 duration, uint256 timestamp)",
  "event StakeWithdrawn(address indexed user, uint256 indexed stakeIndex, uint256 totalPayout, uint256 timestamp)"
];

export default function DashboardPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [userBalance, setUserBalance] = useState("0.00");
  const [userName, setUserName] = useState("Active Member");
  const [userId, setUserId] = useState("#Member");
  const [numericId, setNumericId] = useState(""); 
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("Active Member");
  
  const [stakeAmount, setStakeAmount] = useState(100);
  const [selectedDuration, setSelectedDuration] = useState(180);
  const [selectedRoi, setSelectedRoi] = useState(45);
  
  const [isStaking, setIsStaking] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeVaults, setActiveVaults] = useState<any[]>([]);
  const [realTimeYield, setRealTimeYield] = useState(0);
  const [totalStaked, setTotalStaked] = useState("0.00");

  const [directReferralsCount, setDirectReferralsCount] = useState(0);
  const [level2Count, setLevel2Count] = useState(0);
  const [level3Count, setLevel3Count] = useState(0);
  const [level4Count, setLevel4Count] = useState(0);

  const [teamVolume, setTeamVolume] = useState("0.00");
  const [directCommission, setDirectCommission] = useState("0.00");
  const [matrixIncome, setMatrixIncome] = useState("0.00");
  const [payoutLedger, setPayoutLedger] = useState<any[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          router.push("/register");
        } else {
          window.location.reload();
        }
      };
      const handleChainChanged = () => window.location.reload();

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
          (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const saveUserName = () => {
    if (tempName.trim() && account) {
      setUserName(tempName.trim());
      localStorage.setItem(`user_profile_name_${account.toLowerCase()}`, tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && account) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
        localStorage.setItem(`user_profile_photo_${account.toLowerCase()}`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const checkDashboardAccess = async () => {
      try {
        if (typeof window === "undefined" || !(window as any).ethereum) {
          router.push("/register");
          return;
        }
        const _provider = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(_provider);

        const network = await _provider.getNetwork();
        if (Number(network.chainId) !== 56) {
          try {
            await (window as any).ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x38" }],
            });
          } catch (err) {
            alert("Please switch your wallet network to Binance Smart Chain (BSC Mainnet).");
            return;
          }
        }

        const accounts = await _provider.listAccounts();
        if (accounts.length === 0) {
          router.push("/register");
          return;
        }

        const connectedAddr = accounts[0].address;
        setConnectedWallet(connectedAddr);
        
        const _signer = await _provider.getSigner();
        setSigner(_signer);

        const urlParams = new URLSearchParams(window.location.search);
        const viewAddressParam = urlParams.get("viewAddress");

        let targetWallet = connectedAddr;
        if (viewAddressParam && ethers.isAddress(viewAddressParam)) {
          targetWallet = viewAddressParam;
          setIsViewOnly(true);
        } else {
          setIsViewOnly(false);
        }

        setAccount(targetWallet);

        const savedName = localStorage.getItem(`user_profile_name_${targetWallet.toLowerCase()}`);
        if (savedName) {
          setUserName(savedName);
          setTempName(savedName);
        } else {
          setUserName("Active Member");
          setTempName("Active Member");
        }

        const savedPhoto = localStorage.getItem(`user_profile_photo_${targetWallet.toLowerCase()}`);
        if (savedPhoto) {
          setProfileImage(savedPhoto);
        } else {
          setProfileImage(null);
        }

        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, _provider);

        // Optimized Single Loop to fetch Total Users & Numeric ID safely
        let computedId = "#Member";
        let rawNumId = "";
        try {
          const total = await stakingContract.getTotalUsers();
          for (let i = 0; i < Number(total); i++) {
            const addr = await stakingContract.userList(i);
            if (addr.toLowerCase() === targetWallet.toLowerCase()) {
              rawNumId = (i + 1).toString();
              computedId = `#${rawNumId}`;
              break;
            }
          }
        } catch (e) {
          console.log("Error fetching user index:", e);
        }
        setNumericId(rawNumId);

        if (viewAddressParam) {
          setUserId(`View: ${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)} (${computedId})`);
        } else {
          if (targetWallet.toLowerCase() === MASTER_OWNER.toLowerCase()) {
            setUserId("#1 | Master Protocol Owner");
            if (!localStorage.getItem(`user_profile_name_${targetWallet.toLowerCase()}`)) {
              setUserName("David Henry");
              setTempName("David Henry");
            }
          } else {
            setUserId(computedId !== "#Member" ? computedId : `Member (${targetWallet.slice(0, 6)}...)`);
          }
        }
        
        await fetchUserData(targetWallet, _provider);
      } catch (err) {
        console.error("Dashboard guard error:", err);
      }
    };
    checkDashboardAccess();
  }, []);

  const getFutureDateString = (days: number) => {
    if (!isMounted) return "Loading...";
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    if (activeVaults.length === 0) return;
    const interval = setInterval(() => {
      const nowSec = Date.now() / 1000;
      let totalAccumulatedYield = 0;
      
      activeVaults.forEach(v => {
        if (v.status === "Locked" && !v.isWithdrawn) {
          const amt = Number(v.rawAmount);
          const roiPercentage = v.roiVal;
          const durationSecs = v.durationDays * 24 * 60 * 60;
          const totalProfit = amt * roiPercentage;
          const ratePerSec = totalProfit / durationSecs;
          const elapsed = Math.min(nowSec - v.startTimeSec, durationSecs);
          if (elapsed > 0) {
            totalAccumulatedYield += ratePerSec * elapsed;
          }
        }
      });

      setRealTimeYield(totalAccumulatedYield);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeVaults]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask or Trust Wallet!");
      return;
    }
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
      await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect wallet or switch network to BSC.");
    }
  };

  const fetchUserData = async (walletAddress: string, _provider: any) => {
    try {
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, _provider);
      const balance = await usdtContract.balanceOf(walletAddress);
      setUserBalance(ethers.formatUnits(balance, 18));

      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, _provider);
      
      let directs = 0;
      let l2 = 0;
      let l3 = 0;
      let l4 = 0;
      let directAddresses: Set<string> = new Set();
      let level2Addresses: Set<string> = new Set();
      let level3Addresses: Set<string> = new Set();

      try {
        const totalUsers = await stakingContract.getTotalUsers();
        const totalNum = Number(totalUsers);
        
        let allUsersMap: { [addr: string]: string } = {};
        let userListArray: string[] = [];

        for (let i = 0; i < totalNum; i++) {
          try {
            const addr = await stakingContract.userList(i);
            const uData = await stakingContract.users(addr);
            const ref = uData.referrer || uData[0];
            allUsersMap[addr.toLowerCase()] = ref.toLowerCase();
            userListArray.push(addr.toLowerCase());

            if (ref.toLowerCase() === walletAddress.toLowerCase()) {
              directs++;
              directAddresses.add(addr.toLowerCase());
            }
          } catch (e) {}
        }

        userListArray.forEach((addr) => {
          const ref = allUsersMap[addr];
          if (ref) {
            if (directAddresses.has(ref)) {
              l2++;
              level2Addresses.add(addr);
            } else if (level2Addresses.has(ref)) {
              l3++;
              level3Addresses.add(addr);
            } else if (level3Addresses.has(ref)) {
              l4++;
            }
          }
        });
      } catch (err) {
        console.log("Team network scan error:", err);
      }

      setDirectReferralsCount(directs);
      setLevel2Count(l2);
      setLevel3Count(l3);
      setLevel4Count(l4);

      const directCommVal = directs * 20;
      const matrixIncVal = (l2 * 2.5) + (l3 * 2.5) + (l4 * 2.5);
      setDirectCommission(directCommVal.toFixed(2));
      setMatrixIncome(matrixIncVal.toFixed(2));

      const stakesCount = await stakingContract.getUserStakesCount(walletAddress);
      let vaults = [];
      let totalStakedSum = 0;
      let initialYieldSum = 0;
      let ledgerEvents: any[] = [];
      const nowSec = Math.floor(Date.now() / 1000);

      // Fetch Staking Deposits & Withdrawals Events for Ledger
      try {
        const withdrawFilter = stakingContract.filters.StakeWithdrawn(walletAddress);
        const withdrawEvents = await stakingContract.queryFilter(withdrawFilter, 0, "latest");
        withdrawEvents.forEach((ev: any) => {
          const evTime = Number(ev.args?.timestamp || 0);
          const evAmt = Number(ethers.formatUnits(ev.args?.amount || 0, 18));
          ledgerEvents.push({
            type: "Stake Claimed / Withdrawn",
            from: `Vault Payout`,
            level: "Staking Return",
            amount: `+$${evAmt.toFixed(2)}`,
            time: new Date(evTime * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            timestamp: evTime
          });
        });
      } catch (e) {
        console.log("Withdraw event fetch error:", e);
      }

      for (let i = 0; i < Number(stakesCount); i++) {
        const stake = await stakingContract.userStakes(walletAddress, i);
        const amountNum = Number(ethers.formatUnits(stake.amount, 18));
        const startTime = Number(stake.startTime);
        const duration = Number(stake.lockupDuration);
        const maturityTime = startTime + duration;
        const expectedRoiNum = Number(ethers.formatUnits(stake.expectedRoiAmount, 18));

        if (!stake.isWithdrawn && nowSec > startTime) {
          const elapsedSecs = Math.min(nowSec - startTime, duration);
          const earnedSoFar = (expectedRoiNum / duration) * elapsedSecs;
          initialYieldSum += earnedSoFar;
        }

        let status = "Locked";
        if (stake.isWithdrawn || nowSec >= maturityTime) {
          status = "Closed / Matured";
        } else {
          totalStakedSum += amountNum;
        }

        vaults.push({
          vaultId: `STK-${1000 + i}`,
          stakeIndex: i,
          rawAmount: amountNum,
          amount: amountNum.toFixed(2),
          durationDays: duration / 86400,
          duration: `${duration / 86400} Days`,
          roiVal: expectedRoiNum / amountNum,
          estReturn: `${(amountNum + expectedRoiNum).toFixed(2)} USDT`,
          stakedDate: new Date(startTime * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          maturityDate: new Date(maturityTime * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: status,
          isWithdrawn: stake.isWithdrawn,
          isMatured: nowSec >= maturityTime,
          startTimeSec: startTime
        });

        ledgerEvents.push({
          type: "Staking Deposit Vault",
          from: `Vault STK-${1000 + i}`,
          level: "Staking Pool",
          amount: `-$${amountNum.toFixed(2)}`,
          time: new Date(startTime * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          timestamp: startTime
        });
      }

      ledgerEvents.sort((a, b) => b.timestamp - a.timestamp);

      setActiveVaults(vaults);
      setTotalStaked(totalStakedSum.toFixed(2));
      setRealTimeYield(initialYieldSum);
      setTeamVolume((totalStakedSum + (directs * 50) + (l2 * 50) + (l3 * 50) + (l4 * 50)).toFixed(2));
      setPayoutLedger(ledgerEvents);
    } catch (err) {
      console.error("Error fetching blockchain data:", err);
    }
  };

  const copyReferralId = () => {
    const refValue = numericId ? numericId : account;
    navigator.clipboard.writeText(window.location.origin + "/register?ref=" + refValue);
    alert("Referral Link copied to clipboard!");
  };

  const handleDepositAndStake = async () => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        alert("Wallet not found.");
        return;
      }
      const freshProvider = new ethers.BrowserProvider((window as any).ethereum);
      const freshSigner = await freshProvider.getSigner();
      const currentSignerAddress = await freshSigner.getAddress();

      const network = await freshProvider.getNetwork();
      if (Number(network.chainId) !== 56) {
        alert("Please switch your wallet network to Binance Smart Chain (BSC Mainnet).");
        return;
      }

      if (stakeAmount < 50 || stakeAmount > 10000) {
        alert("Please select a stake amount between $50 and $10,000 USDT.");
        return;
      }

      setIsStaking(true);

      const parsedAmount = ethers.parseUnits(stakeAmount.toString(), 18);
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, freshSigner);

      const allowance = await usdtContract.getFunction("allowance")(currentSignerAddress, STAKING_CONTRACT_ADDRESS);
      if (allowance < parsedAmount) {
        const approveTx = await usdtContract.getFunction("approve")(STAKING_CONTRACT_ADDRESS, parsedAmount, { gasLimit: 100000 });
        await approveTx.wait();
      }

      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, freshSigner);
      const stakeTx = await stakingContract.getFunction("stake")(parsedAmount, selectedDuration, { gasLimit: 500000 });
      await stakeTx.wait();

      alert("Staking Successful! Vault updated.");
      fetchUserData(currentSignerAddress, freshProvider);
    } catch (error: any) {
      console.error("Staking failed:", error);
      alert("Transaction failed or cancelled: " + (error?.reason || error?.message));
    } finally {
      setIsStaking(false);
    }
  };

  const handleWithdraw = async (stakeIndex: number) => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        alert("Wallet not found.");
        return;
      }
      const freshProvider = new ethers.BrowserProvider((window as any).ethereum);
      const freshSigner = await freshProvider.getSigner();
      const currentSignerAddress = await freshSigner.getAddress();

      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, freshSigner);
      const tx = await stakingContract.withdrawStake(stakeIndex, { gasLimit: 500000 });
      await tx.wait();
      alert("Stake withdrawn successfully!");
      fetchUserData(currentSignerAddress, freshProvider);
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal failed: " + (error?.reason || error?.message));
    }
  };

  return (
    <div style={{ backgroundColor: "#030712", minHeight: "100vh", color: "#ffffff", padding: "24px 16px", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* TOP MAIN NAVBAR */}
        <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", backgroundColor: "#10b981", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", color: "#030712", fontSize: "14px" }}>▲</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "900", letterSpacing: "1px", color: "#ffffff" }}>UPPERTHETER</div>
              <div style={{ fontSize: "9px", color: "#10b981", fontWeight: "800", letterSpacing: "0.5px" }}>DECENTRALIZED</div>
            </div>
          </div>
          <button onClick={() => router.push("/register")} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>
            ← Register New ID
          </button>
        </div>

        {/* USER PROFILE HEADER BAR */}
        <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", width: "100%", maxWidth: "700px" }}>
            
            <div 
              onClick={() => !isViewOnly && fileInputRef.current?.click()}
              style={{ width: "68px", height: "68px", borderRadius: "14px", background: profileImage ? `url(${profileImage}) center/cover no-repeat` : "linear-gradient(135deg, #10b981, #047857)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "22px", color: "#030712", cursor: isViewOnly ? "default" : "pointer", border: "2px solid #10b981", position: "relative", overflow: "hidden", flexShrink: 0 }}
              title={isViewOnly ? "View-Only Profile" : "Click to change profile photo"}
            >
              {!profileImage && "👤"}
              {!isViewOnly && <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: "none" }} />}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {isEditingName ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input 
                      type="text" 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)}
                      style={{ background: "#030712", border: "1px solid #10b981", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "14px" }}
                    />
                    <button onClick={saveUserName} style={{ background: "#10b981", color: "#030712", border: "none", padding: "4px 10px", borderRadius: "6px", fontWeight: "800", cursor: "pointer" }}>Save</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: "17px", fontWeight: "900", color: "#ffffff" }}>{userName}</span>
                    {!isViewOnly && (
                      <button onClick={() => setIsEditingName(true)} style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }} title="Edit Name">✏️</button>
                    )}
                  </>
                )}
                <span style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "900" }}>{userId}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af", wordBreak: "break-all" }}>
                Wallet: <span style={{ color: "#10b981", fontWeight: "700" }}>{account || "Not Connected"}</span> ({userBalance} USDT)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={copyReferralId} style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff", padding: "11px 18px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>
              🔗 Copy Referral Link
            </button>
            <button onClick={connectWallet} style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#10b981", padding: "11px 18px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>
              BSC Mainnet
            </button>
          </div>
        </div>

        {/* 5 METRIC STATS CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px" }}>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>TOTAL STAKED</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", margin: "6px 0 4px 0" }}>${totalStaked}</div>
            <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "800" }}>▲ Active Vaults</div>
          </div>

          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "16px", padding: "18px" }}>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>EST. LIVE YIELD</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#10b981", margin: "6px 0 4px 0" }}>+${realTimeYield.toFixed(6)}</div>
            <div style={{ fontSize: "10px", color: "#facc15", fontWeight: "800" }}>⚡ Real-Time Streaming</div>
          </div>

          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px" }}>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>DIRECT COMMISSION</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", margin: "6px 0 4px 0" }}>${directCommission}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700" }}>◆ {directReferralsCount} Direct Referrals</div>
          </div>

          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px" }}>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>MATRIX LEVEL INCOME</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", margin: "6px 0 4px 0" }}>${matrixIncome}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700" }}>◆ Team Earnings</div>
          </div>

          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px" }}>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>TOTAL EARNINGS</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", margin: "6px 0 4px 0" }}>${(Number(directCommission) + Number(matrixIncome)).toFixed(2)}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700" }}>Cumulative Revenue</div>
          </div>
        </div>

        {/* DEPOSIT & STAKE SECTION */}
        <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "20px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "900", color: "#ffffff" }}>Deposit Into Staking Vault</h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "11px", color: "#9ca3af" }}>Lock USDT securely into decentralized smart contract vaults on BSC. Range: $50 to $10,000 USDT.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>SELECT STAKE AMOUNT ($50 - $10,000)</span>
                  <span style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981", padding: "2px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "900" }}>{stakeAmount} USDT</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>

              <div>
                <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800", marginBottom: "8px" }}>SELECT DURATION & EST. ROI PLAN</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "10px" }}>
                  {[
                    { days: 90, label: "20% Est. ROI", val: 20 },
                    { days: 180, label: "42% Est. ROI", val: 42 },
                    { days: 365, label: "90% Est. ROI", val: 90 }
                  ].map((p) => (
                    <div
                      key={p.days}
                      onClick={() => { setSelectedDuration(p.days); setSelectedRoi(p.val); }}
                      style={{
                        backgroundColor: selectedDuration === p.days ? "rgba(16, 185, 129, 0.12)" : "#0f1a36",
                        border: `1px solid ${selectedDuration === p.days ? "#10b981" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "12px", padding: "14px 8px", textAlign: "center", cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: "900", color: "#ffffff" }}>{p.days} Days</div>
                      <div style={{ fontSize: "10px", fontWeight: "900", color: "#10b981", margin: "4px 0" }}>{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "#ffffff", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                VAULT SUMMARY
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "#9ca3af" }}>Lock Duration:</span>
                <span style={{ fontWeight: "800", color: "#ffffff" }}>{selectedDuration} Days</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "#9ca3af" }}>Est. Profit:</span>
                <span style={{ fontWeight: "800", color: "#10b981" }}>+${(stakeAmount * (selectedRoi / 100)).toFixed(2)} USDT</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "#9ca3af" }}>Maturity Date:</span>
                <span style={{ fontWeight: "800", color: "#ffffff" }}>{getFutureDateString(selectedDuration)}</span>
              </div>

              {isViewOnly ? (
                <div style={{ textAlign: "center", color: "#facc15", fontSize: "11px", fontWeight: "800", padding: "12px", background: "rgba(250, 204, 21, 0.1)", borderRadius: "12px", border: "1px solid rgba(250, 204, 21, 0.2)" }}>
                  🔒 View-Only Mode: Staking & modifications are disabled for public profiles.
                </div>
              ) : (
                <button
                  onClick={handleDepositAndStake}
                  disabled={isStaking}
                  style={{
                    width: "100%", background: "linear-gradient(135deg, #10b981, #059669)", color: "#030712",
                    border: "none", borderRadius: "12px", padding: "12px", fontWeight: "900", fontSize: "12px",
                    cursor: "pointer", marginTop: "4px"
                  }}
                >
                  {isStaking ? "Opening Wallet..." : "DEPOSIT & STAKE NOW →"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE STAKING VAULTS & HISTORY TABLE */}
        <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "20px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "900", color: "#ffffff" }}>Staking Vaults & History</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "11px", minWidth: "600px" }}>
              <thead>
                <tr style={{ color: "#9ca3af", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "10px" }}>
                  <th style={{ padding: "8px" }}>VAULT ID</th>
                  <th style={{ padding: "8px" }}>STAKED AMOUNT</th>
                  <th style={{ padding: "8px" }}>LOCK DURATION</th>
                  <th style={{ padding: "8px" }}>EST. RETURN</th>
                  <th style={{ padding: "8px" }}>STAKED DATE</th>
                  <th style={{ padding: "8px" }}>MATURITY DATE</th>
                  <th style={{ padding: "8px" }}>STATUS / ACTION</th>
                </tr>
              </thead>
              <tbody>
                {activeVaults.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>No staking history found yet. Deposit above to start staking!</td>
                  </tr>
                ) : (
                  activeVaults.map((vault, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 8px", color: "#10b981", fontWeight: "900" }}>{vault.vaultId}</td>
                      <td style={{ padding: "12px 8px", fontWeight: "900", color: "#ffffff" }}>{vault.amount} USDT</td>
                      <td style={{ padding: "12px 8px", color: "#10b981", fontWeight: "800" }}>{vault.duration}</td>
                      <td style={{ padding: "12px 8px", fontWeight: "900", color: "#ffffff" }}>{vault.estReturn}</td>
                      <td style={{ padding: "12px 8px", color: "#9ca3af", fontWeight: "700" }}>{vault.stakedDate}</td>
                      <td style={{ padding: "12px 8px", color: "#9ca3af", fontWeight: "700" }}>{vault.maturityDate}</td>
                      <td style={{ padding: "12px 8px" }}>
                        {vault.isMatured && !vault.isWithdrawn ? (
                          <button 
                            onClick={() => handleWithdraw(vault.stakeIndex)}
                            style={{ backgroundColor: "#10b981", color: "#030712", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "900", cursor: "pointer", fontSize: "10px" }}
                          >
                            CLAIM PAYOUT
                          </button>
                        ) : (
                          <span style={{ backgroundColor: vault.status === "Closed / Matured" ? "rgba(239, 68, 68, 0.15)" : "rgba(234, 179, 8, 0.15)", color: vault.status === "Closed / Matured" ? "#ef4444" : "#facc15", padding: "3px 8px", borderRadius: "6px", fontSize: "9px", fontWeight: "900" }}>
                            {vault.status === "Closed / Matured" ? "🔒 Closed" : "🔒 Locked"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TEAM NETWORK & STAKING & VAULT LEDGER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "start" }}>
          
          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "20px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "900", color: "#ffffff" }}>Referral Matrix Network</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "11px", color: "#9ca3af" }}>Multi-tier team commission distribution structure.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "14px" }}>
              {[
                { title: "LEVEL 1 (DIRECT)", members: `${directReferralsCount} Members`, comm: "$20 / Member" },
                { title: "LEVEL 2", members: `${level2Count} Members`, comm: "5%" },
                { title: "LEVEL 3", members: `${level3Count} Members`, comm: "5%" },
                { title: "LEVEL 4", members: `${level4Count} Members`, comm: "5%" }
              ].map((lvl, i) => (
                <div key={i} style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "8px", color: "#9ca3af", fontWeight: "800", letterSpacing: "0.5px" }}>{lvl.title}</div>
                  <div style={{ fontSize: "13px", fontWeight: "900", color: "#ffffff", margin: "4px 0" }}>{lvl.members}</div>
                  <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "800" }}>{lvl.comm} Commission</div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "900", letterSpacing: "0.5px" }}>Total Team Volume</div>
                <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>Active Turnover</div>
              </div>
              <div style={{ fontSize: "16px", fontWeight: "900", color: "#ffffff" }}>${teamVolume} USDT</div>
            </div>
          </div>

          <div style={{ backgroundColor: "#070d1d", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "20px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "900", color: "#ffffff" }}>Staking & Vault Ledger</h3>
              <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "800" }}>Real-Time Stream</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto" }}>
              {payoutLedger.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "11px" }}>No staking records found yet.</div>
              ) : (
                payoutLedger.map((tx, i) => (
                 <div key={i} style={{ backgroundColor: "#0f1a36", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "900", color: "#ffffff" }}>{tx.type}</div>
                      <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "2px" }}>{tx.from} | {tx.time}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#10b981" }}>{tx.level}</div>
                      <div style={{ fontSize: "12px", fontWeight: "900", color: "#10b981", marginTop: "2px" }}>{tx.amount}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}