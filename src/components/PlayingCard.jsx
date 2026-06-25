import React from "react";

// Unicode components for card suits
const SuitIcon = ({ suit }) => {
  switch (suit) {
    case "spades":
      return <span className="suit-char spade-color">♠</span>;
    case "hearts":
      return <span className="suit-char heart-color">♥</span>;
    case "diamonds":
      return <span className="suit-char diamond-color">♦</span>;
    case "clubs":
      return <span className="suit-char club-color">♣</span>;
    default:
      return null;
  }
};

export default function PlayingCard({ suit, name, faceUp = true, isHighlighted = false, delay = 0 }) {
  const isRed = suit === "hearts" || suit === "diamonds";
  
  return (
    <div 
      className={`card-wrapper card-deal-anim ${isHighlighted ? "highlighted-win" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`card-inner ${faceUp ? "face-up" : "face-down"}`}>
        {/* Card Front (Face Up) */}
        <div className={`card-front ${isRed ? "card-red" : "card-black"}`}>
          {/* Top Left Corner */}
          <div className="card-corner top-left">
            <span className="card-value-text">{name}</span>
            <div className="corner-suit-wrapper">
              <SuitIcon suit={suit} />
            </div>
          </div>
          
          {/* Center Giant Suit */}
          <div className="card-center-suit">
            <SuitIcon suit={suit} />
          </div>
          
          {/* Bottom Right Corner */}
          <div className="card-corner bottom-right">
            <span className="card-value-text">{name}</span>
            <div className="corner-suit-wrapper">
              <SuitIcon suit={suit} />
            </div>
          </div>
        </div>

        {/* Card Back (Face Down) - Premium Gold-Navy Pattern */}
        <div className="card-back">
          <div className="card-back-pattern">
            <svg viewBox="0 0 100 145" width="100%" height="100%">
              <rect width="100" height="145" fill="#0d1321" rx="8" />
              <rect x="5" y="5" width="90" height="135" fill="none" stroke="#d4af37" strokeWidth="1" rx="6" />
              <rect x="8" y="8" width="84" height="129" fill="none" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="3 3" rx="5" />
              
              {/* Gold Geometric Diamonds in Center */}
              <polygon points="50,45 70,72.5 50,100 30,72.5" fill="none" stroke="#d4af37" strokeWidth="1.5" />
              <circle cx="50" cy="72.5" r="10" fill="none" stroke="#d4af37" strokeWidth="1" />
              <polygon points="50,55 62,72.5 50,90 38,72.5" fill="#d4af37" opacity="0.15" />
              
              {/* Corner Accents */}
              <circle cx="15" cy="15" r="3" fill="#d4af37" />
              <circle cx="85" cy="15" r="3" fill="#d4af37" />
              <circle cx="15" cy="130" r="3" fill="#d4af37" />
              <circle cx="85" cy="130" r="3" fill="#d4af37" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
