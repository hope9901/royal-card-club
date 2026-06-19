const SUITS = [
  { name: 'spades', symbol: '♠', color: 'black' },
  { name: 'hearts', symbol: '♥', color: 'red' },
  { name: 'diamonds', symbol: '♦', color: 'red' },
  { name: 'clubs', symbol: '♣', color: 'black' }
];

const VALUES = [
  { name: '2', value: 2 },
  { name: '3', value: 3 },
  { name: '4', value: 4 },
  { name: '5', value: 5 },
  { name: '6', value: 6 },
  { name: '7', value: 7 },
  { name: '8', value: 8 },
  { name: '9', value: 9 },
  { name: '10', value: 10 },
  { name: 'J', value: 11 },
  { name: 'Q', value: 12 },
  { name: 'K', value: 13 },
  { name: 'A', value: 14 } // Ace values as 14 (High) for poker evaluations
];

/**
 * Creates a standard 52-card deck
 */
export function createDeck() {
  const deck = [];
  SUITS.forEach(suit => {
    VALUES.forEach(val => {
      deck.push({
        id: `${suit.name}_${val.name}`,
        suit: suit.name,
        symbol: suit.symbol,
        color: suit.color,
        name: val.name,
        value: val.value
      });
    });
  });
  return deck;
}

/**
 * Shuffles deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}
