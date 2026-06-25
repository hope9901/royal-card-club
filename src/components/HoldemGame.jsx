import React, { useState, useEffect } from "react";
import { ArrowLeft, HelpCircle, Coins, RotateCcw, Flame } from "lucide-react";
import { createDeck, shuffleDeck } from "../utils/deck";
import { evaluateHand, compareKickers, RANK_NAMES } from "../utils/pokerEvaluator";
import PlayingCard from "./PlayingCard";
import InteractiveTour from "./InteractiveTour";

const MIN_ANTE = 10000; // Small blind/Ante = 1만원

export default function HoldemGame({ playerName, currentMoney, onUpdateMoney, onBack, onChargeMoney }) {
  // Game Configuration & States
  const [deck, setDeck] = useState([]);
  const [gameState, setGameState] = useState("ante"); // "ante", "preflop", "flop", "turn", "river", "showdown"
  
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  
  const [pot, setPot] = useState(0);
  const [currentCallAmount, setCurrentCallAmount] = useState(0);
  const [playerBetThisRound, setPlayerBetThisRound] = useState(0);
  const [computerBetThisRound, setComputerBetThisRound] = useState(0);
  
  const [raiseBetAmount, setRaiseBetAmount] = useState(20000); // Dynamic raise amount state
  
  const [message, setMessage] = useState("");
  const [winnerMessage, setWinnerMessage] = useState("");
  const [playerBestComboName, setPlayerBestComboName] = useState("");
  const [computerBestComboName, setComputerBestComboName] = useState("");
  const [winningCards, setWinningCards] = useState([]); // Best 5 cards for winner highlighing
  
  // Interactive Tour State
  const [tourStep, setTourStep] = useState(null);

  // Thrown Chips state for 3D simulation
  const [thrownChips, setThrownChips] = useState([]);

  const throwChip = (amount, isPlayer) => {
    let remaining = amount;
    const chipValues = [10000000, 5000000, 1000000, 500000, 100000, 50000, 30000, 10000];
    const newChips = [];

    for (let i = 0; i < chipValues.length; i++) {
      const val = chipValues[i];
      while (remaining >= val) {
        newChips.push({
          id: `chip-${Date.now()}-${Math.random()}`,
          value: val,
          isPlayer,
          phase: "throwing", // "throwing", "collected"
          xOffset: Math.floor(Math.random() * 80 - 40),
          yOffset: Math.floor(Math.random() * 40 - 20)
        });
        remaining -= val;
        if (newChips.length >= 15) break;
      }
      if (newChips.length >= 15) break;
    }

    if (remaining > 0 && newChips.length < 15) {
      newChips.push({
        id: `chip-${Date.now()}-${Math.random()}`,
        value: remaining,
        isPlayer,
        phase: "throwing",
        xOffset: Math.floor(Math.random() * 80 - 40),
        yOffset: Math.floor(Math.random() * 40 - 20)
      });
    }

    setThrownChips((prev) => [...prev, ...newChips]);
  };

  const collectPotToWinner = (isPlayerWinner) => {
    setThrownChips((prev) =>
      prev.map((chip) => ({
        ...chip,
        phase: isPlayerWinner ? "collect-player" : "collect-computer"
      }))
    );

    setTimeout(() => {
      setThrownChips([]);
    }, 1000);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  // 1. Initialize Deck
  useEffect(() => {
    setDeck(shuffleDeck(createDeck()));
  }, []);

  // 2. Start game / Collect Ante (1만원)
  const handleStartGame = () => {
    if (currentMoney < MIN_ANTE) {
      alert("최소 안테(기본 판돈) 1만원이 부족합니다. 로비에서 머니를 충전해 주세요.");
      return;
    }

    onUpdateMoney(-MIN_ANTE);
    setPot(MIN_ANTE * 2); // Player ante + Computer ante
    setPlayerBetThisRound(MIN_ANTE);
    setComputerBetThisRound(MIN_ANTE);
    setCurrentCallAmount(MIN_ANTE);

    // Throw ante chips from both players
    throwChip(MIN_ANTE, true);
    throwChip(MIN_ANTE, false);

    let currentDeck = shuffleDeck(createDeck());
    
    // Draw 2 cards for player and computer
    const p1 = currentDeck.pop();
    const p2 = currentDeck.pop();
    const c1 = currentDeck.pop();
    const c2 = currentDeck.pop();

    setPlayerHand([p1, p2]);
    setComputerHand([
      { ...c1, faceUp: false },
      { ...c2, faceUp: false }
    ]);
    setCommunityCards([]);
    setDeck(currentDeck);
    
    setWinnerMessage("");
    setPlayerBestComboName("");
    setComputerBestComboName("");
    setWinningCards([]);

    setGameState("preflop");
    setMessage("개인 패가 배분되었습니다. 베팅 혹은 체크를 진행해 주세요.");
  };

  // 3. User Bet Options (Call, Check, Raise, Fold)
  const handleCheck = () => {
    if (playerBetThisRound < currentCallAmount) return; // Cannot check if there's a call amount pending
    
    setMessage("체크하셨습니다. 컴퓨터가 행동을 결정합니다...");
    setTimeout(() => {
      computerDecision("check", 0, pot);
    }, 800);
  };

  const handleCall = () => {
    const callCost = currentCallAmount - playerBetThisRound;
    
    if (callCost > currentMoney) {
      // All-in Call situation
      const allInAmount = currentMoney;
      onUpdateMoney(-allInAmount);
      setPlayerBetThisRound((prev) => prev + allInAmount);
      setPot((prev) => prev + allInAmount);
      throwChip(allInAmount, true);

      setMessage(`플레이어가 남은 전 재산 ${formatMoney(allInAmount)}을 모두 걸고 올인(All-in Call) 했습니다!`);
      setTimeout(() => {
        runAllInShowdown();
      }, 1200);
      return;
    }

    onUpdateMoney(-callCost);
    setPlayerBetThisRound(currentCallAmount);
    setPot(prev => prev + callCost);
    throwChip(callCost, true);

    setMessage("콜을 하셨습니다. 다음 단계로 진행합니다.");
    setTimeout(() => {
      advanceStage();
    }, 800);
  };

  const runAllInShowdown = () => {
    setGameState("showdown");
    let currentDeck = [...deck];
    let updatedCommunity = [...communityCards];
    
    // Deal remaining community cards until we have 5
    while (updatedCommunity.length < 5) {
      updatedCommunity.push(currentDeck.pop());
    }
    
    setCommunityCards(updatedCommunity);
    setDeck(currentDeck);
    resolveShowdown(updatedCommunity);
  };

  const handleAdjustRaise = (amount) => {
    if (gameState === "ante" || gameState === "showdown") return;
    
    // Max raise is limited by player's remaining money after calling current bet
    const callCost = currentCallAmount - playerBetThisRound;
    const maxAvailable = currentMoney - callCost;
    
    if (maxAvailable <= 0) {
      setRaiseBetAmount(0);
      alert("더 이상 추가 레이즈를 할 자본이 부족합니다. 올인 콜(All-in Call)만 가능합니다.");
      return;
    }

    if (amount === "all") {
      setRaiseBetAmount(maxAvailable);
    } else {
      setRaiseBetAmount((prev) => {
        const next = prev + amount;
        if (next < 10000) return 10000;
        if (next > maxAvailable) {
          alert(`더 이상 추가 레이즈할 자본이 부족합니다. 남은 전 재산인 ${formatMoney(maxAvailable)}으로 올인 레이즈(All-in Raise)를 설정합니다.`);
          return maxAvailable;
        }
        return next;
      });
    }
  };

  const handleRaise = () => {
    let raiseAmt = raiseBetAmount;
    if (raiseAmt <= 0) {
      alert("레이즈할 수 있는 금액이 없습니다. 콜 또는 폴드를 해주세요.");
      return;
    }

    const callCost = currentCallAmount - playerBetThisRound;
    const maxAvailableRaise = currentMoney - callCost;

    if (maxAvailableRaise <= 0) {
      alert("더 이상 추가 레이즈를 할 자본이 부족합니다. 올인 콜(All-in Call) 또는 폴드(Fold)를 진행해주세요.");
      setRaiseBetAmount(0);
      return;
    }

    if (raiseAmt > maxAvailableRaise) {
      alert(`더 이상 추가 레이즈할 자본이 부족합니다. 남은 전 재산인 ${formatMoney(maxAvailableRaise)}으로 올인 레이즈(All-in Raise)를 진행합니다.`);
      raiseAmt = maxAvailableRaise;
      setRaiseBetAmount(maxAvailableRaise);
    }

    const totalNewBet = currentCallAmount + raiseAmt;
    const additionalCost = totalNewBet - playerBetThisRound;

    onUpdateMoney(-additionalCost);
    setPlayerBetThisRound(totalNewBet);
    setCurrentCallAmount(totalNewBet);
    throwChip(additionalCost, true);
    
    const nextPot = pot + additionalCost;
    setPot(nextPot);

    setMessage(`플레이어가 ${formatMoney(raiseAmt)}만큼 레이즈(Raise) 했습니다.`);
    setTimeout(() => {
      computerDecision("raise", totalNewBet, nextPot);
    }, 800);
  };

  const handleFold = () => {
    setMessage("폴드(Fold) 하셨습니다. 이번 판돈은 컴퓨터가 가져갑니다.");
    setGameState("showdown");
    setWinnerMessage("컴퓨터 승리 (플레이어 Fold)");
    collectPotToWinner(false);
    setPot(0);
  };

  // Helper: Evaluate 2 pocket cards at preflop stage
  const evaluateStartingHand = (hand) => {
    if (hand.length < 2) return 0;
    const c1 = hand[0];
    const c2 = hand[1];
    const v1 = c1.value;
    const v2 = c2.value;

    // 1) Pocket pair
    if (v1 === v2) {
      return 85 + v1; // 87 ~ 99 pts
    }

    // 2) Ace high or high cards
    const highVal = Math.max(v1, v2);
    const lowVal = Math.min(v1, v2);
    let score = highVal * 3 + lowVal;

    // 3) Suited
    if (c1.suit === c2.suit) {
      score += 15;
    }

    // 4) Connector (e.g. 8-9)
    if (Math.abs(v1 - v2) === 1) {
      score += 10;
    }

    return score;
  };

  // 4. Computer AI Decision Logic
  const computerDecision = (playerAction, targetBet = 0, latestPot = pot) => {
    // Collect all visible cards for AI
    const visibleCards = [...computerHand.map(c => ({...c, value: c.value})), ...communityCards];
    const handStrength = evaluateHand(visibleCards);
    
    // Evaluate draw possibilities (Outs)
    let isFlushDraw = false;
    let isStraightDraw = false;

    if (communityCards.length > 0) {
      // Flush draw: 4 cards of the same suit
      const suitsCount = {};
      visibleCards.forEach(c => { suitsCount[c.suit] = (suitsCount[c.suit] || 0) + 1; });
      isFlushDraw = Object.values(suitsCount).some(cnt => cnt === 4);

      // Straight draw: 4 consecutive card values
      const uniqueVals = [...new Set(visibleCards.map(c => c.value))].sort((a,b) => a - b);
      // Check 4 consecutive cards
      for (let i = 0; i <= uniqueVals.length - 4; i++) {
        if (uniqueVals[i+3] - uniqueVals[i] === 3) {
          isStraightDraw = true;
          break;
        }
      }
    }

    // Classify strength level
    let strength = "weak"; // "weak", "medium", "strong", "very_strong"
    
    if (communityCards.length === 0) {
      // Preflop: evaluate 2 pocket cards
      const startScore = evaluateStartingHand(computerHand);
      if (startScore >= 70) strength = "very_strong";
      else if (startScore >= 50) strength = "strong";
      else if (startScore >= 40) strength = "medium";
      else strength = "weak";
    } else {
      // Flop, Turn, River
      if (handStrength.rank >= 3) {
        strength = "very_strong"; // Triple or better
      } else if (handStrength.rank === 2) {
        strength = "strong"; // Two Pair
      } else if (handStrength.rank === 1) {
        // High pair (J, Q, K, A) is strong, low pair is medium
        const pairVal = handStrength.kickers[0] || 0;
        strength = pairVal >= 11 ? "strong" : "medium";
      } else if (isFlushDraw || isStraightDraw) {
        strength = "medium"; // Draw situation
      } else {
        strength = "weak";
      }
    }

    // AI Bluffs at a 15% rate
    const isBluffing = Math.random() < 0.15;
    const effectiveStrength = isBluffing ? "strong" : strength;

    // Check Scenario
    if (playerAction === "check") {
      if (effectiveStrength === "very_strong") {
        // Aggressive raise with strong hand (50k or 100k)
        const aiRaise = Math.random() > 0.5 ? 50000 : 30000;
        setComputerBetThisRound(prev => prev + aiRaise);
        setCurrentCallAmount(prev => prev + aiRaise);
        setPot(prev => prev + aiRaise);
        throwChip(aiRaise, false);
        setMessage(`컴퓨터가 ${formatMoney(aiRaise)} 레이즈를 외쳤습니다.`);
      } else if (effectiveStrength === "strong") {
        // Modest raise (20k or 30k)
        const aiRaise = Math.random() > 0.5 ? 30000 : 20000;
        setComputerBetThisRound(prev => prev + aiRaise);
        setCurrentCallAmount(prev => prev + aiRaise);
        setPot(prev => prev + aiRaise);
        throwChip(aiRaise, false);
        setMessage(`컴퓨터가 ${formatMoney(aiRaise)} 레이즈를 외쳤습니다.`);
      } else {
        // Check back
        setMessage("컴퓨터도 체크하였습니다. 다음 단계로 진행합니다.");
        setTimeout(() => {
          advanceStage();
        }, 800);
      }
    } 
    // Raise Scenario
    else if (playerAction === "raise") {
      const callCost = targetBet - computerBetThisRound;
      
      if (effectiveStrength === "very_strong") {
        // Strong hand: Reraise or Call
        if (Math.random() < 0.5) {
          // Reraise by adding player's raise amount again
          const reraiseDiff = callCost;
          const totalAiBet = targetBet + reraiseDiff;
          
          setComputerBetThisRound(totalAiBet);
          setCurrentCallAmount(totalAiBet);
          throwChip(callCost + reraiseDiff, false);
          
          const nextPot = latestPot + callCost + reraiseDiff;
          setPot(nextPot);
          
          setMessage(`컴퓨터가 리레이즈(Reraise)하여 ${formatMoney(reraiseDiff)}을 추가 베팅했습니다.`);
        } else {
          // Just call
          setComputerBetThisRound(targetBet);
          setPot(prev => prev + callCost);
          throwChip(callCost, false);
          setMessage("컴퓨터가 플레이어의 레이즈를 콜(Call) 하였습니다.");
          setTimeout(() => {
            advanceStage();
          }, 800);
        }
      } else if (effectiveStrength === "strong") {
        // Call the raise
        setComputerBetThisRound(targetBet);
        setPot(prev => prev + callCost);
        throwChip(callCost, false);
        setMessage("컴퓨터가 플레이어의 레이즈를 콜(Call) 하였습니다.");
        setTimeout(() => {
          advanceStage();
        }, 800);
      } else if (effectiveStrength === "medium") {
        // Under pressure: Call only if callCost is low (<= 30k)
        if (callCost <= 30000) {
          setComputerBetThisRound(targetBet);
          setPot(prev => prev + callCost);
          throwChip(callCost, false);
          setMessage("컴퓨터가 고민 끝에 콜(Call)을 받았습니다.");
          setTimeout(() => {
            advanceStage();
          }, 800);
        } else {
          // Fold
          setMessage("컴퓨터가 추가 베팅이 너무 부담스러워 폴드(Fold) 하였습니다.");
          setGameState("showdown");
          setWinnerMessage(`${playerName} 승리 (컴퓨터 Fold)`);
          collectPotToWinner(true);
          onUpdateMoney(latestPot);
          setPot(0);
        }
      } else {
        // Weak hand: Fold
        setMessage("컴퓨터가 카드 세기가 부족하여 폴드(Fold) 하였습니다.");
        setGameState("showdown");
        setWinnerMessage(`${playerName} 승리 (컴퓨터 Fold)`);
        collectPotToWinner(true);
        onUpdateMoney(latestPot);
        setPot(0);
      }
    }
  };

  // 5. Advance Stage flow
  const advanceStage = () => {
    // Reset round bets
    setPlayerBetThisRound(0);
    setComputerBetThisRound(0);
    setCurrentCallAmount(0);

    const currentDeck = [...deck];
    
    if (gameState === "preflop") {
      // Flop 오픈 (커뮤니티 3장)
      const f1 = currentDeck.pop();
      const f2 = currentDeck.pop();
      const f3 = currentDeck.pop();
      
      setCommunityCards([f1, f2, f3]);
      setDeck(currentDeck);
      setGameState("flop");
      setMessage("플랍 카드 3장이 오픈되었습니다. 배팅을 진행하세요.");
    } 
    else if (gameState === "flop") {
      // Turn 오픈 (커뮤니티 4번째 카드)
      const t1 = currentDeck.pop();
      const updatedCommunity = [...communityCards, t1];
      
      setCommunityCards(updatedCommunity);
      setDeck(currentDeck);
      setGameState("turn");
      setMessage("턴 카드 1장이 추가되었습니다. 배팅을 진행하세요.");
    } 
    else if (gameState === "turn") {
      // River 오픈 (커뮤니티 5번째 카드)
      const r1 = currentDeck.pop();
      const updatedCommunity = [...communityCards, r1];
      
      setCommunityCards(updatedCommunity);
      setDeck(currentDeck);
      setGameState("river");
      setMessage("리버 카드 1장이 추가되었습니다. 마지막 배팅을 진행하세요.");
    } 
    else if (gameState === "river") {
      setGameState("showdown");
      resolveShowdown(communityCards);
    }
  };

  // 6. Resolve Showdown (Cards Reveal & Evaluate winner)
  const resolveShowdown = (finalCommunity) => {
    // Reveal Computer Cards
    const revealedComputerHand = computerHand.map(c => ({ ...c, faceUp: true }));
    setComputerHand(revealedComputerHand);

    // Evaluate Hands
    const playerFull = [...playerHand, ...finalCommunity];
    const computerFull = [
      ...revealedComputerHand.map(c => ({...c, value: c.value})), 
      ...finalCommunity
    ];

    const pEvaluation = evaluateHand(playerFull);
    const cEvaluation = evaluateHand(computerFull);

    setPlayerBestComboName(RANK_NAMES[pEvaluation.rank]);
    setComputerBestComboName(RANK_NAMES[cEvaluation.rank]);

    // Compare
    let winReason = "";
    let isPlayerWinner = false;
    let isDraw = false;

    if (pEvaluation.rank > cEvaluation.rank) {
      isPlayerWinner = true;
      winReason = `${RANK_NAMES[pEvaluation.rank]} 족보로 플레이어 승리!`;
    } else if (pEvaluation.rank < cEvaluation.rank) {
      isPlayerWinner = false;
      winReason = `${RANK_NAMES[cEvaluation.rank]} 족보로 컴퓨터 승리!`;
    } else {
      // Tie breaker using kickers
      const kickerDiff = compareKickers(pEvaluation.kickers, cEvaluation.kickers);
      if (kickerDiff > 0) {
        isPlayerWinner = true;
        winReason = `동일 족보 키커 우세로 플레이어 승리!`;
      } else if (kickerDiff < 0) {
        isPlayerWinner = false;
        winReason = `동일 족보 키커 우세로 컴퓨터 승리!`;
      } else {
        isDraw = true;
        winReason = "두 플레이어의 족보와 키커가 완전히 동일하여 비겼습니다.";
      }
    }

    if (isDraw) {
      setWinnerMessage("🤝 무승부 (Split Pot)");
      collectPotToWinner(true);
      onUpdateMoney(Math.floor(pot / 2));
    } else if (isPlayerWinner) {
      setWinnerMessage(`🏆 ${playerName} 승리!`);
      collectPotToWinner(true);
      onUpdateMoney(pot);
      // Highlight winning cards IDs
      setWinningCards(pEvaluation.bestCards.map(c => c.id));
    } else {
      setWinnerMessage("💀 컴퓨터 승리");
      collectPotToWinner(false);
      setWinningCards(cEvaluation.bestCards.map(c => c.id));
    }

    setPot(0);
    setMessage(winReason);
  };

  const handleNextGame = () => {
    setPlayerHand([]);
    setComputerHand([]);
    setCommunityCards([]);
    setWinnerMessage("");
    setPlayerBestComboName("");
    setComputerBestComboName("");
    setWinningCards([]);
    setThrownChips([]);
    setGameState("ante");
    setMessage("안테를 지불하고 다음 게임을 시작해 보세요.");
  };

  // Interactive Tour Step Configurations
  const tourSteps = [
    {
      target: ".computer-area",
      title: "컴퓨터(Host) 패",
      text: "상대방인 컴퓨터가 받은 2장의 카드 공간입니다. 쇼다운(Showdown, 패 오픈)이 되기 전까지는 카드가 비공개 상태로 뒤집어져 있습니다."
    },
    {
      target: ".community-area",
      title: "공유 카드 (Community Cards)",
      text: "바닥에 깔리는 공유 카드 구역입니다. 총 5장의 커뮤니티 카드가 게임 단계(플랍 3장, 턴 1장, 리버 1장)에 따라 순서대로 공개되어 내 카드와 조합하게 됩니다."
    },
    {
      target: ".player-area",
      title: "내 카드 (Player Hand)",
      text: "내가 받은 2장의 핸드 카드 구역입니다. 이 두 장과 바닥의 커뮤니티 카드를 엮어 최고의 5장 포커 족보를 만듭니다."
    },
    {
      target: ".pot-display-zone",
      title: "판돈 누적 포트 (Pot)",
      text: "현재까지 쌓인 판돈 총액을 보여주는 곳입니다. 배팅을 진행할수록 금액이 이곳에 모이며, 라운드 최종 승자가 이 포트 머니를 모두 획득합니다."
    },
    {
      target: ".poker-actions",
      title: "포커 배팅 액션 패널",
      text: "나의 턴일 때 배팅을 제어하는 컨트롤러입니다. 칩 선택 패널을 통해 원하는 추가 레이즈 금액을 정한 뒤 Raise를 누르거나, Check(체크), Call(베팅금 맞추기), Fold(기권)를 영리하게 조작해 보세요."
    }
  ];

  const handleStartTour = () => setTourStep(0);
  const handleNextTour = () => setTourStep(prev => prev + 1);
  const handlePrevTour = () => setTourStep(prev => prev - 1);
  const handleCompleteTour = () => setTourStep(null);

  const getTourHighlightClass = (targetClass) => {
    if (tourStep === null) return "";
    return tourSteps[tourStep].target === targetClass ? "tour-active-element" : "";
  };

  return (
    <div className="game-table holdem-table">
      {/* Table Header Actions */}
      <div className="table-header no-print">
        <button className="btn btn-secondary btn-icon" onClick={onBack}>
          <ArrowLeft size={16} /> 나가기
        </button>

        <div className="table-title">TEXAS HOLD'EM</div>

        <button className="btn btn-secondary btn-icon" onClick={handleStartTour}>
          <HelpCircle size={16} /> 도움말
        </button>
      </div>

      {/* Main Hold'em Arena */}
      <div className="holdem-arena">
        {/* Computer Hand Zone */}
        <div className={`computer-area game-zone ${getTourHighlightClass(".computer-area")}`}>
          <div className="zone-label">HOST HAND</div>
          <div className="cards-row">
            {computerHand.length === 0 ? (
              <div className="empty-cards-placeholder">호스트 카드 대기 중</div>
            ) : (
              computerHand.map((card, idx) => (
                <PlayingCard key={card.id} suit={card.suit} name={card.name} faceUp={card.faceUp} delay={idx * 150} />
              ))
            )}
          </div>
          {computerBestComboName && (
            <div className="hand-rank-banner">{computerBestComboName}</div>
          )}
        </div>

        {/* Community Card Zone */}
        <div className={`community-area game-zone ${getTourHighlightClass(".community-area")}`}>
          <div className="zone-label community-label">
            COMMUNITY CARDS (5장)
          </div>
          
          <div className="community-cards-row">
            {communityCards.length === 0 ? (
              <div className="empty-community-placeholder">커뮤니티 카드 대기 중</div>
            ) : (
              communityCards.map((card, idx) => {
                const isWinningCard = winningCards.includes(card.id);
                return (
                  <PlayingCard 
                    key={card.id} 
                    suit={card.suit} 
                    name={card.name} 
                    faceUp={true} 
                    isHighlighted={isWinningCard} 
                    delay={idx * 150}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Announcement Message Box */}
        <div className="game-announcer glass">
          {message || "7장 정통 홀덤 대결을 진행합니다. 안테를 지불하고 시작하세요."}
        </div>

        {/* Player Hand Zone */}
        <div className={`player-area game-zone ${getTourHighlightClass(".player-area")}`}>
          <div className="zone-label">{playerName} HAND</div>
          <div className="cards-row">
            {playerHand.length === 0 ? (
              <div className="empty-cards-placeholder">플레이어 카드 대기 중</div>
            ) : (
              playerHand.map((card, idx) => {
                const isWinningCard = winningCards.includes(card.id);
                return (
                  <PlayingCard 
                    key={card.id} 
                    suit={card.suit} 
                    name={card.name} 
                    faceUp={true} 
                    isHighlighted={isWinningCard} 
                    delay={idx * 150}
                  />
                );
              })
            )}
          </div>
          {playerBestComboName && (
            <div className="hand-rank-banner text-accent">{playerBestComboName}</div>
          )}
        </div>
      </div>

      {/* Bottom control panel */}
      <div className="table-controls-panel glass no-print">
        {/* Money Dashboard */}
        <div className="table-money-dashboard pot-display-zone">
          <div className="money-item">
            <span>보유 머니:</span>
            <strong className="text-accent">{formatMoney(currentMoney)}</strong>
          </div>
          <div className={`money-item pot-display ${getTourHighlightClass(".pot-display-zone")}`}>
            <span>총 포트 (Pot):</span>
            <strong className="text-gold flex-align-center"><Coins size={14} className="mr-1" /> {formatMoney(pot)}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="controls-action-box poker-actions">
          {/* Stage 1: Ante Payment */}
          {gameState === "ante" && (
            <div className="ante-controls w-full">
              <span className="ante-description">안테(기본 참가비): <strong>{formatMoney(MIN_ANTE)}</strong></span>
              <button className="btn btn-primary" onClick={handleStartGame}>
                안테 지불 및 게임 시작
              </button>
            </div>
          )}

          {/* Stage 2: Betting Rounds (preflop, flop, turn, river) */}
          {gameState !== "ante" && gameState !== "showdown" && (
            <div className="poker-bet-container w-full" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Chip Selector for custom raise */}
              <div className="chip-selector-group">
                <button type="button" className="chip-btn" onClick={() => handleAdjustRaise(10000)}>
                  <Coins size={14} /> +1만
                </button>
                <button type="button" className="chip-btn" onClick={() => handleAdjustRaise(30000)}>
                  <Coins size={14} /> +3만
                </button>
                <button type="button" className="chip-btn" onClick={() => handleAdjustRaise(50000)}>
                  <Coins size={14} /> +5만
                </button>
                <button type="button" className="chip-btn chip-all-in" onClick={() => handleAdjustRaise("all")}>
                  🚀 올인
                </button>
                <button type="button" className="chip-btn chip-reset" onClick={() => setRaiseBetAmount(10000)}>
                  <RotateCcw size={12} /> 초기화
                </button>
              </div>

              <div className="poker-bet-options w-full">
                {/* Fold Option */}
                <button className="btn btn-secondary btn-fold" onClick={handleFold}>
                  Fold (기권)
                </button>

                {/* Check Option (Only valid if player bet equals current call amount) */}
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCheck}
                  disabled={playerBetThisRound < currentCallAmount}
                >
                  Check (패스)
                </button>

                {/* Call Option (Match the current bet) */}
                <button 
                  className="btn btn-primary" 
                  onClick={handleCall}
                  disabled={playerBetThisRound === currentCallAmount}
                >
                  Call ({formatMoney(currentCallAmount - playerBetThisRound)})
                </button>

                {/* Raise Option */}
                <button 
                  className="btn btn-secondary text-flame" 
                  onClick={handleRaise}
                  disabled={currentMoney <= (currentCallAmount - playerBetThisRound) || raiseBetAmount <= 0}
                >
                  <Flame size={14} /> Raise (+{formatMoney(raiseBetAmount)})
                </button>
              </div>
            </div>
          )}

          {/* Stage 3: Showdown Winner Announcement */}
          {gameState === "showdown" && (
            <div className="showdown-actions w-full">
              <div className="poker-winner-stamp">
                {winnerMessage}
              </div>
              <button className="btn btn-primary btn-next-deal" onClick={handleNextGame}>
                새 판 받기 (Next Deal)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thrown Chips Visual layer */}
      <div className="thrown-chips-layer no-print">
        {thrownChips.map((chip) => {
          let chipClass = "chip-1k";
          if (chip.value >= 10000000) chipClass = "chip-10m";
          else if (chip.value >= 5000000) chipClass = "chip-5m";
          else if (chip.value >= 1000000) chipClass = "chip-1m";
          else if (chip.value >= 500000) chipClass = "chip-500k";
          else if (chip.value >= 100000) chipClass = "chip-100k";
          else if (chip.value >= 50000) chipClass = "chip-5k";
          else if (chip.value >= 30000) chipClass = "chip-3k";
          else if (chip.value >= 10000) chipClass = "chip-1k";

          return (
            <div
              key={chip.id}
              className={`casino-chip ${chipClass} ${chip.isPlayer ? "from-player" : "from-computer"} phase-${chip.phase}`}
              style={{
                "--rand-offset-x": `${chip.xOffset}px`,
                "--rand-offset-y": `${chip.yOffset}px`
              }}
            >
              <span>{chip.value >= 10000 ? `${chip.value / 10000}만` : chip.value}</span>
            </div>
          );
        })}
      </div>

      {/* Interactive Guide Tour */}
      <InteractiveTour
        steps={tourSteps}
        activeStep={tourStep}
        onNext={handleNextTour}
        onPrev={handlePrevTour}
        onComplete={handleCompleteTour}
      />

      {/* Bankruptcy Overlay (Only shows when hold'em game is showdown/resolved and player money is 0) */}
      {gameState === "showdown" && currentMoney <= 0 && (
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
