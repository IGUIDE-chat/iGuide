# QA Evaluation Report - Phase 5 Tier 2

**Date**: 2026-01-27  
**Test Cases**: 20 questions from `bad_cases.json`

## Summary Metrics

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Average Latency | 7.77s | < 3s | ⚠️ NEEDS OPTIMIZATION |
| Keyword Match Rate | 60% | > 80% | ⚠️ NEEDS IMPROVEMENT |
| Average Sources | 0.0 | > 1 | ❌ BUG DETECTED |

## Key Findings

### 1. Performance Issues
- **High Latency**: Average 7.77s is significantly above the 3s target
- **Root Cause**: Likely due to:
  - ONNX model inference time (embedding + reranker)
  - LLM API response time (DeepSeek/SiliconFlow)
  - Network latency to external APIs

### 2. Source Attribution Bug
- **Issue**: `sources_count` is consistently 0
- **Impact**: Users cannot verify information source
- **Action Required**: Check SSE streaming format in `backend/main.py`

### 3. Knowledge Base Coverage
- **Match Rate**: 60% suggests knowledge base has gaps
- **Examples of missing info**:
  - TOEFL score requirements (admission data incomplete)
  - Specific course difficulty/reviews (subjective data)
  - Real-time information (food locations, bus schedules)

## Recommendations

### High Priority
1. **Fix Source Attribution Bug**
   - Review SSE event structure in `main.py`
   - Ensure sources are properly serialized in response

2. **Optimize Latency**
   - Profile ONNX inference time
   - Consider model quantization (INT8)
   - Implement caching for common queries

### Medium Priority
3. **Expand Knowledge Base**
   - Add admissions FAQ data
   - Include course review aggregation
   - Link to official university resources

4. **Improve Rerank Threshold**
   - Current confidence threshold: 0.4
   - Consider adaptive thresholding

## Next Steps
- [ ] Fix sources bug in streaming response
- [ ] Run optimization profiling
- [ ] Re-run evaluation after fixes
- [ ] Proceed to Tier 3 (Deployment) when metrics meet targets
