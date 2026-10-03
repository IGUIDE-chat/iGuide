import { RoomType } from "../components/housing/types/index"
import { getRoomCodeLabel } from "./roomOptions"

export const getRoomTypeLabel = (roomType: RoomType, language: "en" | "zh"): string => {
  return getRoomCodeLabel(roomType, language)
}
