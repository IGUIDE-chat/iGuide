# 宿舍数据更新审计

更新基准日：2026-03-10

价格口径：
- `price` 统一记录为 2026-2027 学年或页面上最新公布的最低年度官方价格。
- 对于房费和餐费分开公布的宿舍，优先记录页面上可直接识别的最低年度官方价格；若 Certified Housing 汇总页与物业官网有差异，列入 `待确认`。

## 第二轮补充（图片 / 户型图）
本轮新增与补强：
- 扩充了 `Wassaja / PAR / FAR / Snyder / Hopkins / Weston / Scott / Taft / Van Doren / Daniels / Sherman / LAR` 的官方公开图库链接，优先改为官方页面里可直接访问的 `image_gallery_full` 资源。
- 扩充了 `Bromley / Illini Tower / Newman / Hendrick House / Presby Hall / Armory House` 的公开图库与房型媒体链接，优先使用物业官网、Certified Housing 页面和官方 room-profile 页。
- `FAR` 聚合地址已从模糊描述改为 `901 College Ct.; 1005 College Ct.`，对应官方搜索结果中的 `Trelease Hall` 与 `Oglesby Hall`。
- `Bromley` 新增 `BH-Room-Descriptions.pdf` 作为房型说明来源，并补入更多 single / standard double / triple / quad 房间图。
- `Illini Tower` 新增 `S1 / S2 / B1 / B2 / C1 / D1` 户型图片资源与对应 gallery 图。
- `Presby Hall` 新增官方 `5-bed-floorplan.png` 与 `6-bed-floorplan.png`。
- `Newman` 新增官方 room profile 页对应的房间照片资源，但官方公开页面仍以 room profile、360 tour、video walkthrough 为主，不是统一下载式 flat floor plan 图。
- `Armory House` 与 `Hendrick House` 新增更多官方房间/公共空间照片；但截至本轮，官网仍未公开完整可下载的平面图组，只能补到 room showcase 级别。

本轮后仍保留的未决点：
- `Newman` 缺少统一下载式 floor plan PNG/PDF，只能用 room profile + 360 tour + 房间照片补足。
- `Armory House` 缺少明确标注房型的独立 floor plan 图。
- `Hendrick House` 缺少覆盖全部 room variants 的官方 floor plan 图。
- `Bromley` 的 `Corner Standard Double` 单独价格仍未在官方价格表中单列。

## ISR
来源：
- https://www.housing.illinois.edu/living-communities/halls/isr
- https://www.housing.illinois.edu/cost
已确认：
- 更新官方首图、画廊、Wardall/Townsend floor plan PDF、LLC、描述、价格、地址、官网。
待确认：
- Townsend/Wardall 各子楼双人间与三人间的精确数量分布未在总表中拆开。
无信息/需补充：
- 无。

## Nugent
来源：
- https://www.housing.illinois.edu/living-communities/halls/nugent
- https://www.housing.illinois.edu/cost
已确认：
- 更新上院年级定位、Business LLC、Beckwith Residential Community、室内连通 SDRP、价格、图片与 room layouts。
待确认：
- `NUGT-RoomLayouts.pdf` 未把所有 shared/private bath 价格项逐一标成独立图片卡。
无信息/需补充：
- 无。

## Wassaja
来源：
- https://www.housing.illinois.edu/living-communities/halls/wassaja
- https://www.housing.illinois.edu/cost
已确认：
- 更新 modern upper-division 描述、单双人房价格、single/private bath 价格、地址、官网、图片。
待确认：
- 官方公开画廊中双人房 room photo 少于单人房，double card 仅保留 PDF。
无信息/需补充：
- 无。

## Bousfield
来源：
- https://www.housing.illinois.edu/living-communities/halls/bousfield
- https://www.housing.illinois.edu/cost
已确认：
- 修正名称拼写为 `Bousfield Hall`，修正 LLC 为 `Transfer Community`，更新 suite-style、价格、地址、官网、图片。
待确认：
- 官方房价页未把每个 suite 变体分别配到独立图片。
无信息/需补充：
- 无。

## PAR
来源：
- https://www.housing.illinois.edu/living-communities/halls/par
- https://www.housing.illinois.edu/cost
已确认：
- 保留聚合记录，更新 hall 组合说明、individual-use bathroom、Global Crossroads / Intersections LLC、价格、地址、官网、图片。
待确认：
- 聚合记录未拆分 Babcock / Carr / Blaisdell / Saunders 各自差异，只在描述和地址中保留合并信息。
无信息/需补充：
- 无。

## FAR
来源：
- https://www.housing.illinois.edu/living-communities/halls/far
- https://www.housing.illinois.edu/cost
已确认：
- 保留聚合记录，更新 WIMSE LLC、bus access、南校区定位、价格、官网、图片。
待确认：
- FAR 页面未直接给出清晰统一的街道地址，本次 `address` 使用聚合描述，不写具体门牌。
无信息/需补充：
- 精确官方街道地址。

## Allen
来源：
- https://www.housing.illinois.edu/living-communities/halls/allen
- https://www.housing.illinois.edu/cost
已确认：
- 修正 `Allen Hall` 为有空调；更新 Unit One LLC、music rooms/creative spaces、quad 价格、地址、官网、图片。
待确认：
- 无。
无信息/需补充：
- 无。

## Busey-Evans
来源：
- https://www.housing.illinois.edu/living-communities/halls/busey-evans
- https://www.housing.illinois.edu/cost
已确认：
- 更新 quiet/central 描述、单人/双人/三人图、价格、地址、官网。
待确认：
- 官网只提供 double PDF，single / triple 主要依赖 room photo。
无信息/需补充：
- 独立 single / triple floor plan PDF。

## Snyder
来源：
- https://www.housing.illinois.edu/living-communities/halls/snyder
- https://www.housing.illinois.edu/cost
已确认：
- 保留 substance-free 事实，更新价格、图片、地址、官网、SDRP / ARC 邻近信息。
待确认：
- 无。
无信息/需补充：
- 无。

## Hopkins
来源：
- https://www.housing.illinois.edu/living-communities/halls/hopkins
- https://www.housing.illinois.edu/cost
已确认：
- 更新 first-year hall 描述、room layouts、价格、地址、官网、SDRP 邻近信息。
待确认：
- 官方文案强调 social/friendly，但不直接等同于 party vibe；结构化标签只保留 `socialParty` 一项供旧 UI 使用。
无信息/需补充：
- 无。

## Weston
来源：
- https://www.housing.illinois.edu/living-communities/halls/weston
- https://www.housing.illinois.edu/cost
已确认：
- 更新 Exploration LLC / LEADS LLC、价格、图片、地址、官网。
待确认：
- `LEADS LLC` 同时也会在其它宿舍历史资料中出现，本次仅按当前 hall page 记录 Weston。
无信息/需补充：
- 无。

## Scott
来源：
- https://www.housing.illinois.edu/living-communities/halls/scott
- https://www.housing.illinois.edu/cost
已确认：
- 修正 LLC 为 `Transfer Community`，更新 quiet 定位、ARC 邻近、价格、地址、官网、图片。
待确认：
- 无。
无信息/需补充：
- 无。

## Taft
来源：
- https://www.housing.illinois.edu/living-communities/halls/taft-van-doren
- https://www.housing.illinois.edu/cost
已确认：
- 修正为无空调历史 hall，更新价格、地址、官网、图片。
待确认：
- `cost` 页面是否存在只对 Taft/Van Doren 生效的更低餐饮组合价格，仍需和实际 2026-2027 新签合同口径再核一次。
无信息/需补充：
- 若学校后续发布更细的 2026-2027 Taft 专项 rate card，需要再同步。

## Van Doren
来源：
- https://www.housing.illinois.edu/living-communities/halls/taft-van-doren
- https://www.housing.illinois.edu/cost
已确认：
- 修正为无空调历史 hall，更新价格、地址、官网、图片。
待确认：
- 与 Taft 相同，最低价格口径仍建议对照 2026-2027 最新合同页再核。
无信息/需补充：
- 若学校后续发布更细的 2026-2027 Van Doren 专项 rate card，需要再同步。

## Daniels
来源：
- https://www.housing.illinois.edu/living-communities/halls/daniels
- https://www.housing.illinois.edu/cost
已确认：
- 更新 graduate / upper-division 定位、Green Street 位置、12-month 选项、房型价格、地址、官网、图片。
待确认：
- 官方图片更多是公共空间和室内环境，不是完整 room showcase。
无信息/需补充：
- 更清晰的 Daniels room photo / suite photo。

## Sherman
来源：
- https://www.housing.illinois.edu/living-communities/halls/sherman
- https://www.housing.illinois.edu/cost
已确认：
- 更新 graduate / upper-division 定位、break housing、房型价格、地址、官网、图片。
待确认：
- 房费页面按 room-only 展示，若后续 meal plan bundling 口径变化需再核。
无信息/需补充：
- 无。

## LAR
来源：
- https://www.housing.illinois.edu/living-communities/halls/lar
- https://www.housing.illinois.edu/cost
已确认：
- 更新 Scholars Community、in-hall dining、靠近 McKinley / CRCE、价格、地址、官网、图片。
待确认：
- 聚合记录未拆分 Leonard / Shelden 各自楼层差异。
无信息/需补充：
- 无。

## Bromley
来源：
- https://certified.housing.illinois.edu/property/bromley-hall/
- https://certified.housing.illinois.edu/pch-resources/rates/
- https://bromleyhall.com/
- https://bromleyhall.com/rooms-rates/
已确认：
- 更新 all-inclusive dining、semi-private bath、room types、最低价格、地址、官网、图片。
待确认：
- `Corner Standard Double` 在官网房型说明里出现，但价格表只明确列出 `Corner Deluxe Double`。
无信息/需补充：
- Corner Standard Double 的独立价格。

## Illini Tower
来源：
- https://certified.housing.illinois.edu/property/illini-tower/
- https://certified.housing.illinois.edu/pch-resources/rates/
- https://www.illinitoweruiuc.com/
- https://www.illinitoweruiuc.com/floor-plans/
已确认：
- 更新 pet-friendly、dining on site、studio / 2BR / 3BR / 4BR floor plan、最低价格、地址、官网、图片。
待确认：
- 物业官网按 `per bed` 展示多卧室价格，Certified Housing 汇总范围更高；后续如产品页改口径需要再统一。
无信息/需补充：
- 独立 floor plan 图片下载链接。

## Newman
来源：
- https://certified.housing.illinois.edu/property/newman-hall/
- https://certified.housing.illinois.edu/pch-resources/rates/
- https://www.sjcnc.org/housing
- https://www.sjcnc.org/live/room-floorplans
- https://www.sjcnc.org/live/payment-and-pricing
已确认：
- 更新 South / North hall 房型、价格、免费申请、地址、官网、图片。
待确认：
- Certified Housing 汇总页的最低价低于物业详细页，需后续确认是否包含额外 room style。
无信息/需补充：
- 可直接下载的 Newman floor plan 图片/PDF。

## Hendrick House
来源：
- https://certified.housing.illinois.edu/property/hendrick-house/
- https://certified.housing.illinois.edu/pch-resources/rates/
- https://www.hendrickhouse.com/
已确认：
- 更新靠近 engineering、semi-private bath、最低价格、地址、官网、图片。
待确认：
- 官网更完整地展示房间卡片，但东楼/西楼所有变体的 floor plan 图并未统一公开。
无信息/需补充：
- 全部 room variants 的 floor plan PDF。

## Presby Hall
来源：
- https://certified.housing.illinois.edu/property/presby-hall/
- https://certified.housing.illinois.edu/pch-resources/rates/
- https://presbyhall.com/
- https://presbyhall.com/suite-living/
- https://presbyhall.com/rates/
已确认：
- 修正 `Presby Hall` 为 PCH，不再标成校内宿舍；更新 suite living、独立官网、地址、申请费、价格、图片。
待确认：
- Certified Housing 汇总价与官网 `room annual + board annual` 组合并不完全一致。
无信息/需补充：
- 更细的 suite floor plan 图。

## Armory House
来源：
- https://certified.housing.illinois.edu/property/armory-house/
- https://certified.housing.illinois.edu/pch-resources/rates/
- https://www.armoryhouse.com/
- https://www.armoryhouse.com/living-options
- https://www.armoryhouse.com/living-options/rates-availability
已确认：
- 修正 `Armory` 为 `Armory House` 且归类为 PCH；更新 room-and-meal pricing、地址、官网、图片、international-friendly 事实。
待确认：
- Certified Housing 汇总页最低价与物业 detailed pricing 低价相差较小但不完全一致。
无信息/需补充：
- 可下载的独立 floor plan 图。
