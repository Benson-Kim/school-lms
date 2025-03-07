import { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void; // Optional for modal functionality
}

export function Card({ title, children, className = "", onClose }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}
    >
      <div className="bg-fuchsia-100 px-6 py-4 flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-charcoal">{title}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-charcoal hover:text-spicy-mix focus:outline-none"
          >
            ×
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
