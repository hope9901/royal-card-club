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
  const [gameMode, setGameMode] = useState("7card"); // "7card" or "5card"
  const [gameState, setGameState] = useState("ante"); // "ante", "preflop", "flop", "turn", "river", "showdown"
  
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  
  const [pot, setPot] = useState(0);
  const [currentCallAmount, setCurrentCallAmount] = useState(0);
  const [playerBetThisRound, setPlayerBetThisRound] = useState(0);
  const [computerBetThisRound, setComputerBetThisRound] = useState(0);
  
  const [message, setMessage] = useState("");
  const [winnerMessage, setWinnerMessage] = useState("");
  const [playerBestComboName, setPlayerBestComboName] = useState("");
  const [computerBestComboName, setComputerBestComboName] = useState("");
  const [winningCards, setWinningCards] = useState([]); // Best 5 cards for winner highlighing
  
  // Interactive Tour State
  const [tourStep, setTourStep] = useState(null);

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
      alert("콜을 외치기 위한 머니가 부족합니다. 올인을 진행해 주세요.");
      return;
    }

    onUpdateMoney(-callCost);
    setPlayerBetThisRound(currentCallAmount);
    setPot(prev => prev + callCost);

    setMessage("콜을 하셨습니다. 다음 단계로 진행합니다.");
    setTimeout(() => {
      advanceStage();
    }, 800);
  };

  const handleRaise = (raiseAmt = 20000) => {
    const totalNewBet = currentCallAmount + raiseAmt;
    const additionalCost = totalNewBet - playerBetThisRound;
    
    if (additionalCost > currentMoney) {
      alert("레이즈를 위한 머니가 부족합니다.");
      return;
    }

    onUpdateMoney(-additionalCost);
    setPlayerBetThisRound(totalNewBet);
    setCurrentCallAmount(totalNewBet);
    
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
    // Computer takes pot
    setPot(0);
  };

  // 4. Computer AI Decision Logic
  const computerDecision = (playerAction, targetBet = 0, latestPot = pot) => {
    // Basic AI strength evaluation based on current visible cards
    const visibleCards = [...computerHand.map(c => ({...c, value: c.value})), ...communityCards];
    const handStrength = evaluateHand(visibleCards);
    
    // AI has: rank (0 to 9)
    // Check scenario
    if (playerAction === "check") {
      // If computer has a decent hand, it might Raise, else it Checks
      if (handStrength.rank >= 1 && Math.random() > 0.5) {
        // Raise
        const aiRaise = 20000;
        setComputerBetThisRound(prev => prev + aiRaise);
        setCurrentCallAmount(prev => prev + aiRaise);
        setPot(prev => prev + aiRaise);
        setMessage(`컴퓨터가 ${formatMoney(aiRaise)} 레이즈를 외쳤습니다.`);
      } else {
        // Check
        setMessage("컴퓨터도 체크하였습니다. 다음 단계로 진행합니다.");
        setTimeout(() => {
          advanceStage();
        }, 800);
      }
    } 
    // Raise scenario (computer needs to match targetBet)
    else if (playerAction === "raise") {
      const callCost = targetBet - computerBetThisRound;
      
      // Decision factors: Hand strength & Random bluffs
      const winProbability = handStrength.rank >= 2 ? 0.9 : handStrength.rank === 1 ? 0.7 : 0.3;
      
      if (Math.random() < winProbability) {
        // Call the raise
        setComputerBetThisRound(targetBet);
        setPot(prev => prev + callCost);
        setMessage("컴퓨터가 플레이어의 레이즈를 콜(Call) 하였습니다.");
        setTimeout(() => {
          advanceStage();
        }, 800);
      } else {
        // Fold
        setMessage("컴퓨터가 카드 세기가 부족하여 폴드(Fold) 하였습니다.");
        setGameState("showdown");
        setWinnerMessage(`${playerName} 승리 (컴퓨터 Fold)`);
        // Player takes pot (utilize latestPot parameter to bypass stale closure values)
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
      // 5장/7장 공통: Flop 오픈 (커뮤니티 3장)
      const f1 = currentDeck.pop();
      const f2 = currentDeck.pop();
      const f3 = currentDeck.pop();
      
      setCommunityCards([f1, f2, f3]);
      setDeck(currentDeck);
      
      if (gameMode === "5card") {
        // 5장 홀덤은 플랍 이후 즉시 쇼다운
        setGameState("showdown");
        resolveShowdown([f1, f2, f3]);
      } else {
        setGameState("flop");
        setMessage("플랍 카드 3장이 오픈되었습니다. 배팅을 진행하세요.");
      }
    } 
    else if (gameState === "flop" && gameMode === "7card") {
      // Turn 오픈 (커뮤니티 4번째 카드)
      const t1 = currentDeck.pop();
      const updatedCommunity = [...communityCards, t1];
      
      setCommunityCards(updatedCommunity);
      setDeck(currentDeck);
      setGameState("turn");
      setMessage("턴 카드 1장이 추가되었습니다. 배팅을 진행하세요.");
    } 
    else if (gameState === "turn" && gameMode === "7card") {
      // River 오픈 (커뮤니티 5번째 카드)
      const r1 = currentDeck.pop();
      const updatedCommunity = [...communityCards, r1];
      
      setCommunityCards(updatedCommunity);
      setDeck(currentDeck);
      setGameState("river");
      setMessage("리버 카드 1장이 추가되었습니다. 마지막 배팅을 진행하세요.");
    } 
    else if (gameState === "river" && gameMode === "7card") {
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
      onUpdateMoney(Math.floor(pot / 2));
    } else if (isPlayerWinner) {
      setWinnerMessage(`🏆 ${playerName} 승리!`);
      onUpdateMoney(pot);
      // Highlight winning cards IDs
      setWinningCards(pEvaluation.bestCards.map(c => c.id));
    } else {
      setWinnerMessage("💀 컴퓨터 승리");
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
      text: "바닥에 깔리는 공유 카드 구역입니다. 7장 모드에서는 5장(플랍 3장, 턴 1장, 리버 1장), 5장 모드에서는 3장(플랍 3장)이 순서대로 공개되어 내 카드와 조합하게 됩니다."
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
      text: "나의 턴일 때 배팅을 제어하는 컨트롤러입니다. Check(체크), Call(베팅금 맞추기), Raise(베팅금 올리기), Fold(기권)를 칩 현황에 맞춰 영리하게 조작해 보세요."
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

        <div className="holdem-mode-selector">
          <button
            className={`mode-toggle-btn ${gameMode === "7card" ? "active" : ""}`}
            onClick={() => gameState === "ante" && setGameMode("7card")}
            disabled={gameState !== "ante"}
          >
            7장 홀덤
          </button>
          <button
            className={`mode-toggle-btn ${gameMode === "5card" ? "active" : ""}`}
            onClick={() => gameState === "ante" && setGameMode("5card")}
            disabled={gameState !== "ante"}
          >
            5장 미니
          </button>
        </div>

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
            COMMUNITY CARDS ({gameMode === "7card" ? "5장" : "3장"})
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
          {message || `${gameMode === "7card" ? "7장 정통 홀덤" : "5장 플랍 홀덤"} 대결을 진행합니다. 안테를 지불하고 시작하세요.`}
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
                onClick={() => handleRaise(20000)}
                disabled={currentMoney < (currentCallAmount + 20000 - playerBetThisRound)}
              >
                <Flame size={14} /> Raise (+2만)
              </button>
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
