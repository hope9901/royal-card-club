import React from "react";

// SVG components for card suits (to avoid OS/browser emoji rendering bugs)
const SuitIcon = ({ suit }) => {
  switch (suit) {
    case "spades":
      return (
        <svg viewBox="0 0 16 16" className="suit-icon spade-color" fill="currentColor">
          <path d="M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907" />
        </svg>
      );
    case "hearts":
      return (
        <svg viewBox="0 0 16 16" className="suit-icon heart-color" fill="currentColor">
          <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1" />
        </svg>
      );
    case "diamonds":
      return (
        <svg viewBox="0 0 16 16" className="suit-icon diamond-color" fill="currentColor">
          <path d="M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2" />
        </svg>
      );
    case "clubs":
      return (
        <svg viewBox="0 0 16 16" className="suit-icon club-color" fill="currentColor">
          <path d="M11.5 12.5a3.5 3.5 0 0 1-2.684-1.254 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5" />
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
          </div>
          
          {/* Center Giant Suit */}
          <div className="card-center-suit">
            <SuitIcon suit={suit} />
          </div>
          
          {/* Bottom Right Corner */}
          <div className="card-corner bottom-right">
            <span className="card-value-text">{name}</span>
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
