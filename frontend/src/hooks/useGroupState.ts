import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'

export function useGroupState(groupId: string) {
  return useQuery({
    queryKey: ['groupState', groupId],
    queryFn: () => api.getGroupState(groupId),
    refetchInterval: 15000,
  })
}

