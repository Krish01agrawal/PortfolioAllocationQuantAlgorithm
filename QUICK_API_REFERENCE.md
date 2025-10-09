# 🚀 Quick API Reference

# Test data ingestion (WORKING ✅)
npm run test:ingestion


## Server
```bash
# Start server
npm run start:dev

# URL
http://localhost:3000
```

---

## Endpoints

### 1. POST /api/mutual-funds/ingest
```bash
curl -X POST http://localhost:3000/api/mutual-funds/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "funds": [
      {
        "Fund_ID": "YOUR_ID",
        "Fund_Name": "Your Fund",
        "Category": "Large Cap",
        "NAV": 100,
        "5Y_CAGR": 18.5,
        "Fund_House": "Tier 1",
        "Manager_Record": "Excellent",
        "ESG": "Strong"
      }
    ],
    "timestamp": "2025-11-01"
  }'
```

### 2. GET /api/mutual-funds
```bash
# All funds
curl http://localhost:3000/api/mutual-funds | python3 -m json.tool

# Filter by category
curl "http://localhost:3000/api/mutual-funds?category=Large%20Cap%20Equity" | python3 -m json.tool

# Filter by status
curl "http://localhost:3000/api/mutual-funds?status=Active" | python3 -m json.tool
```

### 3. GET /api/mutual-funds/:id
```bash
curl http://localhost:3000/api/mutual-funds/LC001 | python3 -m json.tool
```

### 4. GET /api/mutual-funds/:id/history
```bash
# All history
curl http://localhost:3000/api/mutual-funds/LC001/history | python3 -m json.tool

# Date range
curl "http://localhost:3000/api/mutual-funds/LC001/history?fromDate=2025-01-01&toDate=2025-12-31" | python3 -m json.tool
```

---

## Quick Test

```bash
# 1. Ingest data
curl -X POST http://localhost:3000/api/mutual-funds/ingest \
  -H "Content-Type: application/json" \
  -d @test-api-payload.json | python3 -m json.tool

# 2. Get all funds
curl http://localhost:3000/api/mutual-funds | python3 -m json.tool

# 3. Get specific fund
curl http://localhost:3000/api/mutual-funds/TEST001 | python3 -m json.tool

# 4. Get fund history
curl http://localhost:3000/api/mutual-funds/TEST001/history | python3 -m json.tool
```

---

## Verify in MongoDB

```bash
# Count documents
mongosh plutomoney_quant --eval "
  print('Funds:', db.mfSchemeTrackRecord.countDocuments());
  print('Snapshots:', db.mfSchemeDataMonthwise.countDocuments());
"

# View specific fund
mongosh plutomoney_quant --eval "
  db.mfSchemeDataMonthwise.findOne({Fund_ID: 'TEST001'})
" | python3 -m json.tool
```

---

## Sample Payloads

**Minimal (required fields only):**
```json
{
  "funds": [{
    "Fund_ID": "MIN001",
    "Fund_Name": "Minimal Fund",
    "Category": "Large Cap"
  }],
  "timestamp": "2025-12-01"
}
```

**Complete (all fields):**
```json
{
  "funds": [{
    "Fund_ID": "FULL001",
    "Fund_Name": "Complete Fund Data",
    "Category": "Large Cap",
    "NAV": 85.5,
    "AUM_Cr": 35700,
    "5Y_CAGR": 18.86,
    "3Y_Rolling": 85,
    "Sharpe_3Y": 1.22,
    "Sortino_3Y": 1.52,
    "Alpha": 1.5,
    "Beta": 0.95,
    "Std_Dev": 13.8,
    "Max_DD": -14.2,
    "Recovery_Mo": 9,
    "Downside_Capture": 65,
    "Expense": 0.66,
    "Turnover": 32,
    "Concentration": 38,
    "Fund_House": "Tier 1",
    "Manager_Tenure": 8,
    "Manager_Record": "Excellent",
    "AMC_Risk": "Good",
    "ESG": "Strong"
  }],
  "timestamp": "2025-12-01"
}
```

---

**See `API_TESTING.md` for comprehensive documentation**

**See `API_SUCCESS.md` for test results & verification**

