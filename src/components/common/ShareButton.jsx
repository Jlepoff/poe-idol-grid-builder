// components/common/ShareButton.jsx
import React, { useState, useCallback, useMemo } from "react";
import Button from "./Button";
import { generateShareableURL, copyToClipboard } from "../../utils/storage/storageUtils";

const ShareIcon = () => (
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
);

const Tooltip = ({ message }) => (
  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap border border-slate-700">
    {message}
  </div>
);

const ShareButton = ({ gridState, inventory }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleShare = useCallback(async () => {
    setIsCopying(true);

    try {
      const shareableURL = generateShareableURL(gridState, inventory);
      await copyToClipboard(shareableURL);
      setShowTooltip(true);
      
      setTimeout(() => setShowTooltip(false), 3000);
    } catch (error) {
      console.error("Failed to share layout:", error);
    } finally {
      setIsCopying(false);
    }
  }, [gridState, inventory]);

  const buttonText = useMemo(() => 
    isCopying ? "Copying..." : "Share Layout", 
  [isCopying]);

  return (
    <div className="relative">
      <Button
        variant="blue"
        onClick={handleShare}
        disabled={isCopying}
        title="Share your idol layout with a link"
        className="flex items-center gap-2"
      >
        <ShareIcon />
        {buttonText}
      </Button>

      {showTooltip && <Tooltip message="Link copied to clipboard" />}
    </div>
  );
};

export default React.memo(ShareButton);