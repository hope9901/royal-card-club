import React from "react";

// SVG components for card suits
const SuitIcon = ({ suit }) => {
  switch (suit) {
    case "spades":
      return (
        <svg viewBox="0 0 100 100" className="suit-svg spade-color">
          <path d="M50,15 C35,40 10,45 10,65 C10,80 25,90 50,80 C75,90 90,80 90,65 C90,45 65,40 50,15 Z" />
          <path d="M50,65 L35,90 L65,90 Z" />
        </svg>
      );
    case "hearts":
      return (
        <svg viewBox="0 0 100 100" className="suit-svg heart-color">
          <path d="M50,30 C50,10 15,10 15,40 C15,65 50,85 50,90 C50,85 85,65 85,40 C85,10 50,10 50,30 Z" />
        </svg>
      );
    case "diamonds":
      return (
        <svg viewBox="0 0 100 100" className="suit-svg diamond-color">
          <path d="M50,10 L85,50 L50,90 L15,50 Z" />
        </svg>
      );
    case "clubs":
      return (
        <svg viewBox="0 0 100 100" className="suit-svg club-color">
          <circle cx="50" cy="35" r="20" />
          <circle cx="32" cy="60" r="20" />
          <circle cx="68" cy="60" r="20" />
          <path d="M50,55 L35,88 L65,88 Z" />
        </svg>
      );
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
