// src/config/contract.ts

// Remix se jo deployed contract address mila hai wo yahan daal do
export const STAKING_CONTRACT_ADDRESS = "0x3A5Ce3d4E7658BbFB89a2245E0F1D9B3A88a0564"; // Apna poora address yahan paste kar dena

// BSC Mainnet Official USDT Address
export const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

// Contract ABI (Isme main functions included hain)
export const STAKING_ABI = [
  "function activateMatrix(address _referrer) external",
  "function stake(uint256 _amount, uint256 _lockupDays, uint256 _expectedRoi) external",
  "function withdrawStake(uint256 _stakeIndex) external",
  "function claimMysteryBox(uint256 _milestoneId) external",
  "function isUserInPassivePool(address _user) external view returns (bool)",
  "function getUserStakesCount(address _user) external view returns (uint256)",
  "function userStakes(address, uint256) external view returns (uint256 amount, uint256 startTime, uint256 lockupDuration, uint256 expectedRoiAmount, bool isWithdrawn)",
  "function users(address) external view returns (address referrer, bool isRegistered, uint256 registrationTime, uint256 directReferralsCount)"
];