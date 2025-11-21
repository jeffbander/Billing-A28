import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/auth" } =
    options ?? {};

  const { isLoaded: clerkLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const utils = trpc.useUtils();

  // Fetch user from our database (synced from Clerk)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Only fetch if Clerk says we're signed in
    enabled: clerkLoaded && isSignedIn,
  });

  // Legacy logout mutation (for API compatibility)
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      // Sign out from Clerk first
      await signOut();
      // Also call the legacy logout mutation for cleanup
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      // Ignore errors during logout
      console.error("[Auth] Logout error:", error);
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      // Clear any local storage
      localStorage.removeItem("manus-runtime-user-info");
    }
  }, [signOut, logoutMutation, utils]);

  const state = useMemo(() => {
    // Loading state: either Clerk is loading or we're fetching user data
    const loading = !clerkLoaded || (isSignedIn && meQuery.isLoading) || logoutMutation.isPending;

    // User from our database
    const user = meQuery.data ?? null;

    // Store in localStorage for backwards compatibility
    if (user) {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    }

    return {
      user,
      loading,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(isSignedIn && user),
      // Expose Clerk user for additional info if needed
      clerkUser,
    };
  }, [
    clerkLoaded,
    isSignedIn,
    clerkUser,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!clerkLoaded) return; // Wait for Clerk to load
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user || isSignedIn === undefined) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    // Only redirect if Clerk confirms we're not signed in
    if (!isSignedIn) {
      window.location.href = redirectPath;
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    clerkLoaded,
    isSignedIn,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
