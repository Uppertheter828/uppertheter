"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const CONTRACT_ADDRESS = "0x2763371176919176e28EC6B92bAc01875b9Bb2F3";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const MASTER_OWNER = "0x984Fcc48E2DAffc6e4E1CB1685aeF1aEfA698555";
const BSC_CHAIN_ID = 56n;
const ACTIVATION_AMOUNT = ethers.parseUnits("50", 18);

const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const CONTRACT_ABI = [
  "function activateMatrix(address _referrer) external",
  "function users(address) external view returns (address referrer, address[3] seniors, bool isRegistered, uint256 registrationTime, uint256 directReferralsCount)",
  "function userList(uint256) view returns (address)",
];

function getErrorMessage(error: any): string {
  const code = error?.code;
  const reason =
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.data?.message;

  if (code === 4001) return "The wallet transaction has been cancelled.";
  if (code === "ACTION_REJECTED") return "The request in Wallet was rejected.";
  if (code === "INSUFFICIENT_FUNDS") return "The BNB balance is insufficient for gas fees.";
  if (code === "CALL_EXCEPTION") {
    return `The contract rejected the transaction. ${reason || "Check referrer, registration rules, allowance and token transfer."}`;
  }

  return reason || error?.message || "Unknown error. Check the console for details.";
}

export default function RegisterPage() {
  const router = useRouter();

  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [referrerInput, setReferrerInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // URL se referral parameter auto-detect karne ke liye
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get("ref");
      if (refParam) {
        setReferrerInput(refParam.trim());
      }
    }
  }, []);

  async function getProvider() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error("Open the dApp in the MetaMask or Trust Wallet browser.");
    }

    const provider = new ethers.BrowserProvider(ethereum);
    const network = await provider.getNetwork();

    if (network.chainId !== BSC_CHAIN_ID) {
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }]
        });
      } catch {
        throw new Error("Switch your wallet to the BNB Smart Chain network.");
      }
    }

    return new ethers.BrowserProvider(ethereum);
  }

  async function checkWalletAndRegistration() {
    try {
      if (!(window as any).ethereum) return;

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (!accounts.length) return;

      const address = ethers.getAddress(accounts[0]);
      setAccount(address);
      setIsConnected(true);

      const network = await provider.getNetwork();
      if (network.chainId !== BSC_CHAIN_ID) return;

      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        setStatus("No code found deployed on BSC at the contract address. Please verify the address/network.");
        return;
      }

      if (address.toLowerCase() === MASTER_OWNER.toLowerCase()) {
        router.replace("/dashboard");
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      try {
        const userData = await contract.users(address);
        if (userData && (userData[2] === true || userData.isRegistered === true)) {
          router.replace("/dashboard");
        }
      } catch (e) {
        // Safe catch for unregistered users
      }
    } catch (error) {
      console.error("Wallet/registration check failed:", error);
    }
  }

  useEffect(() => {
    void checkWalletAndRegistration();
  }, []);

  async function connectWallet() {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert("Open the dApp in the MetaMask or Trust Wallet browser.");
        return;
      }

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }]
      });

      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts.length) return;

      const address = ethers.getAddress(accounts[0]);
      setAccount(address);
      setIsConnected(true);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      try {
        const userData = await contract.users(address);
        if (address.toLowerCase() === MASTER_OWNER.toLowerCase() || (userData && (userData[2] === true || userData.isRegistered === true))) {
          router.replace("/dashboard");
        }
      } catch (e) {
        // Safe catch
      }
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      alert(getErrorMessage(error));
    }
  }

  async function handleRegisterAndPay() {
    if (loading) return;

    let targetReferrer: string = "";

    try {
      setLoading(true);
      setStatus("Wallets and networks are being checked...");

      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setIsConnected(true);

      const contractCode = await provider.getCode(CONTRACT_ADDRESS);
      const tokenCode = await provider.getCode(USDT_ADDRESS);

      if (contractCode === "0x") {
        throw new Error("No code found deployed at the contract address. Please verify the contract address.");
      }
      if (tokenCode === "0x") {
        throw new Error("No code found at the token address. Please verify the network/token address.");
      }

      const matrix = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const token = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

      try {
        const currentUser = await matrix.users(address);
        if (currentUser && (currentUser[2] === true || currentUser.isRegistered === true)) {
          setStatus("This wallet is already registered.");
          router.replace("/dashboard");
          return;
        }
      } catch (e) {
        // New user, proceed safely
      }

      const input = referrerInput.trim();
      if (!input) throw new Error("Enter the Senior ID or referrer wallet address.");

      if (/^[0-9]+$/.test(input)) {
        const userId = BigInt(input);
        if (userId < 1n) throw new Error("The user ID must be 1 or greater.");

        try {
          targetReferrer = await matrix.userList(userId - 1n);
        } catch {
          throw new Error("This user ID was not found. Please verify the mapping between the user list and the deployed contract.");
        }
      } else if (ethers.isAddress(input)) {
        targetReferrer = ethers.getAddress(input);
      } else {
        throw new Error("Enter valid numeric User ID or 0x wallet address.");
      }

      if (targetReferrer.toLowerCase() === address.toLowerCase()) {
        throw new Error("You cannot set your own wallet as the referrer.");
      }

      let referrerData;
      try {
        referrerData = await matrix.users(targetReferrer);
      } catch {
        referrerData = [null, null, true]; 
      }

      const isReferrerRegistered = referrerData && (referrerData[2] === true || referrerData.isRegistered === true);
      if (!isReferrerRegistered && targetReferrer.toLowerCase() !== MASTER_OWNER.toLowerCase()) {
        throw new Error("This referrer is not registered in the contract. Please provide the ID/address of a registered referrer.");
      }

      const balance: bigint = await token.balanceOf(address);
      if (balance < ACTIVATION_AMOUNT) {
        throw new Error("There should be at least 50 USDT in the wallet.");
      }

      let allowance: bigint = await token.allowance(address, CONTRACT_ADDRESS);

      if (allowance < ACTIVATION_AMOUNT) {
        setStatus("USDT approval wallet mein confirm karo...");
        const approveTx = await token.approve(CONTRACT_ADDRESS, ACTIVATION_AMOUNT);
        setStatus(`Approval pending: ${approveTx.hash}`);
        const approveReceipt = await approveTx.wait();

        if (!approveReceipt || approveReceipt.status !== 1) {
          throw new Error("The transaction for the approval was not successful.");
        }

        allowance = await token.allowance(address, CONTRACT_ADDRESS);
        if (allowance < ACTIVATION_AMOUNT) {
          throw new Error("Even after approval, the allowance is less than 50 USDT.");
        }
      }

      setStatus("Registration rules are being checked...");
      try {
        await matrix.activateMatrix.staticCall(targetReferrer);
      } catch (simulationError: any) {
        console.error("Activation simulation failed:", simulationError);
        throw new Error(
          `Contract simulation fail hui: ${simulationError?.reason || simulationError?.shortMessage || "Check referrer, token transfer, or contract condition."}`
        );
      }

      setStatus("Confirm in the activation wallet...");
      const tx = await matrix.activateMatrix(targetReferrer);
      setStatus(`Activation pending: ${tx.hash}`);

      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error(`Activation was not successful. Transaction: ${tx.hash}`);
      }

      setStatus("Registration successful. Dashboard is opening...");
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Registration failed:", error);
      setStatus(getErrorMessage(error));
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-center items-center px-4 py-24 relative overflow-hidden">
      <Navbar isConnected={isConnected} setIsConnected={setIsConnected} />

      <div className="max-w-xl w-full bg-gray-900/80 border border-gray-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-3 py-1 rounded-full uppercase tracking-widest font-semibold">
            Decentralized Matrix Registration
          </span>
          <h1 className="text-3xl font-black mt-4">Activate Uppertheter Protocol</h1>
          <p className="text-gray-400 text-sm mt-2">
            Connect wallet, enter a registered referrer ID/address, and review the 50 USDT activation.
          </p>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-gray-950/60 border border-gray-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Connected Wallet</p>
            <p className="font-mono text-sm font-semibold text-green-400 break-all">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}
            </p>
          </div>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-green-500 hover:bg-green-600 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm"
            >
              Connect Wallet
            </button>
          ) : (
            <span className="text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
              Connected
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senior / Upline ID or Wallet Address
            </label>
            <input
              type="text"
              placeholder="User ID (e.g. 1) or wallet (0x...)"
              value={referrerInput}
              onChange={(e) => setReferrerInput(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 font-mono text-sm"
            />
          </div>

          <div className="p-4 bg-gray-950/40 rounded-xl border border-gray-800/60 flex justify-between items-center">
            <span className="text-sm text-gray-300 font-semibold">Activation Fee:</span>
            <span className="text-lg font-black text-green-400">50.00 USDT</span>
          </div>

          {status && (
            <p role="status" className="text-sm text-gray-300 break-words">
              {status}
            </p>
          )}

          <button
            onClick={handleRegisterAndPay}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-gray-950 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Confirm & Pay 50 USDT"}
          </button>

          <p className="text-xs text-gray-500">
            Approval and activation are separate blockchain transactions when approval is required.
            Check the token, contract address, and transaction details before confirming.
          </p>
        </div>
      </div>
    </div>
  );
}