# 🚀 Production Data Flow - Quick Summary

## 📅 Monthly Schedule

```
┌─────────────────────────────────────────────────────┐
│  1st of Every Month at 2:00 AM IST                  │
│  Cron Job Automatically Triggers                    │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow (5 Steps)

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: FETCH                                                     │
│ ────────────────────────────────────────────────────────────────  │
│  MorningstarApiService.fetchMonthlyData()                         │
│   ↓                                                                │
│  GET https://api.morningstar.com/v1/funds/india                  │
│  Headers: { 'X-API-Key': 'xxx' }                                 │
│   ↓                                                                │
│  Response: [ {fund1}, {fund2}, ... {fund500} ]                   │
│  (Raw JSON with all 27 parameters)                                │
└──────────────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: PARSE & VALIDATE                                          │
│ ────────────────────────────────────────────────────────────────  │
│  MorningstarParserService.parseString(jsonData)                   │
│   ↓                                                                │
│  For each fund:                                                    │
│   1. Check required fields (fund_name, fund_category)            │
│   2. Normalize category: "Flexi Cap" → "Flexi-Cap / MultiCap"   │
│   3. Validate types (@IsNumber, @IsString)                        │
│   4. Check ranges (@Min, @Max)                                    │
│   5. Detect outliers (CAGR > 100%?)                              │
│   ↓                                                                │
│  Result: FundDataDto[] (validated funds only)                     │
└──────────────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: TIMESTAMP                                                  │
│ ────────────────────────────────────────────────────────────────  │
│  getLastMonthTimestamp()                                           │
│   ↓                                                                │
│  Example: Today = Oct 1, 2025                                     │
│           Return = Sep 1, 2025 00:00:00 UTC                       │
└──────────────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: INGEST TO DATABASE                                        │
│ ────────────────────────────────────────────────────────────────  │
│  MutualFundService.ingestMonthlyData(funds, timestamp)            │
│   ↓                                                                │
│  For each fund:                                                    │
│                                                                    │
│  ┌─────────────────────────────────────────┐                      │
│  │ A. Upsert Collection 1                   │                      │
│  │    (mfSchemeTrackRecord)                 │                      │
│  │    ↓                                      │                      │
│  │    Find by fund_name                     │                      │
│  │    If exists → update                    │                      │
│  │    If not → create new                   │                      │
│  │    Returns: fundId                       │                      │
│  └─────────────────────────────────────────┘                      │
│         ↓                                                          │
│  ┌─────────────────────────────────────────┐                      │
│  │ B. Check if snapshot exists              │                      │
│  │    (mfSchemeDataMonthwise)               │                      │
│  │    ↓                                      │                      │
│  │    Query: { fundId, timestamp }          │                      │
│  │                                           │                      │
│  │    If exists (rare):                     │                      │
│  │      → Update existing                   │                      │
│  │                                           │                      │
│  │    If not exists (normal):               │                      │
│  │      → Create new snapshot               │                      │
│  │      → Returns: snapshotId               │                      │
│  └─────────────────────────────────────────┘                      │
│         ↓                                                          │
│  ┌─────────────────────────────────────────┐                      │
│  │ C. Link snapshot to master record        │                      │
│  │    ↓                                      │                      │
│  │    Update Collection 1:                  │                      │
│  │    $push to schemeMonthTrackList:        │                      │
│  │    {                                      │                      │
│  │      timestamp: Sep 1, 2025              │                      │
│  │      mfDataId: snapshotId                │                      │
│  │    }                                      │                      │
│  └─────────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: RESULTS & LOGGING                                         │
│ ────────────────────────────────────────────────────────────────  │
│  Return IngestionResult:                                           │
│   {                                                                │
│     success: true,                                                 │
│     fundsProcessed: 487,                                           │
│     fundsAdded: 487,                                               │
│     fundsUpdated: 0,                                               │
│     errors: [],                                                    │
│     timestamp: Sep 1, 2025                                         │
│   }                                                                │
│   ↓                                                                │
│  Log to console                                                    │
│  Send alerts if needed                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Transformation Example

### Before (Morningstar Raw)
```json
{
  "fund_name": "Axis Bluechip Fund",
  "fund_category": "Large Cap",              ← Variation!
  "five_year_cagr_equity": 13.8,
  "sharpe_ratio": 1.12,
  ...
}
```

### After Normalization
```json
{
  "fund_name": "Axis Bluechip Fund",
  "fund_category": "Large Cap Equity",       ← Normalized!
  "five_year_cagr_equity": 13.8,
  "sharpe_ratio": 1.12,
  ...
}
```

### In MongoDB Collection 2
```json
{
  "_id": ObjectId("abc123"),
  "timestamp": ISODate("2025-09-01T00:00:00Z"),
  "fundId": ObjectId("xyz789"),
  "fund_name": "Axis Bluechip Fund",
  "fund_category": "Large Cap Equity",
  "five_year_cagr_equity": 13.8,
  "sharpe_ratio": 1.12,
  ...27 parameters...
  "createdAt": ISODate("2025-10-01T02:03:45Z")
}
```

---

## 🔧 Test vs Production

| Feature | Test Script | Production Cron |
|---------|-------------|-----------------|
| **Trigger** | `npm run test:ingestion` | Automatic (cron) |
| **Data** | Hardcoded 4 funds | API ~500 funds |
| **API Call** | ❌ Skipped | ✅ Real HTTP |
| **Schedule** | Manual | Monthly (1st, 2 AM) |
| **Env Required** | MongoDB only | MongoDB + Morningstar API key |

---

## 🎯 Key Components

```
src/modules/
│
├── cron/
│   └── services/data-ingestion-cron.service.ts
│       ├─ @Cron('0 2 1 * *')                 ← Scheduler
│       └─ handleMonthlyIngestion()            ← Orchestrator
│
├── morningstar/
│   └── services/
│       ├── morningstar-api.service.ts
│       │   ├─ fetchMonthlyData()              ← HTTP GET
│       │   └─ Retry logic (3 attempts)
│       │
│       └── morningstar-parser.service.ts
│           ├─ parseString()                   ← Validate
│           └─ normalizeFundCategory()          ← Normalize
│
└── mutual-fund/
    ├── services/mutual-fund.service.ts
    │   └─ ingestMonthlyData()                 ← DB orchestration
    │
    └── dao/
        ├── mf-scheme-track-record.dao.ts      ← Collection 1
        └── mf-scheme-data-monthwise.dao.ts    ← Collection 2
```

---

## ✅ Setup Checklist

To enable production flow:

### 1. Environment Variables
```bash
# .env file
MORNINGSTAR_API_KEY=your_key_here
MORNINGSTAR_API_URL=https://api.morningstar.com/v1
CRON_ENABLED=true
```

### 2. Start Application
```bash
npm run start:dev
```

### 3. Verify Cron is Active
```
[Nest] LOG ✅ Monthly data ingestion cron is ENABLED
```

### 4. Wait for 1st of Month (or Manual Trigger)
```bash
# Manual test (bypass cron schedule)
# Create a controller endpoint that calls:
# cronService.triggerManualIngestion()
```

---

## 🚨 Error Handling

```
API Down?
  ↓
Retry 3 times with exponential backoff
  ↓
Still failing?
  ↓
Log error + Send alert
  ↓
Cron will retry next month
```

```
Validation Failures?
  ↓
Skip invalid funds
  ↓
Continue with valid ones
  ↓
Log warnings
  ↓
Alert if >10% fail
```

---

## 📈 Monthly Growth

```
Month 1 (Sep): 487 funds → Collection 2: 487 snapshots
Month 2 (Oct): 487 funds → Collection 2: 974 snapshots
Month 3 (Nov): 487 funds → Collection 2: 1,461 snapshots
...
Year 1: ~5,844 snapshots (487 × 12)
```

---

## 🎉 Summary

**Test Script:** Simulates steps 2-4 with hardcoded data  
**Production Cron:** Executes all 5 steps with real API data  

**Your system is ready for production!** 🚀

Just add the Morningstar API key and set `CRON_ENABLED=true`!

