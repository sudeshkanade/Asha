import { storage, STORAGE_KEYS } from '../database/storage';

/**
 * STOCK MANAGEMENT LOGIC
 */

export const updateStockLevel = async (itemId, quantityUsed) => {
  const stock = await storage.getAll(STORAGE_KEYS.STOCK);
  const itemIndex = stock.findIndex(i => i.id === itemId);
  
  if (itemIndex >= 0) {
    const item = stock[itemIndex];
    item.currentQuantity = Math.max(0, item.currentQuantity - quantityUsed);
    item.lastUpdatedAt = Date.now();
    
    await storage.saveAll(STORAGE_KEYS.STOCK, stock);
    
    // Check for low stock alert
    if (item.currentQuantity <= item.minThreshold) {
      return { alert: true, message: `Low stock for ${item.name}: ${item.currentQuantity} remaining.` };
    }
  }
  return { alert: false };
};

export const generateIndent = (stockItems) => {
  return stockItems
    .filter(item => item.currentQuantity < item.maxCapacity * 0.5)
    .map(item => ({
      itemId: item.id,
      name: item.name,
      current: item.currentQuantity,
      required: item.maxCapacity - item.currentQuantity,
      unit: item.unit
    }));
};

/**
 * IDSP SURVEILLANCE LOGIC
 */

export const detectFeverCluster = (surveillanceLogs, villageId, days = 7, threshold = 5) => {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const recentFevers = surveillanceLogs.filter(log => 
    log.villageId === villageId && 
    log.hasFever && 
    new Date(log.timestamp).getTime() > cutoff
  );
  
  return recentFevers.length >= threshold;
};

/**
 * VECTOR CONTROL INDICES
 */

export const calculateVectorIndices = (surveys) => {
  if (surveys.length === 0) return { houseIndex: 0, containerIndex: 0 };
  
  const totalHouses = surveys.length;
  const positiveHouses = surveys.filter(s => s.hasPositiveBreeding).length;
  
  let totalContainers = 0;
  let positiveContainers = 0;
  
  surveys.forEach(s => {
    totalContainers += (s.containersChecked || 0);
    positiveContainers += (s.containersPositive || 0);
  });
  
  return {
    houseIndex: (positiveHouses / totalHouses) * 100,
    containerIndex: totalContainers > 0 ? (positiveContainers / totalContainers) * 100 : 0
  };
};

/**
 * FINANCIAL LOGIC
 */

export const calculateAshaEarnings = (claims) => {
  return claims.reduce((total, claim) => {
    if (claim.status === 'Approved') {
      return total + (claim.amount || 0);
    }
    return total;
  }, 0);
};
