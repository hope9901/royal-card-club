import React from "react";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";

export default function InteractiveTour({ steps, activeStep, onNext, onPrev, onComplete }) {
  if (activeStep === null || !steps || steps.length === 0) return null;

  const currentStep = steps[activeStep];
  const isFirst = activeStep === 0;
  const isLast = activeStep === steps.length - 1;

  return (
    <div className="tour-overlay-container no-print">
      {/* Dark backdrop */}
      <div className="tour-backdrop" onClick={onComplete}></div>

      {/* Guide dialog box */}
      <div className="tour-dialog glass">
        <div className="tour-header">
          <div className="tour-title-group">
            <Sparkles size={16} className="tour-sparkle" />
            <span className="tour-step-badge">가이드 {activeStep + 1} / {steps.length}</span>
          </div>
          <button className="tour-close-btn" onClick={onComplete} title="가이드 종료">
            <X size={16} />
          </button>
        </div>

        <div className="tour-body">
          <h3>{currentStep.title}</h3>
          <p>{currentStep.text}</p>
        </div>

        <div className="tour-footer">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onPrev}
            disabled={isFirst}
          >
            <ChevronLeft size={16} /> 이전
          </button>

          <div className="tour-actions-right">
            {!isLast ? (
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={onNext}
              >
                다음 <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-success btn-sm" 
                onClick={onComplete}
              >
                가이드 완료
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
