// components/common/Modal.jsx
import React, { useEffect } from "react";

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actions,
  maxWidth = "md",
  className = "",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-slate-900 rounded-xl p-6 w-full shadow-lg border border-slate-800 ${maxWidthClasses[maxWidth] || maxWidthClasses.md} ${className}`}>
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          {children}
        </div>

        {actions && (
          <div className="flex justify-end space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;