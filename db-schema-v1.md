# Database Schema Design

## Overview

本文档记录系统整体数据架构设计，涵盖关系型数据库表结构与知识图谱设计。

### 架构分层

| 层级 | 内容 | 存储方式 |
|------|------|----------|
| 静态数据 | 院系、教师、课程、设施、商户 | 关系型数据库 |
| 动态数据 | 开课信息、学年日历、RSO | 关系型数据库（频繁更新） |
| 实时数据 | 随机活动 Events | 知识图谱（实时关系查询） |

---

## Relational Database

### 1. Departments

院系基本信息，作为 Faculty、Courses、RSO 等表的基础外键来源。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Name | VARCHAR | |
| Web_URL | VARCHAR | |
| Building_ID | FK → Facilities | 替代原始字符串 Location |
| Phone | VARCHAR | 原 Contact_Info 拆分 |
| Email | VARCHAR | 原 Contact_Info 拆分 |

---

### 2. Faculty

教师信息。教师可跨系任职，通过 `Faculty_Departments` 关联表处理多对多关系。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| First_Name | VARCHAR | |
| Last_Name | VARCHAR | |
| Title | VARCHAR | 如 Professor、Lecturer |
| Email | VARCHAR | |
| Web_URL | VARCHAR | |
| Office_ID | FK → Facilities | 替代原始字符串 Office_Location |

#### `Faculty_Departments` 关联表

| 字段 | 类型 | 说明 |
|------|------|------|
| Faculty_ID | FK → Faculty | |
| Department_ID | FK → Departments | |

---

### 3. Courses

课程目录，记录课程本身的固定信息，不涉及具体开课安排。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Course_Number | VARCHAR | 如 CS101 |
| Title | VARCHAR | |
| Dept_ID | FK → Departments | |
| Credits | INT | |
| Level | ENUM | undergraduate / graduate |
| Description | TEXT | 原 Course_Info 明确化 |

#### `Course_Prerequisites` 关联表

先修课为多对多自关联，不应存为单字段。

| 字段 | 类型 | 说明 |
|------|------|------|
| Course_ID | FK → Courses | |
| Prerequisite_Course_ID | FK → Courses | |

---

### 4. Course_Offerings `[Dynamic]`

每学期的具体开课安排，与课程目录分离，支持同一课程多开。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Course_ID | FK → Courses | 原字段引用 Course_Number，改为 ID |
| Term | VARCHAR | 如 Fall 2025 |
| Days_of_Week | VARCHAR | 如 Mon,Wed,Fri |
| Start_Time | TIME | 原 Schedule 拆分 |
| End_Time | TIME | 原 Schedule 拆分 |
| Room_ID | FK → Facilities | 替代字符串 Location |
| Total_Seats | INT | |
| Enrolled_Seats | INT | 可实时计算剩余名额 |

#### `Offering_Faculty` 关联表

一门课可由多位教师共同授课。

| 字段 | 类型 | 说明 |
|------|------|------|
| Offering_ID | FK → Course_Offerings | |
| Faculty_ID | FK → Faculty | |

---

### 5. Academic_Calendar `[Dynamic]`

记录学校官方学年日历中的制度性事件，具有周期性，按学期提前写入。

> **与 Events 的边界**：凡出现在学校官方学年日历上的事件（选课截止、考试周、开学日等）均入此表；随机举办的活动进入 Events 知识图谱。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Term | VARCHAR | 如 Fall 2025 |
| Event_Name | VARCHAR | |
| Event_Type | ENUM | 见下方枚举值 |
| Start_Date | DATE | |
| End_Date | DATE | |
| Is_Deadline | BOOLEAN | |

`Event_Type` 枚举值：

```
registration_open | registration_close
classes_begin | classes_end
add_drop_deadline | withdrawal_deadline
exam_period | commencement
holiday
```

---

### 6. Facilities / Buildings

校园内所有建筑与设施，被 Departments、Faculty、Course_Offerings 等多处引用。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Name | VARCHAR | |
| Type | VARCHAR | 如 Academic, Dining, Recreation |
| Address | VARCHAR | |
| Latitude | DECIMAL | 可选，用于地图集成 |
| Longitude | DECIMAL | 可选，用于地图集成 |
| Operating_Hours | VARCHAR | 建议统一格式，如 JSON |
| Status | ENUM | open / closed / under_maintenance |

---

### 7. RSO `[Dynamic]`

注册学生组织，与院系为可选关联（部分 RSO 挂靠院系，部分独立）。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Name | VARCHAR | |
| Category | VARCHAR | 如 Academic、Cultural、Sports |
| Department_ID | FK → Departments | nullable，非所有 RSO 挂靠院系 |
| Description | TEXT | |
| Email | VARCHAR | 原 Contact_Info 拆分 |
| Phone | VARCHAR | 原 Contact_Info 拆分 |
| Web_URL | VARCHAR | |

---

### 8. External_Partners

原 Merchants 与 Third_Party_Collaborators 结构完全相同，合并为单表，以 `Type` 字段区分。

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | PK | |
| Name | VARCHAR | |
| Type | ENUM | merchant / collaborator |
| Category | VARCHAR | |
| Address | VARCHAR | |
| Description | TEXT | 原 Merchant_Info 明确化 |
| Contact_Email | VARCHAR | 原 Contact 拆分 |
| Contact_Phone | VARCHAR | 原 Contact 拆分 |

---

## Knowledge Graph — Events

### 设计理由

随机举办的 Events 具有以下特性，不适合存入关系型数据库：

- **强时效性** — 过期即失效，无需长期持久化
- **主办方多样** — 可为院系、RSO、教师或外部方，关系复杂
- **形式灵活** — 线上 / 线下 / 混合，无固定结构
- **无重复性** — 一次性活动，不存在周期规则

### 节点 (Nodes)

```
(Event)
  - title
  - description
  - start_datetime
  - end_datetime
  - status          # upcoming | ongoing | completed | cancelled
  - is_public
  - capacity        # nullable，null 表示无人数限制

(Facility)          # 引用 Facilities 表 ID，不重复存储
(Department)        # 引用 Departments 表 ID
(RSO)               # 引用 RSO 表 ID
(Faculty)           # 引用 Faculty 表 ID

(Tag)
  - name            # 如 free-food | networking | graduate | open-to-all
```

> 图谱节点中仅存储对应数据库表的主键 ID，查询详细信息时联查关系型数据库，避免数据冗余。

### 边 (Relationships)

```
(Event)-[:HOSTED_BY]->(Department)
(Event)-[:HOSTED_BY]->(RSO)
(Event)-[:HOSTED_BY]->(Faculty)
(Event)-[:CO_HOSTED_BY]->(Department)     # 协办方
(Event)-[:CO_HOSTED_BY]->(RSO)

(Event)-[:LOCATED_AT]->(Facility)
(Event)-[:TAGGED_WITH]->(Tag)
```

### 示例查询 (Cypher)

```cypher
-- 查询某 RSO 所有即将举办的活动
MATCH (e:Event)-[:HOSTED_BY]->(r:RSO {id: 42})
WHERE e.status = "upcoming"
RETURN e ORDER BY e.start_datetime

-- 查询某建筑近期所有活动
MATCH (e:Event)-[:LOCATED_AT]->(f:Facility {name: "Student Union"})
WHERE e.start_datetime >= datetime()
RETURN e

-- 查询带特定标签的活动
MATCH (e:Event)-[:TAGGED_WITH]->(t:Tag {name: "free-food"})
WHERE e.status = "upcoming"
RETURN e

-- 查询某院系主办或协办的所有活动
MATCH (e:Event)-[:HOSTED_BY|CO_HOSTED_BY]->(d:Department {id: 7})
RETURN e
```

---

## 表关系总览

```
Departments ──< Faculty_Departments >── Faculty
            ──< Courses
            ──< RSO

Faculty ──< Faculty_Departments
        ──< Offering_Faculty

Courses ──< Course_Prerequisites (自关联)
        ──< Course_Offerings ──< Offering_Faculty

Facilities ──  Departments (Building_ID)
           ──  Faculty (Office_ID)
           ──  Course_Offerings (Room_ID)

External_Partners  (独立，Type 区分 merchant / collaborator)

Academic_Calendar  (独立，按学期写入)

─────────────────────────────────────────
Knowledge Graph (Events)
  引用以上各表 ID，不重复存储属性
─────────────────────────────────────────
```

---

## 设计决策汇总

| 决策 | 原因 |
|------|------|
| Contact_Info 统一拆分为 Email / Phone | 宽泛字段难以查询和验证 |
| Location 字符串改为 FK → Facilities | 统一地点数据源，避免拼写不一致 |
| Prerequisites 独立关联表 | 一门课可有多个先修课，单字段无法表达 |
| Faculty ↔ Department 多对多关联表 | 教师可跨系任职 |
| Course_Offerings 引用 Course_ID 而非 Course_Number | 避免冗余与不一致，Course_Number 可能变更 |
| Merchants + Third_Party_Collaborators 合并 | 两表结构完全相同，Type 字段区分即可 |
| Events 使用知识图谱而非关系型数据库 | 高时效、随机、关系复杂，图谱更适合实时查询 |
| Academic_Calendar 与 Events 严格分离 | 前者周期性制度性，后者随机一次性，性质不同 |
