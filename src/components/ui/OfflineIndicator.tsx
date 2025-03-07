"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false); // Default to false on server (safe initial state)

  useEffect(() => {
    // Only run on client-side
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine); // Set initial state on client
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null; // Don’t render on server or when online

  return (
    <div className="bg-red-500 text-white text-center p-2 mb-4">
      You are currently offline. Some features may be limited.
    </div>
  );
}
