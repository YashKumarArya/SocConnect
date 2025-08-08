import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: api.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!user && !error;
  const isUnauthenticated = !user && !isLoading;

  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    error
  };
}