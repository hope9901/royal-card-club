// Poker Hand Rankings
export const HAND_RANKS = {
  ROYAL_FLUSH: 9,
  STRAIGHT_FLUSH: 8,
  FOUR_OF_A_KIND: 7,
  FULL_HOUSE: 6,
  FLUSH: 5,
  STRAIGHT: 4,
  THREE_OF_A_KIND: 3,
  TWO_PAIR: 2,
  ONE_PAIR: 1,
  HIGH_CARD: 0
};

export const RANK_NAMES = {
  [HAND_RANKS.ROYAL_FLUSH]: "로열 스트레이트 플러시 (Royal Flush)",
  [HAND_RANKS.STRAIGHT_FLUSH]: "스트레이트 플러시 (Straight Flush)",
  [HAND_RANKS.FOUR_OF_A_KIND]: "포카드 (Four of a Kind)",
  [HAND_RANKS.FULL_HOUSE]: "풀하우스 (Full House)",
  [HAND_RANKS.FLUSH]: "플러시 (Flush)",
  [HAND_RANKS.STRAIGHT]: "스트레이트 (Straight)",
  [HAND_RANKS.THREE_OF_A_KIND]: "트리플 (Three of a Kind)",
  [HAND_RANKS.TWO_PAIR]: "투페어 (Two Pair)",
  [HAND_RANKS.ONE_PAIR]: "원페어 (One Pair)",
  [HAND_RANKS.HIGH_CARD]: "하이카드 (High Card)"
};

/**
 * Evaluates exactly 5 cards and returns details of the hand strength.
 */
export function evaluate5CardHand(cards) {
  // 1. Sort cards by value descending
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  // 2. Check flush
  const isFlush = suits.every(s => s === suits[0]);

  // 3. Check straight
  let isStraight = false;
  let straightHigh = 0;
  
  // Check regular straight
  const uniqueValues = [...new Set(values)];
  if (uniqueValues.length === 5 && (uniqueValues[0] - uniqueValues[4] === 4)) {
    isStraight = true;
    straightHigh = uniqueValues[0];
  }
  // Check Wheel straight (A, 2, 3, 4, 5) where A acts as 1.
  // Values will be: [14, 5, 4, 3, 2]
  if (!isStraight && values.length === 5 && 
      values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    isStraight = true;
    straightHigh = 5; // 5 is the high card in Wheel straight
  }

  // 4. Value frequencies (e.g. counts = { 14: 2, 8: 3 })
  const counts = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  
  const countPairs = Object.keys(counts).map(val => ({
    val: parseInt(val, 10),
    count: counts[val]
  })).sort((a, b) => {
    // Sort primarily by frequency (count) descending, then by card value descending
    if (b.count !== a.count) return b.count - a.count;
    return b.val - a.val;
  });

  // Helper to build standardized kickers list (length 5)
  // Re-orders card values so that hand parts come first, then kickers.
  // e.g. One Pair of J: [11, 11, 14, 8, 5]
  const getKickers = () => {
    const kickerArray = [];
    countPairs.forEach(pair => {
      for (let i = 0; i < pair.count; i++) {
        kickerArray.push(pair.val);
      }
    });
    return kickerArray;
  };

  // Determine ranks
  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: HAND_RANKS.ROYAL_FLUSH, kickers: [14, 13, 12, 11, 10] };
  }
  
  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, kickers: [straightHigh, straightHigh-1, straightHigh-2, straightHigh-3, straightHigh-4] };
  }

  // Four of a Kind
  if (countPairs[0].count === 4) {
    return { rank: HAND_RANKS.FOUR_OF_A_KIND, kickers: getKickers() };
  }

  // Full House
  if (countPairs[0].count === 3 && countPairs[1].count === 2) {
    return { rank: HAND_RANKS.FULL_HOUSE, kickers: getKickers() };
  }

  // Flush
  if (isFlush) {
    return { rank: HAND_RANKS.FLUSH, kickers: values };
  }

  // Straight
  if (isStraight) {
    const kickers = isStraight && straightHigh === 5 ? [5, 4, 3, 2, 1] : [straightHigh, straightHigh-1, straightHigh-2, straightHigh-3, straightHigh-4];
    return { rank: HAND_RANKS.STRAIGHT, kickers };
  }

  // Three of a Kind
  if (countPairs[0].count === 3) {
    return { rank: HAND_RANKS.THREE_OF_A_KIND, kickers: getKickers() };
  }

  // Two Pair
  if (countPairs[0].count === 2 && countPairs[1].count === 2) {
    return { rank: HAND_RANKS.TWO_PAIR, kickers: getKickers() };
  }

  // One Pair
  if (countPairs[0].count === 2) {
    return { rank: HAND_RANKS.ONE_PAIR, kickers: getKickers() };
  }

  // High Card
  return { rank: HAND_RANKS.HIGH_CARD, kickers: values };
}

/**
 * Generate combinations of choosing k elements from array n
 */
function getCombinations(array, k) {
  const result = [];
  function helper(start, combo) {
    if (combo.length === k) {
      result.push(combo);
      return;
    }
    for (let i = start; i < array.length; i++) {
      helper(i + 1, [...combo, array[i]]);
    }
  }
  helper(0, []);
  return result;
}

/**
 * Compare two kicker arrays element by element.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareKickers(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

/**
 * Evaluates a set of 5 or 7 cards and returns the best possible 5-card hand.
 * @param {Array} cards - Card objects (length 5 or 7)
 */
export function evaluateHand(cards) {
  if (cards.length === 5) {
    const result = evaluate5CardHand(cards);
    return {
      ...result,
      bestCards: cards
    };
  }

  if (cards.length === 7) {
    // Get all 21 combinations of picking 5 cards out of 7
    const combos = getCombinations(cards, 5);
    let bestHand = null;

    combos.forEach(combo => {
      const evaluation = evaluate5CardHand(combo);
      
      if (!bestHand) {
        bestHand = { ...evaluation, bestCards: combo };
        return;
      }

      // Compare ranks
      if (evaluation.rank > bestHand.rank) {
        bestHand = { ...evaluation, bestCards: combo };
      } else if (evaluation.rank === bestHand.rank) {
        // Tie-breaker using kickers
        const comparison = compareKickers(evaluation.kickers, bestHand.kickers);
        if (comparison > 0) {
          bestHand = { ...evaluation, bestCards: combo };
        }
      }
    });

    return bestHand;
  }

  // Fallback
  return { rank: HAND_RANKS.HIGH_CARD, kickers: [], bestCards: cards.slice(0, 5) };
}
