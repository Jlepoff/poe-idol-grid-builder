// components/ShareButton.jsx
import React, { useState } from "react";
import { generateShareableURL, copyToClipboard } from "../utils/storageUtils";

function ShareButton({ gridState, inventory }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleShare = async () => {
    setIsCopying(true);

    const shareableURL = generateShareableURL(gridState, inventory);
    const copied = await copyToClipboard(shareableURL);

    setShowTooltip(true);
    setIsCopying(false);

    setTimeout(() => setShowTooltip(false), 3000);
  };

  return (
    <div className="relative">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
        onClick={handleShare}
        disabled={isCopying}
        title="Share your idol layout with a link"
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
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {isCopying ? "Copying..." : "Share Layout"}
      </button>

      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap border border-slate-700">
          Link copied to clipboard
        </div>
      )}
    </div>
  );
}

export default ShareButton;