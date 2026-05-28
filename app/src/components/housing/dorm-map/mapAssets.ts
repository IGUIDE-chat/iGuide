/**
 * @file ./src/components/housing/dorm-map/mapAssets.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import type mapboxgl from "mapbox-gl";
import { LANDMARK_ICON_TYPES } from "./mapConstants";

const createPillImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 60;
  const ctx = canvas.getContext("2d");
  if (!ctx) {return null;}

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const r = 24;
  const x = 10;
  const y = 6;
  const w = 100;
  const h = 48;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.stroke();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const createActivePillImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 60;
  const ctx = canvas.getContext("2d");
  if (!ctx) {return null;}

  ctx.fillStyle = "#13294B";
  ctx.shadowColor = "rgba(19, 41, 75, 0.4)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  const r = 24;
  const x = 10;
  const y = 6;
  const w = 100;
  const h = 48;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#13294B";
  ctx.lineWidth = 2;
  ctx.stroke();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const createLandmarkIcon = (type: string) => {
  const size = 44;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {return null;}

  const cx = size / 2;
  const cy = size / 2;

  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "#4B5563";
  ctx.fillStyle = "#4B5563";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (type) {
    case "library":
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx - 8, cy - 7);
      ctx.lineTo(cx - 8, cy + 7);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx + 8, cy - 7);
      ctx.lineTo(cx + 8, cy + 7);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();
      break;
    case "gym":
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy);
      ctx.lineTo(cx + 9, cy);
      ctx.stroke();
      ctx.fillRect(cx - 9, cy - 5, 4, 10);
      ctx.fillRect(cx + 5, cy - 5, 4, 10);
      break;
    case "dining":
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 8);
      ctx.lineTo(cx - 4, cy - 2);
      ctx.lineTo(cx - 4, cy + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 8);
      ctx.lineTo(cx - 6, cy - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 8);
      ctx.lineTo(cx - 2, cy - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy + 8);
      ctx.lineTo(cx + 4, cy - 3);
      ctx.quadraticCurveTo(cx + 4, cy - 8, cx + 7, cy - 8);
      ctx.quadraticCurveTo(cx + 4, cy - 5, cx + 4, cy - 3);
      ctx.stroke();
      break;
    case "store":
      ctx.beginPath();
      ctx.rect(cx - 7, cy - 4, 14, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 4);
      ctx.quadraticCurveTo(cx - 4, cy - 9, cx, cy - 9);
      ctx.quadraticCurveTo(cx + 4, cy - 9, cx + 4, cy - 4);
      ctx.stroke();
      break;
    case "medical":
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx, cy + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx + 7, cy);
      ctx.stroke();
      break;
    case "union":
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 3);
      ctx.lineTo(cx, cy - 9);
      ctx.lineTo(cx + 9, cy - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 7);
      ctx.lineTo(cx + 8, cy + 7);
      ctx.stroke();
      for (const dx of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - 3);
        ctx.lineTo(cx + dx, cy + 7);
        ctx.stroke();
      }
      break;
    case "service":
      ctx.beginPath();
      ctx.rect(cx - 8, cy - 5, 16, 11);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 5);
      ctx.lineTo(cx, cy + 1);
      ctx.lineTo(cx + 8, cy - 5);
      ctx.stroke();
      break;
    case "transport":
      ctx.beginPath();
      ctx.rect(cx - 7, cy - 7, 14, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 2);
      ctx.lineTo(cx + 7, cy - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 4, cy + 7, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 7, 2, 0, 2 * Math.PI);
      ctx.fill();
      break;
    case "school":
    default:
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 2);
      ctx.lineTo(cx, cy - 7);
      ctx.lineTo(cx + 9, cy - 2);
      ctx.lineTo(cx, cy + 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2);
      ctx.lineTo(cx, cy + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy);
      ctx.lineTo(cx + 7, cy + 5);
      ctx.stroke();
      break;
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const registerMapAssets = (map: mapboxgl.Map) => {
  if (!map.hasImage("pill")) {
    const pillImage = createPillImage();
    if (pillImage) {
      map.addImage("pill", pillImage, {
        pixelRatio: 2,
        stretchX: [[40, 80]],
        stretchY: [[20, 40]],
      });
    }
  }

  if (!map.hasImage("pill-active")) {
    const activePillImage = createActivePillImage();
    if (activePillImage) {
      map.addImage("pill-active", activePillImage, {
        pixelRatio: 2,
        stretchX: [[40, 80]],
        stretchY: [[20, 40]],
      });
    }
  }

  for (const type of LANDMARK_ICON_TYPES) {
    const key = `landmark-${type}`;
    if (!map.hasImage(key)) {
      const image = createLandmarkIcon(type);
      if (image) {map.addImage(key, image, { pixelRatio: 2 });}
    }
  }

  const areLandmarkImagesReady = LANDMARK_ICON_TYPES.every((type) =>
    map.hasImage(`landmark-${type}`)
  );

  return (
    map.hasImage("pill") &&
    map.hasImage("pill-active") &&
    areLandmarkImagesReady
  );
};
