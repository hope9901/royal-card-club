import React, { useState, useEffect } from "react";
import WelcomeGate from "./components/WelcomeGate";
import Lobby from "./components/Lobby";
import BlackjackGame from "./components/BlackjackGame";
import HoldemGame from "./components/HoldemGame";
import { Coins } from "lucide-react";

const getApiUrl = () => {
  // Dynamically resolve server IP to support mobile devices connecting via local Wi-Fi
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${hostname}:5000/api/rankings`;
};

export default function App() {
  // 1. Session and Database states
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("royal_card_player_name") || "";
  });

  // Current session money is ALWAYS 100,000 KRW on load/refresh. Not stored in localStorage.
  const [currentMoney, setCurrentMoney] = useState(100000);

  const [maxBalance, setMaxBalance] = useState(() => {
    const saved = localStorage.getItem(`royal_card_max_balance_${playerName}`);
    return saved ? parseInt(saved, 10) : 100000;
  });

  const [rankings, setRankings] = useState([]);
  const [currentView, setCurrentView] = useState("lobby"); // "lobby", "blackjack", "holdem"

  // 2. Sync player name and fetch database rankings
  useEffect(() => {
    if (playerName) {
      localStorage.setItem("royal_card_player_name", playerName);
      const savedMax = localStorage.getItem(`royal_card_max_balance_${playerName}`);
      setMaxBalance(savedMax ? parseInt(savedMax, 10) : 100000);
      fetchRankings();
    }
  }, [playerName]);

  const fetchRankings = async () => {
    try {
      const res = await fetch(getApiUrl());
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (e) {
      console.error("Failed to fetch rankings from server:", e);
    }
  };

  const saveRanking = async (name, balance) => {
    try {
      const res = await fetch(getApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, maxBalance: balance })
      });
      if (res.ok) {
        fetchRankings(); // Refresh list from database
      }
    } catch (e) {
      console.error("Failed to save ranking to database:", e);
    }
  };

  // 3. User Actions
  const handleStartGame = (name) => {
    setPlayerName(name);
    setCurrentMoney(100000); // Reset session money
    
    // Check if player has an existing max balance, if not default to 100k
    const savedMax = localStorage.getItem(`royal_card_max_balance_${name}`);
    const initialMax = savedMax ? parseInt(savedMax, 10) : 100000;
    setMaxBalance(initialMax);

    // Register initial/existing score in database
    saveRanking(name, initialMax);
  };

  const handleChangeName = (newName) => {
    const oldName = playerName;
    setPlayerName(newName);
    
    // Migrate max balance to new name in localStorage
    const currentMax = maxBalance;
    localStorage.setItem(`royal_card_max_balance_${newName}`, currentMax.toString());
    
    // Register/update new name on database
    saveRanking(newName, currentMax);
  };

  const handleUpdateMoney = (amount) => {
    setCurrentMoney((prevMoney) => {
      const nextMoney = prevMoney + amount;
      
      // If player exceeds their historical maximum, update record and rankings in DB
      if (nextMoney > maxBalance) {
        setMaxBalance(nextMoney);
        localStorage.setItem(`royal_card_max_balance_${playerName}`, nextMoney.toString());
        saveRanking(playerName, nextMoney);
      }
      
      return nextMoney;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("royal_card_player_name");
    setPlayerName("");
    setCurrentMoney(100000);
    setMaxBalance(100000);
    setCurrentView("lobby");
  };

  const handleResetRankings = () => {
    if (window.confirm("정말로 모든 명예의 전당 로컬 정보와 플레이어 세션을 로그아웃 상태로 초기화하시겠습니까? (서버 DB 데이터는 유지됩니다)")) {
      localStorage.clear();
      setPlayerName("");
      setCurrentMoney(100000);
      setMaxBalance(100000);
      setCurrentView("lobby");
    }
  };

  const handleChargeMoney = () => {
    setCurrentMoney(100000);
  };

  // If name is not registered, force Welcome Gate
  if (!playerName) {
    return <WelcomeGate onStart={handleStartGame} />;
  }

  return (
    <div className="app-container">
      {/* Global Casino Header Bar */}
      <header className="casino-app-bar no-print">
        <div className="app-brand" onClick={() => setCurrentView("lobby")}>
          <Coins size={22} className="logo-coins" />
          <span className="brand-text">ROYAL CARD CLUB</span>
        </div>

        {currentView !== "lobby" && (
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView("lobby")}>
            로비로 가기
          </button>
        )}

        <button className="btn-reset-db" onClick={handleResetRankings} title="모든 기록 초기화">
          전체 초기화
        </button>
      </header>

      {/* Main viewport */}
      <main className="app-main-viewport">
        {currentView === "lobby" && (
          <Lobby
            playerName={playerName}
            currentMoney={currentMoney}
            maxBalance={maxBalance}
            rankings={rankings}
            onSelectGame={setCurrentView}
            onChangeName={handleChangeName}
            onChargeMoney={handleChargeMoney}
            onLogout={handleLogout}
          />
        )}

        {currentView === "blackjack" && (
          <BlackjackGame
            playerName={playerName}
            currentMoney={currentMoney}
            onUpdateMoney={handleUpdateMoney}
            onBack={() => setCurrentView("lobby")}
            onChargeMoney={handleChargeMoney}
          />
        )}

        {currentView === "holdem" && (
          <HoldemGame
            playerName={playerName}
            currentMoney={currentMoney}
            onUpdateMoney={handleUpdateMoney}
            onBack={() => setCurrentView("lobby")}
            onChargeMoney={handleChargeMoney}
          />
        )}
      </main>
    </div>
  );
}
