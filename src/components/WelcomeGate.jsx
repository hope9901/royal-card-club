import React, { useState } from "react";
import { HelpCircle, Star } from "lucide-react";

export default function WelcomeGate({ onStart }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 8) {
      alert("이름은 2자 이상 8자 이하로 입력해 주세요.");
      return;
    }
    onStart(cleanName);
  };

  return (
    <div className="welcome-gate-overlay">
      <div className="welcome-gate-card glass hover-lift">
        <div className="gate-header">
          <Star className="logo-spark" size={32} />
          <h1>ROYAL CARD CLUB</h1>
          <p>로얄 카드 클럽에 오신 것을 환영합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="gate-form">
          <div className="input-group">
            <label htmlFor="player-name-input">플레이어 닉네임 등록</label>
            <input
              type="text"
              id="player-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요 (2~8자)"
              maxLength={8}
              autoFocus
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-gate-start">
            클럽 입장하기
          </button>
        </form>

        <div className="gate-info-box">
          <HelpCircle size={16} className="info-icon" />
          <span>본 게임은 순수 오락용이며 실제 결제가 포함되지 않습니다. 새로고침 시 소지금은 항상 10만원으로 리셋됩니다.</span>
        </div>
      </div>
    </div>
  );
}
