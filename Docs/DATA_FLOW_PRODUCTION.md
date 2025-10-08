# End-to-End Production Data Flow

## 📋 Overview

This document explains the **complete production flow** of how data flows from Morningstar API to your MongoDB database, including all components, transformations, and error handling.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

1. TRIGGER (Monthly - 1st Working Day at 2 AM IST)
   │
   └──> CronModule
        └──> DataIngestionCronService
             │
             │ @Cron('0 2 1 * *')  // 1st of every month at 2 AM
             │
             ▼
2. FETCH DATA FROM MORNINGSTAR
   │
   └──> MorningstarApiService.fetchMonthlyData()
        │
        │ HTTP GET https://api.morningstar.com/v1/funds/india
        │ Headers: { 'X-API-Key': 'xxx', 'Accept': 'application/json' }
        │
        ▼
        Raw JSON Response (Array of ~500-1000 funds)
        [
          {
            "fund_name": "Axis Bluechip Fund",
            "fund_category": "Large Cap",  // ⚠️ Variations!
            "five_year_cagr_equity": 13.8,
            ...27 parameters
          },
          ...
        ]
        │
        ▼
3. PARSE & VALIDATE
   │
   └──> MorningstarParserService.parseString(jsonData)
        │
        ├─> For each fund:
        │   │
        │   ├─> Step 1: Check required fields (fund_name, fund_category)
        │   │   ❌ Missing? → Skip fund, log warning
        │   │
        │   ├─> Step 2: Normalize category name
        │   │   "Large Cap" → "Large Cap Equity"
        │   │   "Flexi Cap Equity" → "Flexi-Cap / MultiCap"
        │   │
        │   ├─> Step 3: Transform to DTO
        │   │   plainToClass(FundDataDto, rawData)
        │   │
        │   ├─> Step 4: Class-validator validation
        │   │   • Check types (IsNumber, IsString)
        │   │   • Check ranges (@Min, @Max)
        │   │   • Check enums (fund_category in FUND_CATEGORIES)
        │   │   ❌ Invalid? → Skip fund, log error
        │   │
        │   ├─> Step 5: Check critical fields
        │   │   ⚠️ Missing sharpe_ratio? → Warn but continue
        │   │
        │   └─> Step 6: Detect outliers
        │       ⚠️ CAGR > 100%? → Warn but continue
        │
        ▼
        Returns: FundDataDto[] (validated funds only)
        │
        ▼
4. INGEST TO DATABASE
   │
   └──> MutualFundService.ingestMonthlyData(validatedFunds, timestamp)
        │
        ├─> Normalize timestamp to 1st of month (2025-10-01T00:00:00Z)
        │
        └─> For each validated fund:
            │
            ├─> STEP 1: Upsert Collection 1 (mfSchemeTrackRecord)
            │   │
            │   └──> MfSchemeTrackRecordDao.upsert(fund_name, {...})
            │        │
            │        │ findOneAndUpdate({ fund_name }, { $set: {...} })
            │        │ Options: { upsert: true, new: true }
            │        │
            │        ▼
            │        Document Created/Updated:
            │        {
            │          _id: ObjectId("..."),
            │          fund_name: "Axis Bluechip Fund",
            │          amc: "Axis Mutual Fund",
            │          scheme_code: "112345",
            │          status: "Active",
            │          schemeMonthTrackList: [] // Empty initially
            │        }
            │        │
            │        Returns: fundId (ObjectId)
            │
            ├─> STEP 2: Check if snapshot exists for this month
            │   │
            │   └──> MfSchemeDataMonthwiseDao.findByFundAndTimestamp(fundId, timestamp)
            │        │
            │        │ Query: { fundId: ObjectId, timestamp: ISODate }
            │        │
            │        ├─> Found? → UPDATE (rare case: re-ingestion)
            │        │   │
            │        │   └──> MfSchemeDataMonthwiseDao.update(snapshotId, fundData)
            │        │        Result: fundsUpdated++
            │        │
            │        └─> Not Found? → INSERT NEW (normal case)
            │            │
            │            ├─> Create new snapshot document
            │            │   │
            │            │   └──> MfSchemeDataMonthwiseDao.create(fundId, timestamp, fundData)
            │            │        │
            │            │        │ new Model({
            │            │        │   timestamp: ISODate("2025-10-01"),
            │            │        │   fundId: ObjectId("..."),
            │            │        │   fund_name: "Axis Bluechip Fund",
            │            │        │   fund_category: "Large Cap Equity",
            │            │        │   five_year_cagr_equity: 13.8,
            │            │        │   ...all 27 parameters
            │            │        │ })
            │            │        │
            │            │        ▼
            │            │        Returns: snapshot (with _id)
            │            │        Result: fundsAdded++
            │            │
            │            └─> STEP 3: Add reference to Collection 1
            │                │
            │                └──> MfSchemeTrackRecordDao.addMonthlyReference(
            │                     fundId, timestamp, snapshotId
            │                     )
            │                     │
            │                     │ Update Collection 1:
            │                     │ findByIdAndUpdate(fundId, {
            │                     │   $push: {
            │                     │     schemeMonthTrackList: {
            │                     │       timestamp: ISODate("2025-10-01"),
            │                     │       mfDataId: ObjectId(snapshotId)
            │                     │     }
            │                     │   }
            │                     │ })
            │                     │
            │                     ▼
            │                     Collection 1 now looks like:
            │                     {
            │                       _id: ObjectId("..."),
            │                       fund_name: "Axis Bluechip Fund",
            │                       schemeMonthTrackList: [
            │                         {
            │                           timestamp: ISODate("2025-09-01"),
            │                           mfDataId: ObjectId("abc123")
            │                         },
            │                         {
            │                           timestamp: ISODate("2025-10-01"),
            │                           mfDataId: ObjectId("def456") ← NEW!
            │                         }
            │                       ]
            │                     }
            │
            ▼
5. RESULTS & LOGGING
   │
   └──> Return: IngestionResult {
        success: true,
        fundsProcessed: 487,
        fundsAdded: 487,
        fundsUpdated: 0,
        errors: [],
        timestamp: ISODate("2025-10-01")
      }
      │
      ├─> Log success/failure
      ├─> Send alert if errors > threshold
      └─> Update monitoring dashboard
```

---

## 🎯 Key Differences: Test vs Production

| Aspect | Test (`test-data-ingestion.ts`) | Production (Real Flow) |
|--------|--------------------------------|------------------------|
| **Trigger** | Manual: `npm run test:ingestion` | Automatic: Cron job (1st of month, 2 AM IST) |
| **Data Source** | Hardcoded array in script | Morningstar API (HTTPS request) |
| **Data Volume** | 4 sample funds | 500-1000+ real funds |
| **Frequency** | On-demand | Monthly (scheduled) |
| **Error Handling** | Console logs | Logs + Alerts + Monitoring |
| **Environment** | Development MongoDB | Production MongoDB (replicated) |
| **API Key** | Not needed | Required from `process.env.MORNINGSTAR_API_KEY` |
| **Retry Logic** | None | Exponential backoff for API failures |

---

## 📂 File Structure & Responsibilities

```
src/
├── modules/
│   ├── cron/
│   │   ├── services/
│   │   │   └── data-ingestion-cron.service.ts
│   │   │       ├─ @Cron('0 2 1 * *')  // Scheduler
│   │   │       └─ handleMonthlyIngestion()  // Orchestrator
│   │   │
│   │   └── cron.module.ts
│   │
│   ├── morningstar/
│   │   ├── services/
│   │   │   ├── morningstar-api.service.ts
│   │   │   │   ├─ fetchMonthlyData()  // HTTP GET to Morningstar
│   │   │   │   ├─ Authentication (API key)
│   │   │   │   └─ Retry logic (3 attempts)
│   │   │   │
│   │   │   └── morningstar-parser.service.ts
│   │   │       ├─ parseString(jsonData)  // Validate & normalize
│   │   │       ├─ validateFund()  // Individual validation
│   │   │       ├─ normalizeFundCategory()  // Category mapping
│   │   │       └─ Error aggregation
│   │   │
│   │   └── morningstar.module.ts
│   │
│   └── mutual-fund/
│       ├── services/
│       │   └── mutual-fund.service.ts
│       │       └─ ingestMonthlyData()  // Database orchestration
│       │
│       ├── dao/
│       │   ├── mf-scheme-track-record.dao.ts
│       │   │   ├─ upsert()  // Create/update master record
│       │   │   └─ addMonthlyReference()  // Link snapshot
│       │   │
│       │   └── mf-scheme-data-monthwise.dao.ts
│       │       ├─ create()  // Insert monthly snapshot
│       │       ├─ update()  // Update if re-ingestion
│       │       └─ findByFundAndTimestamp()  // Check existence
│       │
│       └── mutual-fund.module.ts
│
├── utils/
│   └── category-mapper.util.ts
│       └─ normalizeFundCategory()  // 50+ category variations
│
└── scripts/
    └── test-data-ingestion.ts  // ← TEST ONLY (not used in prod)
```

---

## 🔐 Environment Variables (Production)

```env
# Morningstar API
MORNINGSTAR_API_KEY=sk_live_abc123xyz789
MORNINGSTAR_API_URL=https://api.morningstar.com/v1
MORNINGSTAR_TIMEOUT=30000  # 30 seconds

# Database
MONGODB_URI=mongodb://user:pass@prod-cluster.mongodb.net/plutomoney_quant?retryWrites=true

# Cron Settings
CRON_TIMEZONE=Asia/Kolkata
CRON_ENABLED=true

# Alerting
ALERT_EMAIL=admin@plutomoney.com
ALERT_THRESHOLD=0.1  # Alert if >10% funds fail
```

---

## ⏰ Production Cron Schedule

```typescript
// src/modules/cron/services/data-ingestion-cron.service.ts

@Injectable()
export class DataIngestionCronService {
  private readonly logger = new Logger(DataIngestionCronService.name);

  constructor(
    private readonly morningstarApiService: MorningstarApiService,
    private readonly morningstarParserService: MorningstarParserService,
    private readonly mutualFundService: MutualFundService,
  ) {}

  /**
   * Runs: 1st of every month at 2:00 AM IST
   * Cron: 0 2 1 * * (minute hour day month weekday)
   */
  @Cron('0 2 1 * *', {
    name: 'monthly-fund-data-ingestion',
    timeZone: 'Asia/Kolkata',
  })
  async handleMonthlyIngestion() {
    this.logger.log('🚀 Starting monthly data ingestion...');

    try {
      // Step 1: Fetch from Morningstar API
      const rawJsonData = await this.morningstarApiService.fetchMonthlyData();
      
      // Step 2: Parse & Validate
      const validatedFunds = await this.morningstarParserService.parseString(
        JSON.stringify(rawJsonData)
      );

      // Step 3: Determine timestamp (last completed month)
      const timestamp = this.getLastMonthTimestamp();

      // Step 4: Ingest to database
      const result = await this.mutualFundService.ingestMonthlyData(
        validatedFunds,
        timestamp,
      );

      // Step 5: Handle results
      this.logResults(result);
      
      if (result.success) {
        this.logger.log('✅ Monthly ingestion completed successfully!');
      } else {
        this.logger.error('❌ Monthly ingestion failed!');
        await this.sendAlert(result);
      }
    } catch (error) {
      this.logger.error(`💥 Fatal error: ${error.message}`);
      await this.sendCriticalAlert(error);
    }
  }

  private getLastMonthTimestamp(): Date {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth;
  }
}
```

---

## 🌐 Morningstar API Integration

```typescript
// src/modules/morningstar/services/morningstar-api.service.ts

@Injectable()
export class MorningstarApiService {
  private readonly logger = new Logger(MorningstarApiService.name);
  private readonly httpService: HttpService;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
  ) {
    this.httpService = httpService;
    this.apiUrl = configService.get('MORNINGSTAR_API_URL');
    this.apiKey = configService.get('MORNINGSTAR_API_KEY');
  }

  /**
   * Fetch monthly fund data from Morningstar
   * Returns: Array of raw fund objects
   */
  async fetchMonthlyData(): Promise<any[]> {
    this.logger.log('📡 Fetching data from Morningstar API...');

    try {
      const response = await this.httpService.axiosRef.get(
        `${this.apiUrl}/funds/india`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'PlutoMoney/1.0',
          },
          timeout: 30000, // 30 seconds
        },
      );

      const data = response.data;

      if (!Array.isArray(data)) {
        throw new Error('Invalid API response: Expected array of funds');
      }

      this.logger.log(`✅ Fetched ${data.length} funds from Morningstar`);
      return data;

    } catch (error) {
      if (error.response) {
        // API returned error response
        this.logger.error(
          `API Error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        // No response received
        this.logger.error('Network Error: No response from Morningstar');
      } else {
        // Other errors
        this.logger.error(`Error: ${error.message}`);
      }

      throw new Error(`Failed to fetch from Morningstar: ${error.message}`);
    }
  }

  /**
   * Fetch specific fund by scheme code (for testing)
   */
  async fetchFundBySchemeCode(schemeCode: string): Promise<any> {
    const response = await this.httpService.axiosRef.get(
      `${this.apiUrl}/funds/india/${schemeCode}`,
      {
        headers: { 'X-API-Key': this.apiKey },
      },
    );

    return response.data;
  }
}
```

---

## 📊 MongoDB Collections After Production Run

### **Collection 1: mfSchemeTrackRecord** (Master Registry)
```javascript
{
  _id: ObjectId("67890abcdef"),
  fund_name: "Axis Bluechip Fund",
  amc: "Axis Mutual Fund",
  scheme_code: "112345",
  isin: "INF846K01EW2",
  status: "Active",
  plan: "Direct",
  option: "Growth",
  schemeMonthTrackList: [
    {
      timestamp: ISODate("2025-08-01T00:00:00Z"),
      mfDataId: ObjectId("abc111")
    },
    {
      timestamp: ISODate("2025-09-01T00:00:00Z"),
      mfDataId: ObjectId("abc222")
    },
    {
      timestamp: ISODate("2025-10-01T00:00:00Z"),  // ← Latest from cron
      mfDataId: ObjectId("abc333")
    }
  ],
  createdAt: ISODate("2025-01-15T10:00:00Z"),
  updatedAt: ISODate("2025-10-01T02:05:23Z")  // ← Cron updated
}
```

### **Collection 2: mfSchemeDataMonthwise** (Monthly Snapshots)
```javascript
// September snapshot
{
  _id: ObjectId("abc222"),
  timestamp: ISODate("2025-09-01T00:00:00Z"),
  fundId: ObjectId("67890abcdef"),
  fund_name: "Axis Bluechip Fund",
  fund_category: "Large Cap Equity",
  five_year_cagr_equity: 13.5,
  sharpe_ratio: 1.10,
  ...27 parameters...
  createdAt: ISODate("2025-09-01T02:03:45Z")
}

// October snapshot (NEW from cron)
{
  _id: ObjectId("abc333"),
  timestamp: ISODate("2025-10-01T00:00:00Z"),
  fundId: ObjectId("67890abcdef"),
  fund_name: "Axis Bluechip Fund",
  fund_category: "Large Cap Equity",
  five_year_cagr_equity: 13.8,  // ← Updated value
  sharpe_ratio: 1.12,  // ← Updated value
  ...27 parameters...
  createdAt: ISODate("2025-10-01T02:05:18Z")  // ← Cron created
}
```

---

## 🚨 Error Handling & Recovery

### **Scenario 1: Morningstar API Down**
```
CronService → API Call FAILED → Wait 5 min → Retry (max 3 times)
                                                      ↓
                                                   Still failing?
                                                      ↓
                                            Send Critical Alert
                                            Log to error tracking
                                            Schedule retry for next hour
```

### **Scenario 2: Partial Data (Some Funds Invalid)**
```
500 funds fetched → 487 validated → 13 failed validation
                                          ↓
                              Log each error with fund details
                              Continue with 487 valid funds
                              Alert if failure rate > 10%
```

### **Scenario 3: Database Connection Lost**
```
Ingestion in progress → MongoDB connection lost → Transaction rollback
                                                         ↓
                                                  Retry entire batch
                                                  If fails 3x → Alert
```

---

## 📈 Monitoring & Alerts

### **Success Metrics**
```typescript
{
  timestamp: "2025-10-01T02:05:30Z",
  totalFunds: 487,
  validated: 487,
  inserted: 487,
  updated: 0,
  errors: 0,
  duration: "2.3 minutes",
  status: "SUCCESS"
}
```

### **Alert Triggers**
1. **Critical**: API unreachable after 3 retries
2. **High**: >10% validation failures
3. **Medium**: Duplicate timestamp detected
4. **Low**: Minor outliers detected

---

## 🔄 Complete Monthly Cycle

```
Month 1 (September):
  Day 1, 2 AM → Cron runs → Fetch Aug data → Store in DB
  
  Database State:
  ├─ Collection 1: 487 funds
  └─ Collection 2: 487 snapshots (Aug 2025)

Month 2 (October):
  Day 1, 2 AM → Cron runs → Fetch Sep data → Store in DB
  
  Database State:
  ├─ Collection 1: 487 funds (same docs, updated trackList)
  └─ Collection 2: 974 snapshots (Aug + Sep 2025)

Month 3 (November):
  Day 1, 2 AM → Cron runs → Fetch Oct data → Store in DB
  
  Database State:
  ├─ Collection 1: 487 funds
  └─ Collection 2: 1,461 snapshots (Aug + Sep + Oct 2025)

...and so on
```

---

## ✅ Validation Layers

```
Layer 1: API Response Validation
  ├─ Is response JSON?
  ├─ Is it an array?
  └─ Does it have data?

Layer 2: Required Fields Check
  ├─ fund_name present?
  └─ fund_category present?

Layer 3: Category Normalization
  └─ "Flexi Cap Equity" → "Flexi-Cap / MultiCap"

Layer 4: DTO Validation (class-validator)
  ├─ Type checks (IsNumber, IsString)
  ├─ Range checks (@Min, @Max)
  └─ Enum checks (FUND_CATEGORIES)

Layer 5: Business Logic Validation
  ├─ Critical fields present?
  └─ Outlier detection
```

---

## 🎯 Summary

### **Test Flow** (Current)
```
Manual Trigger → Hardcoded Data → Parser → Database → Manual Verification
```

### **Production Flow** (Real)
```
Cron Scheduler → Morningstar API → Parser → Validation → 
Normalization → Database → Logging → Monitoring → Alerts
```

### **Key Production Components Not in Test**
1. ✅ Cron scheduling (`@nestjs/schedule`)
2. ✅ HTTP API calls (`@nestjs/axios`)
3. ✅ Retry logic (exponential backoff)
4. ✅ Error aggregation & alerts
5. ✅ Environment-based configuration
6. ✅ Production logging (structured logs)
7. ✅ Monitoring dashboard integration
8. ✅ Transaction management
9. ✅ Rate limiting (API throttling)
10. ✅ Data archival (old snapshots)

---

**Your test script simulates steps 2-4 of the production flow, which is perfect for development and validation!** 🚀

