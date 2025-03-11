// components/strategies/StrategiesButton.jsx
import React, { useState } from "react";
import StrategiesModal from "./StrategiesModal";

function StrategiesButton({ onLoadStrategy }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className="bg-amber-600 hover:bg-amber-500 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
        onClick={() => setShowModal(true)}
        title="Load community strategies"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Strategies
      </button>

      {showModal && (
        <StrategiesModal onClose={() => setShowModal(false)} onLoadStrategy={onLoadStrategy} />
      )}
    </>
  );
}

export default StrategiesButton;