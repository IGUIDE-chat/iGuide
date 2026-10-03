import type { DormFavorite } from "@iguide/dorm"
import { Dorm } from "@iguide/dorm"
import { useState, useEffect, useCallback, useMemo } from "react"

import { useAuth } from "../../../contexts/AuthContext"
import {
  addToHistory as addToHistoryRequest,
  clearFavorites as clearFavoritesRequest,
  clearHistory as clearHistoryRequest,
  getFavorites,
  getHistory,
  removeFavoriteByDormId,
  removeFromHistoryByDormId,
  toggleFavorite as toggleFavoriteRequest,
} from "../../../services/dormApi"
import { useDormData } from "../store/DormDataContext"

const FAVORITES_KEY = "uiuc-dorm-favorites"
const HISTORY_KEY = "uiuc-dorm-history"
const MAX_HISTORY_ITEMS = 10

export const useDormUserInteraction = () => {
  const { user } = useAuth()
  const { dorms } = useDormData()
  const dormById = useMemo(() => new Map(dorms.map((d) => [d.id, d])), [dorms])
  const [isLoading, setIsLoading] = useState(false)

  const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Error loading favorites:", error)
      return []
    }
  })

  const [cloudFavorites, setCloudFavorites] = useState<DormFavorite[]>([])
  const [favoriteStatusMap, setFavoriteStatusMap] = useState<Record<string, boolean>>({})

  const [recentlyViewed, setRecentlyViewed] = useState<Dorm[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Error loading history:", error)
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(localFavorites))
    } catch (error) {
      console.error("Error saving favorites:", error)
    }
  }, [localFavorites])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(recentlyViewed))
    } catch (error) {
      console.error("Error saving history:", error)
    }
  }, [recentlyViewed])

  const loadCloudData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const [favoritesData, historyData] = await Promise.all([
        getFavorites(),
        getHistory(MAX_HISTORY_ITEMS),
      ])

      setCloudFavorites(favoritesData)

      const historyDorms: Dorm[] = historyData
        .map((item) => dormById.get(item.dorm_id))
        .filter((dorm): dorm is Dorm => Boolean(dorm))
      setRecentlyViewed(historyDorms)

      const statusMap: Record<string, boolean> = {}
      favoritesData.forEach((favorite) => {
        statusMap[favorite.dorm_id] = true
      })
      setFavoriteStatusMap(statusMap)
    } catch (error) {
      console.error("Failed to load cloud data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, dormById])

  useEffect(() => {
    if (user) {
      void loadCloudData()
    } else {
      setCloudFavorites([])
      setFavoriteStatusMap({})
      setIsLoading(false)
    }
  }, [user, loadCloudData])

  const toggleFavorite = useCallback(
    async (dormId: string, dormName: string, dormNameZh?: string) => {
      if (user) {
        const isCurrentlyFavorite = favoriteStatusMap[dormId] || false

        setFavoriteStatusMap((prev) => ({
          ...prev,
          [dormId]: !isCurrentlyFavorite,
        }))
        setCloudFavorites((prev) => {
          if (isCurrentlyFavorite) {
            return prev.filter((favorite) => favorite.dorm_id !== dormId)
          }
          const optimisticFavorite: DormFavorite = {
            id: `optimistic-${dormId}`,
            user_id: user.id,
            dorm_id: dormId,
            dorm_name: dormName,
            dorm_name_zh: dormNameZh,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          return [optimisticFavorite, ...prev.filter((favorite) => favorite.dorm_id !== dormId)]
        })

        try {
          const result = await toggleFavoriteRequest(dormId, dormName, dormNameZh)

          if (result.added && result.favorite) {
            setCloudFavorites((prev) => [
              result.favorite!,
              ...prev.filter((favorite) => favorite.dorm_id !== dormId),
            ])
            setFavoriteStatusMap((prev) => ({ ...prev, [dormId]: true }))
          } else {
            setCloudFavorites((prev) => prev.filter((favorite) => favorite.dorm_id !== dormId))
            setFavoriteStatusMap((prev) => ({ ...prev, [dormId]: false }))
          }

          return result.added
        } catch (error) {
          console.error("Failed to toggle cloud favorite:", error)
          await loadCloudData()
          throw error
        }
      } else {
        setLocalFavorites((prev) => {
          if (prev.includes(dormId)) {
            return prev.filter((id) => id !== dormId)
          } else {
            return [...prev, dormId]
          }
        })
        return !localFavorites.includes(dormId)
      }
    },
    [user, localFavorites, favoriteStatusMap, loadCloudData],
  )

  const removeFavorite = useCallback(
    async (dormId: string) => {
      if (user) {
        setCloudFavorites((prev) => prev.filter((favorite) => favorite.dorm_id !== dormId))
        setFavoriteStatusMap((prev) => ({ ...prev, [dormId]: false }))

        try {
          await removeFavoriteByDormId(dormId)
        } catch (error) {
          console.error("Failed to remove cloud favorite:", error)
          await loadCloudData()
        }
        return
      }

      setLocalFavorites((prev) => prev.filter((id) => id !== dormId))
    },
    [user, loadCloudData],
  )

  const clearFavorites = useCallback(async () => {
    if (user) {
      setCloudFavorites([])
      setFavoriteStatusMap({})

      try {
        await clearFavoritesRequest()
      } catch (error) {
        console.error("Failed to clear cloud favorites:", error)
        await loadCloudData()
      }
      return
    }

    setLocalFavorites([])
    localStorage.removeItem(FAVORITES_KEY)
  }, [user, loadCloudData])

  const isFavorite = useCallback(
    (dormId: string): boolean => {
      if (user) {
        return favoriteStatusMap[dormId] || false
      } else {
        return localFavorites.includes(dormId)
      }
    },
    [user, localFavorites, favoriteStatusMap],
  )

  const addToHistory = useCallback(
    async (dorm: Dorm) => {
      setRecentlyViewed((prev) => {
        const filtered = prev.filter((item) => item.id !== dorm.id)
        return [dorm, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      })

      if (user) {
        try {
          await addToHistoryRequest(dorm.id, dorm.name, dorm.name_zh)
        } catch (error) {
          console.error("Failed to add cloud history:", error)
        }
      }
    },
    [user],
  )

  const removeFromHistory = useCallback(
    async (dormId: string) => {
      setRecentlyViewed((prev) => prev.filter((dorm) => dorm.id !== dormId))

      if (user) {
        try {
          await removeFromHistoryByDormId(dormId)
        } catch (error) {
          console.error("Failed to remove cloud history item:", error)
          await loadCloudData()
        }
      }
    },
    [user, loadCloudData],
  )

  const clearHistory = useCallback(async () => {
    if (user) {
      try {
        await clearHistoryRequest()
      } catch (error) {
        console.error("Failed to clear cloud history:", error)
      }
    }

    setRecentlyViewed([])
    localStorage.removeItem(HISTORY_KEY)
  }, [user])

  return {
    favorites: user ? cloudFavorites.map((f) => f.dorm_id) : localFavorites,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    recentlyViewed,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isFavorite,
    cloudFavorites,
    isLoading,
    refreshCloudData: user ? loadCloudData : undefined,
  }
}
