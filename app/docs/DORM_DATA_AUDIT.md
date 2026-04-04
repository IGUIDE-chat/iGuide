# 宿舍数据与媒体审计

更新时间：2026-03-13

## 本轮床型补录结论

- 依据 Illinois Housing 的 `furniture-dimensions` 页，为当前全部 University Housing (`URH`) `floorPlans[]` 补录 `bedSize`。
- `ISR / Nugent / Wassaja / Bousfield / PAR / FAR / Allen / Busey-Evans / Snyder / Hopkins / Weston / Scott / Taft / Van Doren / LAR` 都能在 hall 专属家具说明里直接落到 extra-long twin。
- `Daniels / Sherman` 的 hall 专属家具说明只给了床架尺寸；当前 `Twin XL` 依据 University Housing `Move-In Checklist` 中“beds with an extra-long twin mattress”的通用说明补录。
- `PAR` 当前只保留 `par_double.pdf` 在双人房；单人房不再复用 double-only 的 layout PDF。

## 本轮标签补录结论

- 新增分类标签：
  - `Lifestyle / Gender-Inclusive / 性别包容`
  - `Facilities / Computer Lab / 电脑房`
  - `Facilities / Library / 图书室`
- `musicRooms` 中文标签从 `琴房` 改为 `音乐房`。
- `DormDetail` 页面对 `llc` 改为上下文展示：
  - 只有一个 LLC 时显示具体 LLC 名称
  - 有多个 LLC 时显示 `Multiple LLCs / 多个 LLC`
  - 只有没有 `llcNames` 时才回退到 `LLC Community / LLC 社群`
- reseed 行为改为“增量合并”而不是覆盖：
  - 保留已有数据库里的 `image_url`、`gallery_images`、`floor_plans[].imageUrls/photoUrls`
  - 保留已有 tag 数据，并把官方来源的新标签追加进去
  - 不清理旧库里可能存在的历史 tag 值
  - `PCH` 的 `coed` 没有被映射成 `Gender-Inclusive`

### Gender-Inclusive 宿舍

- `allen / bousefield / daniels / far / isr / nugent / par / sherman / snyder / wassaja / weston`

### Computer Lab 宿舍

- `allen / armory / bousefield / bromley / busey-evans / daniels / far / hendrick / hopkins / illini-tower / isr / lar / newman / nugent / par / scott / sherman / snyder / taft / van-doren / wassaja / weston`

### Library 宿舍

- `bousefield / hopkins / newman / scott / taft / van-doren / wassaja / weston`

## 本轮媒体清理结论

- 全量清理当前 23 个宿舍的用户可见媒体：`imageUrl`、`galleryImages`、`floorPlans[].photoUrls`、`floorPlans[].imageUrls`。
- 只使用官方来源。优先把学校/物业官网的缩略图、裁切图、样式图升级为同源原图；没有安全替代时宁可减少图片数量，也不保留明显带人物或明显糊掉的图。
- 已移除目前最明显的人物图：
  - `Bromley` 的泳池群像图
  - `Newman` 的 `Students.jpg`
  - `Hendrick` 的 `parent-img.jpg`
  - `Armory` 首页轮播里带人物的单人间图
- 已新增媒体审计脚本 `scripts/audit-dorm-media.ts`，并在校验中阻止重新引入低清缩略图 URL、旧版单图字段、以及明显人物文件名。

## 本轮面积复核结论

- 重新核查了当前 23 个宿舍所有 `floorPlans[].sqft`。
- 保留规则：只有官方页面或官方 PDF 明确写出 square footage，才保留 `sqft`。
- 删除规则：如果官方只给房间照片、平面图、家具尺寸、房间长宽，或只给区间/“over”这类非单一精确值，就不再保留结构化 `sqft`。
- 本轮删除了大部分历史手填面积，避免前台继续显示未经官方明确发布的数字。
- 当前仅保留 10 个可直接落到官方文本的 `sqft`：
  - `Bromley`：`Standard Double` 285、`Triple` 375、`Quad` 375
  - `Illini Tower`：`S1` 465、`S2` 560、`B1 Shared` 630、`B2 Shared` 700、`B2 Private` 700、`C1` 760、`D1` 860

## 媒体质量状态

| 宿舍           | 已替换为原图                                                                                                            | 已移除含人物图片                                         | 官方仅提供低清/待补                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| ISR            | Illinois Housing hero、gallery、room photo 已从 `/styles/.../public` 升级为原图                                         | 无                                                       | 无                                                |
| Nugent         | hero、gallery、room photo 已升级为原图                                                                                  | 无                                                       | `NUGT-RoomLayouts.pdf` 仍是合集，不是逐房型独立图 |
| Wassaja        | hero、gallery、single room photo 已升级为原图                                                                           | 无                                                       | 双人房主要依赖 PDF，房间实拍不如单人房完整        |
| Bousfield      | hero、gallery、single/double suite room photo 已升级为原图                                                              | 无                                                       | 套房变体仍共用同一套 floor plan PDF               |
| PAR            | hero、gallery、room photo 已升级为原图                                                                                  | 无                                                       | 聚合记录，未拆到各子楼独立媒体包                  |
| FAR            | hero、gallery、room photo 已升级为原图                                                                                  | 无                                                       | 聚合记录，未拆到各子楼独立媒体包                  |
| Allen          | hero、gallery、double/triple/quad room photo 已升级为原图                                                               | 无                                                       | Single / triple / quad 仍以房间照为主，PDF 不完整 |
| Busey-Evans    | hero、gallery、single/double/triple room photo 已升级为原图                                                             | 无                                                       | 官方未公开 single / triple 的独立平面图 PDF       |
| Snyder         | hero、gallery、double/triple room photo 已升级为原图                                                                    | 无                                                       | 无                                                |
| Hopkins        | hero、gallery、double/triple room photo 已升级为原图                                                                    | 无                                                       | 无                                                |
| Weston         | hero、gallery、double/triple room photo 已升级为原图                                                                    | 无                                                       | 无                                                |
| Scott          | hero、gallery、double/triple room photo 已升级为原图                                                                    | 无                                                       | 无                                                |
| Taft           | hero、gallery、double room photo 已升级为原图                                                                           | 无                                                       | 仍以传统房型实拍 + PDF 为主                       |
| Van Doren      | hero、gallery、double room photo 已升级为原图                                                                           | 无                                                       | 仍以传统房型实拍 + PDF 为主                       |
| Daniels        | hero、gallery、room photo 已升级为原图                                                                                  | 无                                                       | 官方房间特写较少，公共空间照片占比偏高            |
| Sherman        | hero、gallery、single/double room photo 已升级为原图                                                                    | 无                                                       | 官方媒体数量本身较少                              |
| LAR            | hero、gallery、single/double/triple room photo 已升级为原图                                                             | 无                                                       | 聚合记录，未拆到 Leonard / Shelden 各自图库       |
| Bromley        | hero、gallery、room photo、部分房型图已升级为原图                                                                       | 已移除泳池群像图                                         | 部分房型仍以房间实拍为主，不是逐房型独立平面图    |
| Illini Tower   | 房型图和房间图已直接使用官方高分资源，无需额外升图                                                                      | 无                                                       | 无                                                |
| Newman         | hero 改为官方高分房间照；South / North room profile 图覆盖到当前 6 个房型                                               | 已移除 `Students.jpg`                                    | 官网仍未提供统一可下载的 floor plan PNG/PDF       |
| Hendrick House | 房型图与 gallery 已统一回官方原图                                                                                       | 已移除带人物 hero；去掉低清 Certified Housing 房间缩略图 | 并非所有 room variants 都有独立官方平面图         |
| Presby Hall    | hero 已从 Certified Housing 缩略图升级为原图                                                                            | 无                                                       | Suite 级别媒体仍以整套空间照为主                  |
| Armory House   | hero、gallery、main / suite room photo 已统一回官方原图；`Deluxe Double`、`Standard Single`、`Corner Single` 已分别补齐 | 已移除首页轮播里的单人间人物图                           | 官方没有统一导出的完整 floor plan 套图包          |

## 面积状态

| 宿舍           | 已确认面积                                                                                 | 已删除/修正面积                                                                                                                          | 说明                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ISR            | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | Illinois Housing hall 页只给家具尺寸说明和 layout PDF，没有明确 square footage                                          |
| Nugent         | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 `NUGT-RoomLayouts.pdf` 和家具尺寸说明，没有逐房型面积                                                          |
| Wassaja        | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 singles / doubles PDF，没有明确 square footage                                                                 |
| Bousfield      | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 suite floor plan PDF，没有明确 square footage                                                                  |
| PAR            | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给平面图和房间照，没有明确 square footage                                                                         |
| FAR            | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给平面图和房间照，没有明确 square footage                                                                         |
| Allen          | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 double / triple / quad PDF，没有明确 square footage                                                            |
| Busey-Evans    | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方房间页没有公布 single / triple 的明确面积                                                                           |
| Snyder         | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 double / triple PDF，没有明确 square footage                                                                   |
| Hopkins        | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 double / triple PDF，没有明确 square footage                                                                   |
| Weston         | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 double / triple PDF，没有明确 square footage                                                                   |
| Scott          | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 double / triple PDF，没有明确 square footage                                                                   |
| Taft           | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给房间 layout 和家具尺寸说明，没有明确 square footage                                                             |
| Van Doren      | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给房间 layout 和家具尺寸说明，没有明确 square footage                                                             |
| Daniels        | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方 Daniels 页面只给 layout PDF 和 furniture dimensions，没有明确 square footage                                       |
| Sherman        | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 shared single / double layout PDF，没有明确 square footage                                                     |
| LAR            | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 官方只给 single / double / triple PDF，没有明确 square footage                                                          |
| Bromley        | `Standard Double` 285，`Triple` 375，`Quad` 375                                            | 删除 `Single` 的结构化 `sqft`；把旧的 280 / 320 / 400 修正为 285 / 375 / 375                                                             | `BH-Room-Descriptions.pdf` 明确写了 double / triple / quad 面积；single 只写 “over 145 square feet”，不是单一精确值     |
| Illini Tower   | `S1` 465，`S2` 560，`B1 Shared` 630，`B2 Shared` 700，`B2 Private` 700，`C1` 760，`D1` 860 | 删除旧的聚合 `Studio` / `Two Bedroom` 记录；把旧的 `C1` 450、`D1` 580 修正为 760、860，并为 `S2` / `B2 Private` 保留 sold out 但不写价格 | 官方 `floor-plans` 页面对 7 个独立 layout 都给了明确面积；拆分后可以安全保留精确 `sqft`                                 |
| Newman         | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | Newman 官方 room-floorplans 页和房间图未公布明确 square footage                                                         |
| Hendrick House | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | 当前 Hendrick 官方站点公开了房型和价格，但未公开明确 square footage                                                     |
| Presby Hall    | 无                                                                                         | 已删除全部旧 `sqft`                                                                                                                      | Presby floorplans 页描述的是 5/6-bedroom suite 结构与设施，没有逐房型面积                                               |
| Armory House   | 无                                                                                         | 已删除全部旧 `sqft`，并把 `Suite / Corner Single` 拆成 `Standard Single` / `Corner Single`，新增 `Deluxe Double`                         | Armory 官方页给的是房间长宽近似值，如 `13' x 16'`、`12' x 14'`、`15' x 16'`、`10' x 21'`，不是统一发布的 square footage |

## 仍待确认 / 无信息

- `Newman`：缺少统一可下载的 floor plan PNG/PDF，当前只能用官方 room profile 图和房间照覆盖。
- `Hendrick House`：官网没有把所有 East/West 变体都做成完整可下载的平面图集合，也没有发布统一的 `sqft`。
- `Armory House`：虽然 main / suite 的主要房型已补到 living-options 原图，但仍没有统一打包的完整 floor plan 手册；`Standard Single` / `Corner Single` 目前也只有 grouped rate，没有独立 `price`。
- `Bromley`：`Corner Standard Double` 价格仍未在官方价目页单独列出；`Single` 只有 “over 145 square feet”，没有单一精确面积。
- `Daniels / Sherman`：hall 专属 furniture section 没有单独写 mattress label；当前 `bedSize` 依赖 University Housing 通用 move-in 说明，不是 hall subsection 里的逐楼明文。
- `PAR / FAR / LAR / Busey-Evans`：当前产品模型仍是聚合记录，不会为每个子楼单独维护独立图库。
- `University Housing` 多数 hall 页面：公开的是 furniture dimensions 与 layout PDF，不是逐房型 square footage。

## 主要来源

- Illinois Housing: `https://www.housing.illinois.edu/`
- Illinois Housing furniture dimensions: `https://www.housing.illinois.edu/living-communities/halls/furniture-dimensions`
- Illinois Housing PAR hall page: `https://www.housing.illinois.edu/living-communities/halls/par#floor-plans`
- Illinois Housing Move-In Checklist: `https://www.housing.illinois.edu/Resources/move-in`
- Certified Housing: `https://certified.housing.illinois.edu/`
- Bromley Hall: `https://bromleyhall.com/`
- Illini Tower: `https://www.illinitoweruiuc.com/`
- Newman Hall / St. John’s Catholic Newman Center: `https://www.sjcnc.org/`
- Hendrick House: `https://www.hendrickhouse.com/`
- Presby Hall: `https://presbyhall.com/`
- Armory House: `https://www.armoryhouse.com/`
