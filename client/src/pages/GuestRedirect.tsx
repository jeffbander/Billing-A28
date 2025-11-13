import { useEffect } from "react";
import { useLocation } from "wouter";
import { startGuestSession } from "@/lib/guestSession";

/**
 * This page sets up a guest session and redirects to the dashboard
 */
export default function GuestRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    startGuestSession();
    setLocation("/dashboard");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Setting up guest session...</p>
      </div>
    </div>
  );
}
