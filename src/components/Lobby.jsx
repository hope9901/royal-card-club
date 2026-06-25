import React, { useState } from "react";
import { Trophy, Play, User, Edit2, BookOpen, Coins, Check } from "lucide-react";

export default function Lobby({
  playerName,
  currentMoney,
  maxBalance,
  rankings,
  onSelectGame,
  onChangeName,
  onChargeMoney,
  onLogout
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(playerName);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleTab, setRuleTab] = useState("blackjack"); // "blackjack" or "holdem"

  const handleEditNameSubmit = (e) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (cleanName.length < 2 || cleanName.length > 8) {
      alert("이름은 2자 이상 8자 이하로 입력해 주세요.");
      return;
    }
    onChangeName(cleanName);
    setIsEditingName(false);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW"
    }).format(amount);
  };

  return (
    <div className="lobby-container">
      {/* Header Profile Dashboard */}
      <div className="lobby-profile-header glass">
        <div className="profile-details">
          <div className="profile-avatar">
            <User size={28} />
          </div>
          <div className="profile-name-area">
            {isEditingName ? (
              <form onSubmit={handleEditNameSubmit} className="name-edit-form">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={8}
                  className="name-edit-input"
                  autoFocus
                />
                <button type="submit" className="name-edit-btn save">
                  <Check size={14} />
                </button>
              </form>
            ) : (
              <div className="name-display">
                <h2>{playerName} 님</h2>
                <button className="name-edit-btn" onClick={() => setIsEditingName(true)}>
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <span className="profile-grade">VIP 멤버</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm mt-3" 
              onClick={onLogout}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", alignSelf: "flex-start" }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="profile-money-area">
          <div className="money-box">
            <span className="money-label">현재 머니</span>
            <span className="money-value text-accent">{formatMoney(currentMoney)}</span>
          </div>
          <div className="money-box divider-left">
            <span className="money-label">개인 최고 기록</span>
            <span className="money-value text-gold">{formatMoney(maxBalance)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Game Selector & Leaderboard */}
      <div className="lobby-grid">
        {/* Game Selector Area */}
        <div className="lobby-games-section">
          <div className="section-header">
            <h2>게임 테이블 선택</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsRuleModalOpen(true)}>
              <BookOpen size={14} /> 게임 규칙 도감
            </button>
          </div>

          <div className="games-menu">
            {/* Blackjack Card */}
            <div className="game-menu-card glass hover-lift" onClick={() => onSelectGame("blackjack")}>
              <div className="game-banner blackjack-bg">
                <span className="game-card-icon">🃏</span>
              </div>
              <div className="game-card-body">
                <h3>블랙잭 (Blackjack)</h3>
                <p>딜러의 패를 이겨라! 21에 가장 가까운 점수를 만드는 정통 딜러 대결형 카드 게임.</p>
                <div className="game-card-footer">
                  <span className="min-bet-badge">기본 10만 원 리셋 시작</span>
                  <button className="btn btn-primary btn-play">
                    <Play size={14} fill="white" /> 입장
                  </button>
                </div>
              </div>
            </div>

            {/* Texas Hold'em Card */}
            <div className="game-menu-card glass hover-lift" onClick={() => onSelectGame("holdem")}>
              <div className="game-banner holdem-bg">
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "4rem", height: "4rem", color: "var(--color-gold)", filter: "drop-shadow(0 0 10px rgba(212, 175, 55, 0.4))" }}>
                  <path d="M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907" />
                </svg>
              </div>
              <div className="game-card-body">
                <h3>텍사스 홀덤 포커 (Texas Hold'em)</h3>
                <p>컴퓨터를 상대로 실시간 칩 배팅 심리전을 펼치는 정통 7장 텍사스 홀덤 카드 게임.</p>
                <div className="game-card-footer">
                  <span className="min-bet-badge">정통 7장 홀덤</span>
                  <button className="btn btn-primary btn-play">
                    <Play size={14} fill="white" /> 입장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Area */}
        <div className="lobby-leaderboard-section glass">
          <div className="leaderboard-header">
            <Trophy size={20} className="trophy-gold" />
            <h3>명예의 전당 (Top 10 랭킹)</h3>
          </div>

          <div className="leaderboard-body">
            {rankings.length === 0 ? (
              <div className="empty-leaderboard">
                <Trophy size={32} className="empty-trophy" />
                <p>등록된 랭킹 기록이 없습니다.</p>
                <span>게임을 플레이해 첫 랭커가 되어보세요!</span>
              </div>
            ) : (
              <div className="ranking-table-wrapper">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th className="th-rank">순위</th>
                      <th className="th-name">이름</th>
                      <th className="th-money">최대 자산</th>
                      <th className="th-date">등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.slice(0, 10).map((rank, index) => (
                      <tr key={index} className={rank.name === playerName ? "rank-me" : ""}>
                        <td className="td-rank">
                          {index + 1 === 1 ? "🥇" : index + 1 === 2 ? "🥈" : index + 1 === 3 ? "🥉" : `${index + 1}위`}
                        </td>
                        <td className="td-name">{rank.name}</td>
                        <td className="td-money text-gold">{formatMoney(rank.maxBalance)}</td>
                        <td className="td-date">{rank.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {isRuleModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsRuleModalOpen(false)}>
          <div className="modal-content rules-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>게임 가이드 및 룰 도감</h3>
              <button className="modal-close" onClick={() => setIsRuleModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <div className="rules-modal-tabs">
              <button
                className={`rules-tab ${ruleTab === "blackjack" ? "active" : ""}`}
                onClick={() => setRuleTab("blackjack")}
              >
                블랙잭 규칙
              </button>
              <button
                className={`rules-tab ${ruleTab === "holdem" ? "active" : ""}`}
                onClick={() => setRuleTab("holdem")}
              >
                홀덤 규칙 & 족보
              </button>
            </div>

            <div className="modal-body rules-modal-body">
              {ruleTab === "blackjack" ? (
                <div className="rule-desc-pane">
                  <h4>블랙잭 (Blackjack) 게임 방법</h4>
                  <p className="rule-intro-text">카드의 합산 점수가 21에 가장 가까운 쪽이 승리하는 정통 카지노 카드 대결입니다.</p>
                  
                  <ul className="rules-bullet-list">
                    <li><strong>카드 값 계산:</strong> 2~10은 숫자 그대로, J/Q/K는 10으로 계산됩니다. 에이스(A)는 합계에 따라 1 또는 11 중 가장 유리한 값으로 자동 계산됩니다.</li>
                    <li><strong>딜러의 의무:</strong> 딜러는 카드 합이 16 이하일 때 무조건 의무적으로 카드를 더 받아야 하며, 17 이상이면 추가 카드를 받지 않고 멈춥니다(Stand).</li>
                    <li><strong>플레이어 옵션:</strong>
                      <ul>
                        <li><strong>Hit:</strong> 카드 1장 더 받기</li>
                        <li><strong>Stand:</strong> 카드 그만 받고 딜러와 점수 겨루기</li>
                        <li><strong>Double Down:</strong> 배팅액을 2배로 올리고 카드 단 1장만 더 받기</li>
                        <li><strong>Surrender:</strong> 패배를 인정하고 배팅금의 절반을 돌려받고 기권</li>
                      </ul>
                    </li>
                    <li><strong>버스트 (Burst):</strong> 카드 합이 21을 초과하면 그 즉시 패배합니다. 플레이어가 먼저 21을 초과하면 딜러의 21 초과 여부와 상관없이 플레이어의 패배가 됩니다.</li>
                  </ul>
                </div>
              ) : (
                <div className="rule-desc-pane">
                  <h4>텍사스 홀덤 포커 (Texas Hold'em) 게임 방법</h4>
                  <p className="rule-intro-text">컴퓨터를 상대로 배팅 심리전을 거쳐, 공유 카드와 개인 카드로 족보를 완성하여 겨루는 카드 게임입니다.</p>
                  
                  <ul className="rules-bullet-list">
                    <li><strong>게임 방식:</strong> 내 카드 2장 + 커뮤니티 카드 5장을 깝니다. 총 7장의 카드 중에서 최상의 5장 조합을 자동으로 선택하여 Host의 조합과 대결합니다.</li>
                    <li><strong>배팅 옵션:</strong>
                      <ul>
                        <li><strong>Fold:</strong> 기권 (배팅한 돈을 잃고 라운드 포기)</li>
                        <li><strong>Check:</strong> 베팅금을 추가하지 않고 순서를 패스 (이전 사람이 베팅을 올리지 않았을 때만 가능)</li>
                        <li><strong>Call:</strong> 이전 플레이어의 베팅금과 동일한 금액을 채워서 게임을 진행</li>
                        <li><strong>Raise:</strong> 베팅금을 올려 상대방에게 추가 베팅을 유도</li>
                      </ul>
                    </li>
                    <li><strong>포커 족보 순서 (강함에서 약함):</strong>
                      <ol className="poker-rank-list">
                        <li><strong>로열 스트레이트 플러시:</strong> 무늬가 같은 A, K, Q, J, 10</li>
                        <li><strong>스트레이트 플러시:</strong> 무늬가 같고 순서가 연속된 5장</li>
                        <li><strong>포카드:</strong> 숫자가 같은 카드 4장</li>
                        <li><strong>풀하우스:</strong> 같은 숫자 3장 + 같은 숫자 2장 (트리플 + 원페어)</li>
                        <li><strong>플러시:</strong> 무늬가 같은 카드 5장</li>
                        <li><strong>스트레이트:</strong> 무늬와 무관하게 숫자가 연속된 5장</li>
                        <li><strong>트리플:</strong> 숫자가 같은 카드 3장</li>
                        <li><strong>투페어:</strong> 같은 숫자의 페어가 2쌍</li>
                        <li><strong>원페어:</strong> 같은 숫자의 페어가 1쌍</li>
                        <li><strong>하이카드:</strong> 족보가 없을 때 가장 높은 카드 대결</li>
                      </ol>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsRuleModalOpen(false)}>
                이해했습니다
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bankruptcy Overlay (Only shows in Lobby if currentMoney is 0) */}
      {currentMoney <= 0 && (
        <div className="bankruptcy-overlay no-print">
          <div className="bankruptcy-card glass">
            <h2>💸 BANKRUPT (파산)</h2>
            <p>보유 금액이 없어 게임을 시작할 수 없습니다.</p>
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
