import React, { useState, useEffect } from "react";
import { ArrowLeft, HelpCircle, Coins, RotateCcw, AlertCircle } from "lucide-react";
import { createDeck, shuffleDeck } from "../utils/deck";
import PlayingCard from "./PlayingCard";
import InteractiveTour from "./InteractiveTour";

export default function BlackjackGame({ playerName, currentMoney, onUpdateMoney, onBack, onChargeMoney }) {
  // Game states
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [betAmount, setBetAmount] = useState(10000);
  const [currentBet, setCurrentBet] = useState(0);
  const [gameState, setGameState] = useState("betting"); // "betting", "playerTurn", "dealerTurn", "resolved"
  const [message, setMessage] = useState("");
  const [resultType, setResultType] = useState(""); // "win", "lose", "push", "blackjack"
  
  // Interactive Guide Tour State
  const [tourStep, setTourStep] = useState(null); // null means inactive

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  // 1. Calculate the best value of a blackjack hand
  const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;

    hand.forEach((card) => {
      if (card.name === "A") {
        aces += 1;
        value += 11;
      } else if (["J", "Q", "K"].includes(card.name)) {
        value += 10;
      } else {
        value += card.value;
      }
    });

    // Adjust Ace values from 11 to 1 if we busted
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }

    return value;
  };

  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);

  // 2. Initialize Game Session
  useEffect(() => {
    setDeck(shuffleDeck(createDeck()));
  }, []);

  // 3. Game Actions
  const handlePlaceBet = () => {
    if (betAmount <= 0) {
      alert("배팅 금액은 0원보다 커야 합니다.");
      return;
    }
    if (betAmount > currentMoney) {
      alert("보유 금액보다 많이 배팅할 수 없습니다.");
      return;
    }

    // Deduct money and set current bet
    onUpdateMoney(-betAmount);
    setCurrentBet(betAmount);

    // Reset hands and start game
    let currentDeck = [...deck];
    if (currentDeck.length < 15) {
      currentDeck = shuffleDeck(createDeck());
    }

    const p1 = currentDeck.pop();
    const d1 = currentDeck.pop();
    const p2 = currentDeck.pop();
    const d2 = currentDeck.pop();

    const initialPlayerHand = [p1, p2];
    const initialDealerHand = [
      { ...d1, faceUp: true },
      { ...d2, faceUp: false } // Second card is faced down
    ];

    setPlayerHand(initialPlayerHand);
    setDealerHand(initialDealerHand);
    setDeck(currentDeck);

    // Check for natural Blackjack
    const pValue = calculateHandValue(initialPlayerHand);
    const dValue = calculateHandValue(initialDealerHand.map(c => ({ ...c, name: c.name, value: c.value }))); // simulate calculation with face up

    if (pValue === 21) {
      // Reveal dealer card immediately
      const revealedDealerHand = initialDealerHand.map(c => ({ ...c, faceUp: true }));
      setDealerHand(revealedDealerHand);
      
      const realDValue = calculateHandValue(revealedDealerHand);
      
      if (realDValue === 21) {
        // Tie Blackjack
        resolveGame("push", "플레이어와 딜러 모두 블랙잭! 무승부(Push)입니다.", betAmount);
      } else {
        // Player wins with natural Blackjack (Pays 3 to 2 / 2.5x payout)
        const payout = Math.floor(betAmount * 2.5);
        resolveGame("blackjack", `블랙잭! ${formatMoney(payout)}을 획득했습니다.`, payout);
      }
    } else {
      setGameState("playerTurn");
      setMessage("카드를 더 받으시겠습니까(Hit)? 멈추시겠습니까(Stand)?");
      setResultType("");
    }
  };

  const handleHit = () => {
    if (gameState !== "playerTurn") return;

    const currentDeck = [...deck];
    const newCard = currentDeck.pop();
    const newHand = [...playerHand, newCard];

    setPlayerHand(newHand);
    setDeck(currentDeck);

    const val = calculateHandValue(newHand);
    if (val > 21) {
      // Player busted!
      setDealerHand(dealerHand.map(c => ({ ...c, faceUp: true }))); // Reveal dealer card
      resolveGame("lose", "버스트(21 초과)! 딜러가 승리했습니다.", 0);
    }
  };

  const handleStand = () => {
    if (gameState !== "playerTurn") return;
    startDealerTurn(playerHand, betAmount);
  };

  const handleDoubleDown = () => {
    if (gameState !== "playerTurn") return;
    if (currentMoney < currentBet) {
      alert("더블 다운을 위한 추가 머니가 부족합니다.");
      return;
    }

    // Deduct double down bet
    onUpdateMoney(-currentBet);
    const doubleBet = currentBet * 2;
    setCurrentBet(doubleBet);

    // Draw exactly one card
    const currentDeck = [...deck];
    const newCard = currentDeck.pop();
    const newHand = [...playerHand, newCard];

    setPlayerHand(newHand);
    setDeck(currentDeck);

    const val = calculateHandValue(newHand);
    if (val > 21) {
      setDealerHand(dealerHand.map(c => ({ ...c, faceUp: true })));
      resolveGame("lose", "버스트(21 초과)! 딜러가 승리했습니다.", 0);
    } else {
      startDealerTurn(newHand, doubleBet);
    }
  };

  const handleSurrender = () => {
    if (gameState !== "playerTurn" || playerHand.length !== 2) return;

    // Refund half the bet
    const refund = Math.floor(currentBet / 2);
    setDealerHand(dealerHand.map(c => ({ ...c, faceUp: true })));
    resolveGame("lose", `기권하셨습니다. 배팅금의 절반인 ${formatMoney(refund)}이 환불됩니다.`, refund);
  };

  const startDealerTurn = (currentPlayerHand, activeBet) => {
    setGameState("dealerTurn");
    setMessage("딜러가 카드를 받고 있습니다...");

    // Reveal hidden card
    const revealedHand = dealerHand.map(c => ({ ...c, faceUp: true }));
    setDealerHand(revealedHand);

    // Keep drawing cards for dealer until value is >= 17
    setTimeout(() => {
      let currentDealerHand = [...revealedHand];
      let currentDeck = [...deck];
      let dVal = calculateHandValue(currentDealerHand);

      const drawDealerCard = () => {
        if (dVal < 17) {
          const newCard = { ...currentDeck.pop(), faceUp: true };
          currentDealerHand.push(newCard);
          setDealerHand([...currentDealerHand]);
          setDeck([...currentDeck]);
          dVal = calculateHandValue(currentDealerHand);

          // Recurse after delay for visual effect
          setTimeout(drawDealerCard, 800);
        } else {
          // Dealer turn ended, resolve game
          const pVal = calculateHandValue(currentPlayerHand);
          
          if (dVal > 21) {
            // Dealer busted
            const payout = activeBet * 2;
            resolveGame("win", `딜러 버스트! 플레이어가 승리하여 ${formatMoney(payout)}을 획득했습니다.`, payout);
          } else if (pVal > dVal) {
            // Player has higher score
            const payout = activeBet * 2;
            resolveGame("win", `플레이어 승리! ${formatMoney(payout)}을 획득했습니다.`, payout);
          } else if (pVal < dVal) {
            // Dealer has higher score
            resolveGame("lose", "딜러 승리. 패배하였습니다.", 0);
          } else {
            // Push (Tie)
            resolveGame("push", "무승부(Push)입니다. 배팅금을 반환받습니다.", activeBet);
          }
        }
      };

      drawDealerCard();
    }, 800);
  };

  const resolveGame = (type, msg, payout) => {
    setGameState("resolved");
    setResultType(type);
    setMessage(msg);
    setCurrentBet(0);

    if (payout > 0) {
      onUpdateMoney(payout);
    }
  };

  const handleNextGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setMessage("");
    setResultType("");
    setGameState("betting");
  };

  const handleAdjustBet = (amount) => {
    if (gameState !== "betting") return;
    if (amount === "all") {
      setBetAmount(currentMoney);
    } else {
      setBetAmount(prev => {
        const next = prev + amount;
        if (next < 10000) return 10000;
        if (next > currentMoney) return currentMoney;
        return next;
      });
    }
  };

  // Interactive Tour Step Configurations
  const tourSteps = [
    {
      target: ".dealer-area",
      title: "딜러(컴퓨터) 영역",
      text: "딜러가 받은 카드들이 놓이는 공간입니다. 첫 번째 카드는 공개되지만 두 번째 카드는 뒤집어진 비공개 상태로 시작됩니다. 딜러는 16 이하일 때 무조건 카드를 더 받고, 17 이상이면 무조건 멈춥니다."
    },
    {
      target: ".player-area",
      title: "내 카드(플레이어) 영역",
      text: "플레이어가 드로우한 카드들과 실시간 카드 점수 합계가 보이는 공간입니다. 합계가 21을 초과하면 버스트(Busted)가 되어 즉시 패배합니다."
    },
    {
      target: ".betting-controls",
      title: "배팅 칩 패널",
      text: "게임 시작 전 베팅할 칩을 선택하고 조절하는 곳입니다. +1만, +3만, +5만 또는 올인 버튼을 통해 베팅금을 정한 뒤 [배팅 및 게임 시작]을 누릅니다."
    },
    {
      target: ".blackjack-actions",
      title: "블랙잭 조작 버튼",
      text: "배팅 완료 후 플레이어 턴이 되었을 때 활성화되는 액션 버튼들입니다. Hit(한 장 더), Stand(멈추기), Double Down(배팅액 2배+1장만 받기), Surrender(절반 환불받고 기권)를 전술적으로 활용하세요."
    }
  ];

  const handleStartTour = () => setTourStep(0);
  const handleNextTour = () => setTourStep(prev => prev + 1);
  const handlePrevTour = () => setTourStep(prev => prev - 1);
  const handleCompleteTour = () => setTourStep(null);

  // Determine tour highlight class
  const getTourHighlightClass = (targetClass) => {
    if (tourStep === null) return "";
    const activeTarget = tourSteps[tourStep].target;
    return activeTarget === targetClass ? "tour-active-element" : "";
  };

  return (
    <div className="game-table blackjack-table">
      {/* Table Header Actions */}
      <div className="table-header no-print">
        <button className="btn btn-secondary btn-icon" onClick={onBack}>
          <ArrowLeft size={16} /> 나가기
        </button>
        <div className="table-title">BLACKJACK TABLE</div>
        <button className="btn btn-secondary btn-icon" onClick={handleStartTour}>
          <HelpCircle size={16} /> 도움말
        </button>
      </div>

      {/* Main Blackjack Area */}
      <div className="blackjack-arena">
        {/* Dealer Zone */}
        <div className={`dealer-area game-zone ${getTourHighlightClass(".dealer-area")}`}>
          <div className="zone-label">DEALER HAND</div>
          {dealerHand.length > 0 && (
            <div className="zone-score-badge">
              Score: {gameState === "playerTurn" ? "?" : dealerValue}
            </div>
          )}
          
          <div className="cards-row">
            {dealerHand.length === 0 ? (
              <div className="empty-cards-placeholder">딜러 카드 대기 중</div>
            ) : (
              dealerHand.map((card, idx) => (
                <PlayingCard key={card.id} suit={card.suit} name={card.name} faceUp={card.faceUp} delay={idx * 150} />
              ))
            )}
          </div>
        </div>

        {/* Message / Toast Center Info */}
        <div className="game-announcer glass">
          {message || "배팅 칩을 걸고 딜러와의 블랙잭 대결을 시작해 보세요."}
        </div>

        {/* Player Zone */}
        <div className={`player-area game-zone ${getTourHighlightClass(".player-area")}`}>
          <div className="zone-label">{playerName} HAND</div>
          {playerHand.length > 0 && (
            <div className="zone-score-badge text-accent">Score: {playerValue}</div>
          )}

          <div className="cards-row">
            {playerHand.length === 0 ? (
              <div className="empty-cards-placeholder">플레이어 카드 대기 중</div>
            ) : (
              playerHand.map((card, idx) => (
                <PlayingCard key={card.id} suit={card.suit} name={card.name} faceUp={true} delay={idx * 150} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom control panel */}
      <div className="table-controls-panel glass no-print">
        {/* Money Display */}
        <div className="table-money-dashboard">
          <div className="money-item">
            <span>보유 머니:</span>
            <strong className="text-accent">{formatMoney(currentMoney)}</strong>
          </div>
          {currentBet > 0 && (
            <div className="money-item">
              <span>베팅된 머니:</span>
              <strong className="text-gold">{formatMoney(currentBet)}</strong>
            </div>
          )}
        </div>

        {/* Action Controls depending on game stage */}
        <div className="controls-action-box">
          {/* Stage 1: Betting */}
          {gameState === "betting" && (
            <div className={`betting-controls w-full ${getTourHighlightClass(".betting-controls")}`}>
              <div className="chip-selector-group">
                <button className="chip-btn" onClick={() => handleAdjustBet(10000)}>
                  <Coins size={14} /> +1만
                </button>
                <button className="chip-btn" onClick={() => handleAdjustBet(30000)}>
                  <Coins size={14} /> +3만
                </button>
                <button className="chip-btn" onClick={() => handleAdjustBet(50000)}>
                  <Coins size={14} /> +5만
                </button>
                <button className="chip-btn chip-all-in" onClick={() => handleAdjustBet("all")}>
                  🚀 올인
                </button>
                <button className="chip-btn chip-reset" onClick={() => setBetAmount(10000)}>
                  <RotateCcw size={12} /> 초기화
                </button>
              </div>

              <div className="bet-start-row">
                <span className="bet-amount-preview">배팅 설정: <strong>{formatMoney(betAmount)}</strong></span>
                <button className="btn btn-primary" onClick={handlePlaceBet}>
                  배팅 및 게임 시작
                </button>
              </div>
            </div>
          )}

          {/* Stage 2: Player's Turn */}
          {gameState === "playerTurn" && (
            <div className={`blackjack-actions-row w-full blackjack-actions ${getTourHighlightClass(".blackjack-actions")}`}>
              <button className="btn btn-primary flex-1" onClick={handleHit}>
                Hit (카드 받기)
              </button>
              <button className="btn btn-secondary flex-1" onClick={handleStand}>
                Stand (멈추기)
              </button>
              <button 
                className="btn btn-secondary flex-1" 
                onClick={handleDoubleDown}
                disabled={currentMoney < currentBet}
              >
                Double Down
              </button>
              {playerHand.length === 2 && (
                <button className="btn btn-secondary flex-1 btn-surrender" onClick={handleSurrender}>
                  Surrender
                </button>
              )}
            </div>
          )}

          {/* Stage 3: Game Resolved Showdown Result */}
          {gameState === "resolved" && (
            <div className="showdown-actions w-full">
              <div className={`result-stamp ${resultType}`}>
                {resultType === "win" ? "🏆 WIN!" : resultType === "blackjack" ? "✨ BLACKJACK!" : resultType === "push" ? "🤝 PUSH" : "💀 LOSE"}
              </div>
              <button className="btn btn-primary btn-next-deal" onClick={handleNextGame}>
                새 판 받기 (Next Deal)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Guide Overlay Tour */}
      <InteractiveTour
        steps={tourSteps}
        activeStep={tourStep}
        onNext={handleNextTour}
        onPrev={handlePrevTour}
        onComplete={handleCompleteTour}
      />

      {/* Bankruptcy Overlay (Only shows when game is resolved and money is 0) */}
      {gameState === "resolved" && currentMoney <= 0 && (
        <div className="bankruptcy-overlay no-print">
          <div className="bankruptcy-card glass">
            <h2>💸 BANKRUPT (파산)</h2>
            <p>배팅 금액을 모두 잃어 파산하셨습니다.</p>
            <div className="bankruptcy-desc">로얄 클럽에서 회원님께 무료 충전 머니 10만원을 긴급 지급해 드립니다.</div>
            <button className="btn btn-primary mt-4" onClick={onChargeMoney}>
              10만원 무료 충전 받기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
