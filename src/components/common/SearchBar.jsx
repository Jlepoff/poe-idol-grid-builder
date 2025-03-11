// components/common/SearchBar.jsx
import React from "react";

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  onClear,
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        className="w-full bg-slate-800 py-2.5 px-3 pr-8 rounded-md text-sm border border-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
      <div className="absolute right-3 top-2.5 text-slate-500 flex items-center">
        {value && onClear && (
          <button 
            onClick={onClear} 
            className="text-slate-400 hover:text-slate-300 transition-colors mr-2"
            type="button"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}

export default SearchBar;