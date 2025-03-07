"use client";
import { Toaster as HotToaster, toast } from "react-hot-toast";

// Comprehensive toast options interface
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning" | "destructive";
  duration?: number;
}

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#363636",
          color: "#fff",
          borderRadius: "0.5rem",
          maxWidth: "400px",
        },
        duration: 4000,
      }}
    />
  );
}

// Enhanced showToast utility function
export function showToast(options: ToastOptions | string) {
  // Handle both string and object inputs
  if (typeof options === "string") {
    return toast(options);
  }

  const { title, description, variant = "info", duration = 4000 } = options;

  // Combine title and description if both exist
  const message =
    title && description
      ? `${title}: ${description}`
      : title || description || "";

  switch (variant) {
    case "success":
      return toast.success(message, { duration });
    case "error":
      return toast.error(message, { duration });
    case "warning":
      return toast(message, {
        icon: "⚠️",
        style: {
          background: "#FFA500",
          color: "#000",
        },
        duration,
      });
    case "destructive":
      return toast(message, {
        icon: "🚨",
        style: {
          background: "#DC143C",
          color: "#fff",
        },
        duration,
      });
    default:
      return toast(message, { duration });
  }
}
