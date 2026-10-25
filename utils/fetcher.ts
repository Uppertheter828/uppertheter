import { ethers } from "ethers";

const MASTER_OWNER = "0x984Fcc48E2DAffc6e4E1CB1685aeF1aEfA698555";

export async function getRealUserData(walletAddress: string, provider: any, stakingAddress: string, abi: any) {
  try {
    const stakingContract = new ethers.Contract(stakingAddress, abi, provider);
    
    let directs = 0;
    let level2Count = 0;
    let level3Count = 0;
    let level4Count = 0;
    let directAddresses: string[] = [];
    let todayUsersCount = 0;
    let yesterdayUsersCount = 0;

    // Time calculations for Today and Yesterday (Seconds)
    const nowSec = Math.floor(Date.now() / 1000);
    const nowDate = new Date();
    const startOfTodaySec = Math.floor(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0).getTime() / 1000);
    const startOfYesterdaySec = startOfTodaySec - 86400; // 24 hours back

    // 1. Smart contract se users ki list scan karke team aur daily counts nikalna
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
          
          // Smart contract se user ka registration time (agr uData mein timestamp field ho)
          const joinedTime = Number(uData.joinedAt || uData.createdAt || uData.time || uData[2] || 0);

          allUsersMap[addr.toLowerCase()] = ref.toLowerCase();
          userListArray.push(addr.toLowerCase());

          // Directs count
          if (ref.toLowerCase() === walletAddress.toLowerCase()) {
            directs++;
            directAddresses.push(addr.toLowerCase());
          }

          // Today Users (Aaj raat 12:00 AM se abhi tak)
          if (joinedTime >= startOfTodaySec) {
            todayUsersCount++;
          }

          // Yesterday Users (Kal raat 12:00 AM se aaj raat 12:00 AM tak - poore 24 hours)
          if (joinedTime >= startOfYesterdaySec && joinedTime < startOfTodaySec) {
            yesterdayUsersCount++;
          }
        } catch (e) {}
      }

      // Level 2 calculation
      userListArray.forEach((addr) => {
        const ref = allUsersMap[addr];
        if (ref && directAddresses.includes(ref)) {
          level2Count++;
        }
      });

      // Owner fallback check
      if (directs === 0 && walletAddress.toLowerCase() === MASTER_OWNER.toLowerCase()) {
        directs = 3;
      }
    } catch (err) {
      console.log("Team network fetch error:", err);
      try {
        const filter = stakingContract.filters.MatrixActivated(null, walletAddress);
        const events = await stakingContract.queryFilter(filter, 0, "latest");
        directs = events.length;
      } catch (e) {}
    }

    if (directs === 0 && walletAddress.toLowerCase() === MASTER_OWNER.toLowerCase()) {
      directs = 3;
    }

    const directCommissionNum = directs * 20;
    const matrixIncomeNum = directs * 10;

    const stakesCount = await stakingContract.getUserStakesCount(walletAddress);
    let vaults = [];
    let totalStakedSum = 0;
    let initialYieldSum = 0;
    let ledgerEvents = [];

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
        isMatured: nowSec >= maturityTime
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

    return {
      directs,
      level2Count,
      level3Count,
      level4Count,
      todayUsers: todayUsersCount,          // <--- Aaj ka count
      yesterdayUsers: yesterdayUsersCount,   // <--- Kal ka count
      directCommission: directCommissionNum.toFixed(2),
      matrixIncome: matrixIncomeNum.toFixed(2),
      vaults,
      totalStaked: totalStakedSum.toFixed(2),
      initialYield: initialYieldSum,
      teamVolume: (totalStakedSum * 1.5).toFixed(2),
      ledger: ledgerEvents
    };
  } catch (err) {
    console.error("Fetcher error:", err);
    return null;
  }
}