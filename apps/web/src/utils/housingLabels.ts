import type { RoomType } from "@iguide/dorm"
import { getRoomCodeLabel } from "@iguide/dorm"

export const getRoomTypeLabel = (roomType: RoomType, language: "en" | "zh"): string => {
  return getRoomCodeLabel(roomType, language)
}
