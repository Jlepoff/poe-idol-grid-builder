// components/common/KeyboardShortcuts.jsx
import React, { useEffect, useMemo } from "react";
import Modal from "./Modal";
import Button from "./Button";

const SHORTCUTS = [
  { key: "Right-click", description: "Remove idol from grid or inventory" },
  { key: "Ctrl + V", description: "Paste idol from Path of Exile" },
  { key: "Press ?", description: "Show/hide this help dialog" },
  { key: "Press Esc", description: "Close dialog windows" },
];

const KeyboardShortcuts = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
        return;
      }

      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const actions = useMemo(() => (
    <Button onClick={onClose}>Close</Button>
  ), [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      actions={actions}
    >
      <div className="space-y-4">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-750">
            <span className="font-medium text-indigo-300">{shortcut.key}</span>
            <span className="text-slate-300">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default React.memo(KeyboardShortcuts);