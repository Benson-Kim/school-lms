"use client";

import { useState } from "react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}: CheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    if (disabled) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onCheckedChange?.(newChecked);
  };

  return (
    <label
      className={`flex items-center space-x-2 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
      />
      <div
        className={`w-5 h-5 flex items-center justify-center border-2 rounded transition-all ${
          isChecked ? "bg-blue-500 border-blue-500" : "bg-white border-gray-400"
        } ${
          disabled ? "border-gray-300 bg-gray-200" : "hover:border-blue-400"
        }`}
      >
        {isChecked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L9 11.586l6.293-6.293a1 1 0 0 1 1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </label>
  );
}
