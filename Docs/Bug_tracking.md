# PlutoMoney Quant - Bug Tracking & Known Issues

## 🐛 Known Issues

### **High Priority**

| ID | Issue | Impact | Status | Assigned | Target Date |
|----|-------|--------|--------|----------|-------------|
| BUG-001 | Z-score calculation fails when category has <3 funds | Scoring engine crashes | 🔴 Open | - | Week 3 |
| BUG-002 | MongoDB connection pool exhaustion after 100 concurrent requests | API timeouts | 🟡 In Progress | - | Week 4 |
| BUG-003 | BSE API returns 500 error for SIP registration on weekends | Trade failures | 🔴 Open | - | Week 6 |

---

### **Medium Priority**

| ID | Issue | Impact | Status | Assigned | Target Date |
|----|-------|--------|--------|----------|-------------|
| BUG-004 | Allocation matrix missing "Aggressive Explorer + Micro" combination | Portfolio construction fails for small SIPs | 🟡 In Progress | - | Week 5 |
| BUG-005 | Historical trend query slow for funds with >60 months of data | User-facing latency | 🔴 Open | - | Week 7 |
| BUG-006 | Expense ratio validation allows negative values | Data quality issue | 🟢 Resolved | - | ✅ Completed |

---

### **Low Priority**

| ID | Issue | Impact | Status | Assigned | Target Date |
|----|-------|--------|--------|----------|-------------|
| BUG-007 | Fund name inconsistency ("HDFC Top 100" vs "HDFC Top100") causes duplicate entries | Data cleanliness | 🔴 Open | - | Week 8 |
| BUG-008 | Explanation generator repeats same strengths for similar funds | UX quality | 🔴 Open | - | Week 9 |

---

## 🔧 Bug Templates

### **New Bug Report Template**

```markdown
## BUG-XXX: [Short Title]

**Reported By**: [Name]
**Date**: YYYY-MM-DD
**Severity**: Critical / High / Medium / Low
**Component**: Data Ingestion / Scoring / Portfolio / BSE / API

### Description
Clear description of the issue.

### Steps to Reproduce
1. Step one
2. Step two
3. Observed behavior

### Expected Behavior
What should happen instead.

### Actual Behavior
What currently happens (include error logs).

### Environment
- Python version: 3.11.5
- MongoDB version: 7.0.2
- OS: macOS 14.5

### Proposed Fix
(Optional) Your hypothesis on the root cause.

### Logs/Screenshots
```
[Paste error logs here]
```
```

---

## 🛠️ Debugging Checklist

### **When Scoring Fails**

1. ✅ **Check data availability**: Are there ≥3 funds in the category?
   ```python
   db.mf_scheme_data_monthwise.count_documents({
       "timestamp": ISODate("2025-10-01"),
       "fund_category": "Large Cap Equity"
   })
   ```

2. ✅ **Verify parameter nulls**: Are critical params missing?
   ```python
   # Count funds with null sharpe_ratio
   db.mf_scheme_data_monthwise.count_documents({
       "timestamp": ISODate("2025-10-01"),
       "fund_category": "Large Cap Equity",
       "sharpe_ratio": None
   })
   ```

3. ✅ **Check stddev calculation**: Is stddev = 0 (all funds same value)?
   ```python
   # If all funds have expense_ratio=0.9, stddev=0 → Z-score division by zero
   ```

4. ✅ **Validate directionality**: Is the parameter inverted correctly?
   ```python
   # Lower-is-better params should be negative after directionality
   ```

---

### **When Portfolio Construction Fails**

1. ✅ **Check allocation matrix**: Does the risk × SIP bucket exist?
   ```python
   # Missing combo will throw KeyError
   allocation_matrix["Aggressive Explorer"]["Micro"]
   ```

2. ✅ **Verify fund scores exist**: Are scores in Collection 4 for this category?
   ```python
   db.mf_scores.find_one({
       "timestamp": ISODate("2025-10-01"),
       "category_name": "Large Cap Equity",
       "risk_profile": "Balanced Achiever"
   })
   ```

3. ✅ **Check SIP minimums**: Is per-fund allocation below minimum?
   ```python
   # If Large Cap gets ₹500 but fund minimum is ₹1000 → constraint violation
   ```

---

### **When BSE API Fails**

1. ✅ **Verify API credentials**: Are they expired?
2. ✅ **Check BSE server status**: Is it down for maintenance (weekends)?
3. ✅ **Validate scheme codes**: Are they correct (INF vs IND prefix)?
4. ✅ **Check request payload**: Does it match BSE schema exactly?

---

## 📝 Bug Resolution Log

### **BUG-006: Expense Ratio Validation** ✅

**Issue**: Morningstar data occasionally has negative expense ratios (data error).

**Root Cause**: Parser didn't validate range (0.1% - 3%).

**Fix**:
```python
# Added in morningstar_parser.py
if fund_data.get("expense_ratio_equity"):
    er = fund_data["expense_ratio_equity"]
    if er < 0:
        logger.error(f"Invalid expense ratio: {er} for {fund_data['fund_name']}")
        return False  # Reject fund
```

**Resolved By**: Krish  
**Date**: Oct 5, 2025

---

## 🎯 Testing Guidelines

### **Unit Test Coverage Targets**

| Module | Target | Current | Status |
|--------|--------|---------|--------|
| z_score_calculator | 90% | 0% | 🔴 Not Started |
| group_scorer | 85% | 0% | 🔴 Not Started |
| allocation_engine | 90% | 0% | 🔴 Not Started |
| morningstar_parser | 95% | 0% | 🔴 Not Started |

### **Critical Test Cases**

1. **Z-Score Edge Cases**:
   - Category with 1 fund (should skip)
   - All funds have same value for a parameter (stddev=0)
   - Parameter is null for all funds

2. **Portfolio Construction Edge Cases**:
   - SIP amount below minimum threshold (₹500)
   - No eligible funds in a category (all filtered out)
   - Risk profile not in allocation matrix

3. **Data Ingestion Edge Cases**:
   - Duplicate fund names
   - Missing required fields
   - Outlier values (CAGR > 100%)

---

## 🚨 Incident Response Plan

### **Production Down Scenarios**

#### **Scenario 1: MongoDB Connection Lost**

**Symptoms**: All API requests return 500 errors.

**Diagnosis**:
```bash
# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Test connection
python -c "from src.config.database import get_sync_db; db = get_sync_db(); print(db.list_collection_names())"
```

**Resolution**:
1. Restart MongoDB service
2. Check connection string in `.env`
3. Verify IP whitelist on MongoDB Atlas

---

#### **Scenario 2: Scoring Job Fails**

**Symptoms**: No new scores in Collection 4 for current month.

**Diagnosis**:
```bash
# Check scheduler logs
tail -f logs/scheduler.log

# Manually run scoring script
python scripts/monthly_scoring.py
```

**Resolution**:
1. Check Morningstar data was ingested successfully
2. Verify no data quality issues (run parser validators)
3. Re-run scoring script manually

---

## 📊 Error Monitoring

### **Log Levels**

- **DEBUG**: Verbose (development only)
- **INFO**: Normal operations (data loaded, scores calculated)
- **WARNING**: Recoverable issues (outliers, missing optional fields)
- **ERROR**: Failures (validation errors, API errors)
- **CRITICAL**: System-level failures (DB down, scheduler crash)

### **Key Metrics to Monitor**

1. **Data Ingestion**:
   - Funds ingested per month (expect ~1,800)
   - Validation error rate (<5%)

2. **Scoring Engine**:
   - Scoring duration (<2 minutes for all categories)
   - Funds scored per category (expect >10 per category)

3. **API Performance**:
   - Response time (<200ms)
   - Error rate (<1%)
   - Requests per minute

4. **BSE Integration**:
   - SIP registration success rate (>95%)
   - API timeout rate (<2%)

---

**Last Updated**: October 6, 2025

