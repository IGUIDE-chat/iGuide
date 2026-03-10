# 宿舍数据与媒体审计

更新时间：2026-03-10

## 本轮媒体清理结论
- 全量清理当前 23 个宿舍的用户可见媒体：`imageUrl`、`galleryImages`、`floorPlans[].photoUrls`、`floorPlans[].imageUrls`。
- 只使用官方来源。优先把学校/物业官网的缩略图、裁切图、样式图升级为同源原图；没有安全替代时宁可减少图片数量，也不保留明显带人物或明显糊掉的图。
- 已移除目前最明显的人物图：
  - `Bromley` 的泳池群像图
  - `Newman` 的 `Students.jpg`
  - `Hendrick` 的 `parent-img.jpg`
  - `Armory` 首页轮播里带人物的单人间图
- 已新增媒体审计脚本 `scripts/audit-dorm-media.ts`，并在校验中阻止重新引入低清缩略图 URL、旧版单图字段、以及明显人物文件名。

## 媒体质量状态

| 宿舍 | 已替换为原图 | 已移除含人物图片 | 官方仅提供低清/待补 |
| --- | --- | --- | --- |
| ISR | Illinois Housing hero、gallery、room photo 已从 `/styles/.../public` 升级为原图 | 无 | 无 |
| Nugent | hero、gallery、room photo 已升级为原图 | 无 | `NUGT-RoomLayouts.pdf` 仍是合集，不是逐房型独立图 |
| Wassaja | hero、gallery、single room photo 已升级为原图 | 无 | 双人房主要依赖 PDF，房间实拍不如单人房完整 |
| Bousfield | hero、gallery、single/double suite room photo 已升级为原图 | 无 | 套房变体仍共用同一套 floor plan PDF |
| PAR | hero、gallery、room photo 已升级为原图 | 无 | 聚合记录，未拆到各子楼独立媒体包 |
| FAR | hero、gallery、room photo 已升级为原图 | 无 | 聚合记录，未拆到各子楼独立媒体包 |
| Allen | hero、gallery、double/triple/quad room photo 已升级为原图 | 无 | Single / triple / quad 仍以房间照为主，PDF 不完整 |
| Busey-Evans | hero、gallery、single/double/triple room photo 已升级为原图 | 无 | 官方未公开 single / triple 的独立平面图 PDF |
| Snyder | hero、gallery、double/triple room photo 已升级为原图 | 无 | 无 |
| Hopkins | hero、gallery、double/triple room photo 已升级为原图 | 无 | 无 |
| Weston | hero、gallery、double/triple room photo 已升级为原图 | 无 | 无 |
| Scott | hero、gallery、double/triple room photo 已升级为原图 | 无 | 无 |
| Taft | hero、gallery、double room photo 已升级为原图 | 无 | 仍以传统房型实拍 + PDF 为主 |
| Van Doren | hero、gallery、double room photo 已升级为原图 | 无 | 仍以传统房型实拍 + PDF 为主 |
| Daniels | hero、gallery、room photo 已升级为原图 | 无 | 官方房间特写较少，公共空间照片占比偏高 |
| Sherman | hero、gallery、single/double room photo 已升级为原图 | 无 | 官方媒体数量本身较少 |
| LAR | hero、gallery、single/double/triple room photo 已升级为原图 | 无 | 聚合记录，未拆到 Leonard / Shelden 各自图库 |
| Bromley | hero、gallery、room photo、部分房型图已升级为原图 | 已移除泳池群像图 | 部分房型仍以房间实拍为主，不是逐房型独立平面图 |
| Illini Tower | 房型图和房间图已直接使用官方高分资源，无需额外升图 | 无 | 无 |
| Newman | hero 改为官方高分房间照；room profile 图保留 | 已移除 `Students.jpg` | 官网仍未提供统一可下载的 floor plan PNG/PDF |
| Hendrick House | 房型图从 `-852x1024 / -724x1024` 升级为原图；gallery 保留高分官方图 | 已移除带人物 hero；去掉低清 Certified Housing 房间缩略图 | 并非所有 room variants 都有独立官方平面图 |
| Presby Hall | hero 已从 Certified Housing 缩略图升级为原图 | 无 | Suite 级别媒体仍以整套空间照为主 |
| Armory House | hero、gallery、room photo 已从 `photo_side_by_side` 升级为原图；单人间改用 living-options 原图 | 已移除首页轮播里的单人间人物图 | 官方没有统一导出的完整 floor plan 套图包 |

## 仍待确认 / 无信息
- `Newman`：缺少统一可下载的 floor plan PNG/PDF，当前只能用官方 room profile 图和房间照覆盖。
- `Hendrick House`：官网没有把所有 East/West 变体都做成完整可下载的平面图集合。
- `Armory House`：虽然 main / suite 的主要房型已补到 living-options 原图，但仍没有统一打包的完整 floor plan 手册。
- `Bromley`：`Corner Standard Double` 价格仍未在官方价目页单独列出。
- `PAR / FAR / LAR / Busey-Evans`：当前产品模型仍是聚合记录，不会为每个子楼单独维护独立图库。

## 主要来源
- Illinois Housing: `https://www.housing.illinois.edu/`
- Certified Housing: `https://certified.housing.illinois.edu/`
- Bromley Hall: `https://bromleyhall.com/`
- Illini Tower: `https://www.illinitoweruiuc.com/`
- Newman Hall / St. John’s Catholic Newman Center: `https://www.sjcnc.org/`
- Hendrick House: `https://www.hendrickhouse.com/`
- Presby Hall: `https://presbyhall.com/`
- Armory House: `https://www.armoryhouse.com/`
