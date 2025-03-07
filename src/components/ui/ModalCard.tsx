"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card } from "./Card";

interface ModalCardProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ModalCard({
  title,
  children,
  isOpen,
  onClose,
  className = "",
}: ModalCardProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
      <div
        ref={modalRef}
        className="w-[80%] sm:w-[80%] md:w-[75%] lg:w-[50%] 2xl:w-[50%] max-h-[90vh] overflow-y-auto"
      >
        <Card
          title={title}
          onClose={onClose}
          className={`bg-mellow-apricot border-sweet-brown ${className}`}
        >
          {children}
        </Card>
      </div>
    </div>,
    document.body,
  );
}
