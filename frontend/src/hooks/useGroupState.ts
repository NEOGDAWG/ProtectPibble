import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { clearAuthToken } from '../auth/storage'

export function useGroupState(groupId: string) {
  const navigate = useNavigate()

  return useQuery({
    queryKey: ['groupState', groupId],
    queryFn: () => api.getGroupState(groupId),
    refetchInterval: 15000,
    retry: (failureCount, error) => {
      // Don't retry on 401 - token expired/invalid
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
        clearAuthToken()
        navigate('/login')
        return false
      }
      return failureCount < 3
    },
  })
}

