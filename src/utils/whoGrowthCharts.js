// WHO Growth Charts weight-for-age classification utility (0-60 months)

const BOYS_MILESTONES = {
  0: { sd3: 2.1, sd2: 2.5, median: 3.3 },
  1: { sd3: 2.9, sd2: 3.4, median: 4.5 },
  2: { sd3: 3.8, sd2: 4.3, median: 5.6 },
  3: { sd3: 4.4, sd2: 5.0, median: 6.4 },
  4: { sd3: 4.9, sd2: 5.6, median: 7.0 },
  5: { sd3: 5.3, sd2: 6.0, median: 7.5 },
  6: { sd3: 5.7, sd2: 6.4, median: 7.9 },
  7: { sd3: 5.9, sd2: 6.7, median: 8.3 },
  8: { sd3: 6.2, sd2: 6.9, median: 8.6 },
  9: { sd3: 6.4, sd2: 7.1, median: 8.9 },
  10: { sd3: 6.6, sd2: 7.4, median: 9.2 },
  11: { sd3: 6.8, sd2: 7.6, median: 9.4 },
  12: { sd3: 6.9, sd2: 7.7, median: 9.6 },
  18: { sd3: 7.8, sd2: 8.8, median: 10.9 },
  24: { sd3: 8.6, sd2: 9.7, median: 12.2 },
  30: { sd3: 9.3, sd2: 10.5, median: 13.3 },
  36: { sd3: 10.0, sd2: 11.3, median: 14.3 },
  42: { sd3: 10.7, sd2: 12.0, median: 15.3 },
  48: { sd3: 11.4, sd2: 12.7, median: 16.3 },
  54: { sd3: 12.0, sd2: 13.4, median: 17.3 },
  60: { sd3: 12.4, sd2: 14.1, median: 18.3 }
};

const GIRLS_MILESTONES = {
  0: { sd3: 2.0, sd2: 2.4, median: 3.2 },
  1: { sd3: 2.7, sd2: 3.2, median: 4.2 },
  2: { sd3: 3.4, sd2: 3.9, median: 5.1 },
  3: { sd3: 4.0, sd2: 4.5, median: 5.8 },
  4: { sd3: 4.4, sd2: 5.0, median: 6.4 },
  5: { sd3: 4.8, sd2: 5.4, median: 6.9 },
  6: { sd3: 5.1, sd2: 5.7, median: 7.3 },
  7: { sd3: 5.3, sd2: 6.0, median: 7.6 },
  8: { sd3: 5.6, sd2: 6.3, median: 7.9 },
  9: { sd3: 5.8, sd2: 6.5, median: 8.2 },
  10: { sd3: 5.9, sd2: 6.7, median: 8.5 },
  11: { sd3: 6.1, sd2: 6.9, median: 8.7 },
  12: { sd3: 6.3, sd2: 7.0, median: 8.9 },
  18: { sd3: 7.2, sd2: 8.1, median: 10.2 },
  24: { sd3: 8.1, sd2: 9.2, median: 11.5 },
  30: { sd3: 8.9, sd2: 10.0, median: 12.7 },
  36: { sd3: 9.6, sd2: 10.8, median: 13.9 },
  42: { sd3: 10.3, sd2: 11.6, median: 15.0 },
  48: { sd3: 10.9, sd2: 12.4, median: 15.5 },
  54: { sd3: 11.5, sd2: 13.0, median: 16.5 },
  60: { sd3: 12.1, sd2: 13.7, median: 17.3 }
};

const getThresholdsForAge = (milestones, ageMonths) => {
  const roundedAge = Math.max(0, Math.min(60, Math.round(ageMonths)));
  if (milestones[roundedAge]) {
    return milestones[roundedAge];
  }
  
  // Find lower and upper bound milestones
  let lowerAge = 0;
  let upperAge = 60;
  const keys = Object.keys(milestones).map(Number).sort((a, b) => a - b);
  
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] <= roundedAge) lowerAge = keys[i];
    if (keys[i] >= roundedAge) {
      upperAge = keys[i];
      break;
    }
  }
  
  const lowerVal = milestones[lowerAge];
  const upperVal = milestones[upperAge];
  const diff = upperAge - lowerAge;
  if (diff === 0) return lowerVal;
  
  const ratio = (roundedAge - lowerAge) / diff;
  return {
    sd3: lowerVal.sd3 + (upperVal.sd3 - lowerVal.sd3) * ratio,
    sd2: lowerVal.sd2 + (upperVal.sd2 - lowerVal.sd2) * ratio,
    median: lowerVal.median + (upperVal.median - lowerVal.median) * ratio
  };
};

export const getMalnutritionStatus = (weight, ageMonths, gender) => {
  const w = parseFloat(weight);
  const age = parseFloat(ageMonths);
  if (isNaN(w) || isNaN(age) || age < 0 || age > 60) return 'Normal';
  
  const isGirl = gender && (
    gender.toLowerCase() === 'female' || 
    gender.toLowerCase() === 'girl' || 
    gender.toLowerCase() === 'f' || 
    gender.toLowerCase() === 'स्त्री' || 
    gender.toLowerCase() === 'महिला'
  );
  
  const milestones = isGirl ? GIRLS_MILESTONES : BOYS_MILESTONES;
  const thresholds = getThresholdsForAge(milestones, age);
  
  if (w < thresholds.sd3) {
    return 'SAM';
  } else if (w < thresholds.sd2) {
    return 'MAM';
  }
  return 'Normal';
};
