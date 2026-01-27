# Query Optimization Specification

## 0. Objective

Improve recall and accuracy for vague/ambiguous queries:

* **No hallucination** - Avoid LLM guessing
* **Low cost** - Local retrieval first
* **Signal-driven** - Use retrieval scores to trigger optimization

---

## 1. When to Optimize (Trigger Conditions)

### Baseline Retrieval Signals

In `local_search(query)`, perform initial retrieval and collect:

* `fts_hits`: Number of FTS matches
* `vec_top1`: Top-1 vector similarity score
* `rerank_top1`: Top-1 reranker score
* `has_entity`: Whether explicit entities detected (course code, professor, building, department)
* `q_len`: Query length (words for English, characters for Chinese)

### Trigger Multi-Query Expansion

Trigger if **ANY 2** of the following are true:

1. `q_len` is short: English ≤ 3 words OR Chinese ≤ 6 characters
2. `has_entity == false` (no course code or named entity)
3. `fts_hits < 5`
4. `vec_top1 < 0.35`
5. `rerank_top1 < 0.55`

### Trigger Web Fallback

* `rerank_top1 < 0.35` AND query contains real-time keywords (today, last night, deadline, game score, 刚刚, 截止)
* OR after optimization, still `rerank_top1 < 0.35` with insufficient local candidates

### Trigger Clarification (Optional)

* Query is a vague intent (insurance, counseling, transfer, housing, parking)
* AND after optimization, still `rerank_top1 < 0.5`
* => Return category options + ask minimal clarifying question

---

## 2. How to Optimize (By Cost, Low to High)

### Level 1 (Required): Lightweight Normalization

**No LLM calls**, rule-based only:

* **Course code standardization**: `CS440 / CS-440 / cs 440` → `CS 440`
* **Whitespace cleanup**: Remove extra spaces, normalize case (preserve numbers/codes)
* **Symbol normalization**: Chinese/English punctuation unification
* **Synonym mapping**: Small keyword dictionary (non-LLM)

**Output**: `normalized_query`

---

### Level 2 (Recommended): Multi-Query Expansion

**No LLM calls**, generate 3-6 sub-queries for parallel retrieval:

#### 2.1 Domain Dictionary Expansion (UIUC Common Intents)

Maintain a small map (start with 20 high-frequency intents):

```python
INTENT_EXPANSIONS = {
    # Insurance & Health
    "保险": "insurance waiver McKinley student health plan",
    "insurance": "waiver McKinley student health plan coverage",
    "心理医生": "counseling mental health therapy McKinley DRES",
    "counseling": "mental health therapy McKinley wellness",
    
    # Academic
    "转专业": "transfer major requirements LAS Grainger Engineering",
    "transfer": "change major requirements inter-college",
    "选课": "registration add drop CRN course schedule",
    "registration": "add drop course CRN enrollment",
    "先修课": "prerequisite corequisite requirement",
    "prerequisite": "prereq corequisite requirement",
    
    # Housing
    "住宿": "housing dorm residence hall lease sublease",
    "housing": "dorm residence hall certified private",
    "宿舍": "dorm residence hall housing",
    "dorm": "residence hall housing certified",
    
    # Facilities
    "健身房": "ARC CRCE gym fitness recreation",
    "gym": "ARC CRCE fitness recreation center",
    "图书馆": "library Grainger Undergraduate Main",
    "library": "Grainger Undergraduate Main study hours",
    
    # Immigration
    "签证": "visa F-1 I-20 ISSS immigration",
    "visa": "F-1 I-20 ISSS immigration status",
    "实习": "OPT CPT internship work authorization ISSS",
    "internship": "OPT CPT work authorization ISSS",
    
    # Financial
    "学费": "tuition fees payment deadline bursar",
    "tuition": "fees payment deadline bursar financial aid",
    "奖学金": "scholarship financial aid grant fellowship",
    "scholarship": "financial aid grant fellowship award",
    
    # Transportation
    "停车": "parking permit campus transportation CUMTD",
    "parking": "permit campus transportation lot",
    "公交": "bus CUMTD MTD route schedule",
    "bus": "CUMTD MTD route schedule transportation",
}
```

#### 2.2 Bilingual Expansion

* If query is primarily Chinese: Add English keyword version (dictionary-based, not full translation)
* If query is primarily English: Optionally add Chinese keywords

#### 2.3 Entity Boosting

If course code detected, add query variant:
* `"CS 225"` → `"CS 225 syllabus grading prerequisites"`

#### 2.4 Preserve Original

Expansion list must include:
* Original query
* Normalized query
* Domain-expanded queries (0-3)
* Entity-boosted queries (if applicable)

**Output**: `queries[]` (deduplicated, max 6)

---

### Level 3 (Optional): LLM Query Rewrite

**Only use when Level 2 still yields low scores**. Only generate search keywords, NOT answers.

Output structure:
* `intent`
* `entities`
* `expanded_queries[]` (≤ 5)

> **Current phase**: Skip Level 3 for now.

---

## 3. Implementation Flow

### 3.1 Main Flow (Pseudocode)

```python
def local_search(user_query: str) -> SearchResult:
    q0 = user_query
    q = normalize_query(q0)
    entities = extract_entities(q)
    
    # Step A: Baseline retrieval
    cands = retrieve_parallel(q, entities)
    ranked = rerank(q, cands)
    signals = score_signals(cands, ranked, entities, q)
    
    # Step B: Decide optimization
    if should_expand(signals):
        q_list = expand_queries(q0, q, entities)
        cands2 = retrieve_multiquery_parallel(q_list, entities)
        ranked2 = rerank(q, cands2)
        signals2 = score_signals(cands2, ranked2, entities, q)
        
        if signals2.rerank_top1 >= signals.rerank_top1:
            ranked, signals = ranked2, signals2
    
    # Step C: Decide fallback
    if should_web_fallback(signals, q0):
        web_ctx = tavily_search(q0)
        return SearchResult(mode="web_fallback", context=web_ctx)
    
    if should_ask_clarify(signals, q0):
        return SearchResult(mode="clarify", prompt=clarify_prompt(q0))
    
    return SearchResult(mode="local", chunks=ranked.top5)
```

### 3.2 retrieve_parallel (Existing Architecture)

* `fts_topk = fts_search(q or entities_boosted_q, k=30)`
* `vec_topk = vec_search(embedding(q), k=30)`
* Merge and deduplicate by `chunk_id`
* Pass to reranker

### 3.3 retrieve_multiquery_parallel

For each `qi in queries[]`:
* FTS search + Vector search
* Merge all candidates (cap at 200 total)
* Deduplicate and rerank

---

## 4. Default Thresholds

### should_expand

Trigger if **ANY 2** conditions met:
* `q_len_short = (en_words<=3 or zh_chars<=6)`
* `has_entity == false`
* `fts_hits < 5`
* `vec_top1 < 0.35`
* `rerank_top1 < 0.55`

### should_web_fallback

* After optimization: `rerank_top1 < 0.35` AND query has real-time keywords
* OR after optimization: `rerank_top1 < 0.35` with insufficient local candidates

### should_ask_clarify (Optional)

* Query is vague intent & after optimization: `rerank_top1 < 0.5`

---

## 5. Deliverables (AI Coder Task List)

1. ✅ Implement `normalize_query()` (course code normalization)
2. ✅ Implement `extract_entities()` (regex: course codes, buildings, departments)
3. ✅ Implement `expand_queries()` (dictionary + entity boosting + bilingual keywords)
4. ✅ Add `should_expand()` decision logic in `local_search()`
5. ✅ Implement multi-query retrieval
6. ✅ Output `signals` logging: `fts_hits, vec_top1, rerank_top1, expanded_used, queries_count`
7. ✅ Write 20 unit tests: short query, vague query, course codes, Chinese, English, mixed

---

## 6. Entity Extraction Patterns

### Course Codes
```python
COURSE_CODE_PATTERN = r'\b([A-Z]{2,4})\s*[-]?\s*(\d{3})\b'
# Matches: CS 225, CS225, CS-225, ECE391, MATH 241
```

### Buildings
```python
BUILDINGS = [
    "Siebel", "Grainger", "DCL", "ECEB", "Altgeld", "Lincoln Hall",
    "Armory", "ARC", "CRCE", "Union", "Illini Union", "ISR",
    "PAR", "FAR", "Ikenberry", "McKinley"
]
```

### Departments
```python
DEPARTMENTS = [
    "CS", "ECE", "MATH", "PHYS", "CHEM", "ME", "CEE", "ISSS",
    "Computer Science", "Electrical Engineering", "Mechanical Engineering"
]
```

---

## 7. Test Cases (20 Examples)

### Short Queries
1. "CS 225" → Should expand with syllabus/grading
2. "保险" → Should expand with insurance/waiver/McKinley
3. "ARC" → Should expand with gym/fitness/hours

### Vague Queries
4. "心理医生" → Should expand with counseling/mental health
5. "transfer" → Should expand with major/requirements
6. "housing" → Should expand with dorm/residence/certified

### Course-Related
7. "CS 225 prerequisites" → Should detect entity, boost with course info
8. "ECE 391 syllabus" → Should detect entity
9. "MATH 241 difficulty" → Should detect entity

### Bilingual
10. "CS 225的GPA要求" → Should preserve CS 225, expand in English
11. "UIUC的计算机专业" → Should preserve UIUC, expand CS/Computer Science
12. "选课怎么操作" → Should expand registration/add/drop

### Real-Time (Should trigger web fallback)
13. "basketball game score today"
14. "今天的比赛结果"
15. "deadline today"

### Mixed
16. "How to waive insurance?" → Should expand with McKinley/health plan
17. "停车permit怎么买" → Should expand parking/permit/campus
18. "图书馆开放时间" → Should expand library/hours/Grainger

### Edge Cases
19. "" (empty) → Should handle gracefully
20. "asdfghjkl" (gibberish) → Should fallback to web or return no results

---

## 8. Signal Logging Format

```python
logger.info(f"Query Signals: fts_hits={signals.fts_hits}, "
            f"vec_top1={signals.vec_top1:.3f}, "
            f"rerank_top1={signals.rerank_top1:.3f}, "
            f"has_entity={signals.has_entity}, "
            f"q_len={signals.q_len}, "
            f"expanded={signals.expanded_used}, "
            f"queries_count={signals.queries_count}")
```

---

## 9. Performance Targets

* **Latency**: Multi-query expansion should add < 200ms (parallel retrieval)
* **Recall improvement**: +15-30% for vague queries
* **Precision**: No degradation for specific queries
* **Expansion rate**: ~30-40% of queries should trigger expansion
