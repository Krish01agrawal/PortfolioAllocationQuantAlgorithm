# 🚀 PlutoMoney Quant - Portfolio Allocation Algorithm

**AI-Powered, Risk-Adjusted Mutual Fund Recommendations**

Built with NestJS + TypeScript + MongoDB

---

## **📖 Overview**

PlutoMoney Quant is a sophisticated portfolio allocation algorithm that:

1. **Scores 1,800+ mutual funds monthly** using 27 quantitative & qualitative parameters
2. **Normalizes scores within categories** using Z-score methodology
3. **Weights parameters by risk profile** (Safety Seeker to Aggressive Explorer)
4. **Constructs personalized portfolios** based on SIP amount and risk tolerance
5. **Rebalances monthly** to maintain optimal allocation

---

## **✅ Current Status**

**Phase 1: Data Ingestion** - ✅ **COMPLETE**
- REST API with 4 endpoints
- MongoDB Collections 1 & 2 operational
- Morningstar data ingestion (AS-IS format)
- Monthly cron scheduler configured
- 8 funds, 13 snapshots ingested

**Next: Phase 2 - Scoring Engine** (Collections 3 & 4, Z-scores, Risk weighting)

---

## **⚡ Quick Start**

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp sample.env .env
# Edit .env: Set MONGODB_URI=mongodb://localhost:27017/plutomoney_quant

# 3. Start MongoDB (choose one)
brew services start mongodb-community                    # macOS
docker run -d -p 27017:27017 --name mongodb mongo:latest # Docker

# 4. Start the API server
npm run start:dev
# Server runs on: http://localhost:3000

# 5. Test via REST API
curl http://localhost:3000/api/mutual-funds | python3 -m json.tool

# 6. Or test via script
npm run test:ingestion

# 7. Verify in MongoDB
mongosh plutomoney_quant --eval "db.mfSchemeTrackRecord.find().pretty()"
```

**See `QUICK_API_REFERENCE.md` for complete API documentation**

---

## **🏗️ Architecture**

### **Clean Modular Structure**

```
src/
├── app/                          # Application root
│   └── app.module.ts
│
├── modules/                      # Feature modules
│   ├── mutual-fund/              # Collections 1 & 2
│   │   ├── schemas/              # MongoDB models
│   │   ├── dao/                  # Data Access Objects (Repository pattern)
│   │   ├── dtos/                 # Validation
│   │   ├── services/             # Business logic
│   │   └── mutual-fund.module.ts
│   │
│   ├── morningstar/              # Data source integration
│   │   ├── services/
│   │   │   ├── morningstar-parser.service.ts
│   │   │   └── morningstar-api.service.ts
│   │   └── morningstar.module.ts
│   │
│   └── cron/                     # Scheduled tasks
│       ├── services/
│       │   └── data-ingestion-cron.service.ts
│       └── cron.module.ts
│
├── config/                       # Configuration
├── database/                     # Database layer
├── enums/                        # Global type definitions
├── utils/                        # Utilities
└── main.ts
```

### **Design Patterns**

- **Module Pattern:** Clear feature boundaries
- **DAO Pattern:** Repository for data access
- **Service Layer:** Business logic separation
- **Dependency Injection:** NestJS DI container
- **SOLID Principles:** All 5 applied

---

## **📊 Data Flow**

```
┌─────────────────────────────────────────────────────┐
│         MONTHLY DATA INGESTION (1st of Month)        │
└─────────────────────────────────────────────────────┘

1. TRIGGER (Cron: 1st of month, 2 AM IST)
   CronModule.DataIngestionCronService
   ↓

2. FETCH DATA
   MorningstarModule.MorningstarApiService (future)
   OR Read JSON file (current)
   ↓

3. PARSE & VALIDATE
   MorningstarModule.MorningstarParserService
   - Validate 27 parameters
   - Check required fields
   - Detect outliers
   → Returns: FundDataDto[]
   ↓

4. INGEST TO DATABASE
   MutualFundModule.MutualFundService
   - Upsert master record (Collection 1)
   - Insert/update snapshot (Collection 2)
   - Update reference list
   ↓

5. RESULT
   IngestionResult {
     success, fundsProcessed, fundsAdded, fundsUpdated, errors
   }
```

---

## **🗄️ Database Collections**

### **Collection 1: mfSchemeTrackRecord**
**Purpose:** Master registry of all mutual funds

```typescript
{
  _id: ObjectId(),
  fundName: "Axis Bluechip Fund",
  amc: "Axis Mutual Fund",
  schemeCode: "AXIS001",
  status: "Active",
  schemeMonthTrackList: [
    {
      timestamp: ISODate("2025-10-01"),
      mfDataId: ObjectId() // Reference to Collection 2
    }
  ]
}
```

### **Collection 2: mfSchemeDataMonthwise**
**Purpose:** Monthly snapshots with 27 parameters

```typescript
{
  _id: ObjectId(),
  timestamp: ISODate("2025-10-01"),
  fundId: ObjectId(), // Reference to Collection 1
  fundName: "Axis Bluechip Fund",
  fundCategory: "Large Cap Equity",
  
  // 17 Quantitative Parameters
  fiveYearCagrEquity: 13.8,
  sharpeRatio: 1.12,
  alpha: 2.3,
  beta: 0.88,
  maxDrawdown: -11.2,
  expenseRatioEquity: 0.9,
  aumEquity: 18000,
  // ... 10 more
  
  // 5 Qualitative Parameters
  fundHouseReputation: 5,
  fundManagerTenure: 8,
  fundManagerTrackRecord: 4.7,
  amcRiskManagement: 4.5,
  esgGovernance: 3.9,
  
  // 5 Forward-Looking Parameters
  benchmarkConsistency: 4.6,
  peerComparison: 4.3,
  taxEfficiency: 3.8,
  fundInnovation: 4.2,
  forwardRiskMitigation: 4.5
}
```

---

## **🧪 Testing**

### **Test Scenarios**

#### **Scenario 1: Fresh Ingestion**
```bash
# Clear database
mongosh
use plutomoney_quant
db.dropDatabase()

# Run test
npm run test:ingestion
```
**Expected:** `fundsAdded = 3, fundsUpdated = 0`

#### **Scenario 2: Re-Ingestion (Same Month)**
```bash
npm run test:ingestion
```
**Expected:** `fundsAdded = 0, fundsUpdated = 3`

#### **Scenario 3: New Month**
Edit `src/scripts/test-data-ingestion.ts` line 165:
```typescript
const timestamp = new Date('2025-11-01T00:00:00Z'); // November
```
Run: `npm run test:ingestion`

**Expected:** New snapshots added, track list grows

### **Troubleshooting**

**Error: Cannot connect to MongoDB**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

**Error: Module not found**
```bash
npm install
```

---

## **🔧 Development**

### **Available Commands**

```bash
npm run start:dev        # Development mode with watch
npm run start:prod       # Production mode
npm run build            # Build for production
npm run test:ingestion   # Test data ingestion
npm run lint             # Lint code
npm run format           # Format code
```

### **Adding New Modules**

Example: Add Scoring Engine Module

**Step 1:** Create structure
```bash
mkdir -p src/modules/scoring-engine/{schemas,dao,services}
```

**Step 2:** Create service
```typescript
// src/modules/scoring-engine/services/z-score-calculator.service.ts
@Injectable()
export class ZScoreCalculatorService {
  async calculateForCategory(category: string, timestamp: Date) {
    // Implementation
  }
}
```

**Step 3:** Create module
```typescript
// src/modules/scoring-engine/scoring-engine.module.ts
@Module({
  imports: [MutualFundModule],
  providers: [ZScoreCalculatorService],
  exports: [ZScoreCalculatorService],
})
export class ScoringEngineModule {}
```

**Step 4:** Import in AppModule
```typescript
// src/app/app.module.ts
@Module({
  imports: [
    // ...
    ScoringEngineModule,
  ],
})
export class AppModule {}
```

---

## **📚 Key Concepts**

### **1. DAO Pattern (Repository)**
Data access is separated from business logic.

```typescript
// ✅ Good - Use DAO
const fund = await this.fundDao.findByFundName('Axis');

// ❌ Bad - Direct model access
const fund = await this.fundModel.findOne({ fundName: 'Axis' });
```

### **2. Service Layer**
Business logic in services, not controllers or DAOs.

```typescript
// MutualFundService orchestrates workflow
async ingestMonthlyData(funds, timestamp) {
  // 1. Upsert master
  // 2. Insert/update snapshot
  // 3. Update references
}
```

### **3. Dependency Injection**
All dependencies injected via constructor.

```typescript
constructor(
  private readonly trackRecordDao: MfSchemeTrackRecordDao,
  private readonly monthwiseDao: MfSchemeDataMonthwiseDao,
) {}
```

### **4. Cron Jobs**
Scheduled tasks for monthly ingestion.

```typescript
@Cron('0 2 1 * *') // 1st of month, 2 AM
async handleMonthlyIngestion() {
  // Fetch, parse, ingest
}
```

---

## **🔮 Roadmap**

### **Phase 1: Data Ingestion** ✅ Complete
- Collections 1 & 2
- Morningstar parser
- Monthly cron job

### **Phase 2: Scoring Engine** 🔜 Next
- Z-score calculation (category-wise)
- Group score aggregation (8 parameter groups)
- Composite score (risk profile weighted)
- Collections 3 & 4

### **Phase 3: Portfolio Allocation** 🔜
- Allocation matrix loader
- SIP bucket determination
- Fund selection (top-N by composite score)
- Constraint application (SIP mins, AMC diversity)

### **Phase 4: BSE Integration** 🔜
- BSE Star MFD API client
- SIP registration
- Order tracking

---

## **📦 Tech Stack**

- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **Database:** MongoDB with Mongoose
- **Validation:** class-validator, class-transformer
- **Scheduling:** @nestjs/schedule
- **Statistics:** simple-statistics

---

## **🌐 Environment Variables**

```env
# Node Environment
NODE_ENV=development

# Server
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/plutomoney_quant

# Morningstar API (future)
# MORNINGSTAR_API_URL=https://api.morningstar.com
# MORNINGSTAR_API_KEY=your_key
```

---

## **📡 REST API Endpoints**

### **POST /api/mutual-funds/ingest** - Manual Data Ingestion
Ingest fund data directly (perfect for testing before Morningstar is configured)

```bash
curl -X POST http://localhost:3000/api/mutual-funds/ingest \
  -H "Content-Type: application/json" \
  -d @test-api-payload.json | python3 -m json.tool
```

### **GET /api/mutual-funds** - Get All Funds
```bash
# All funds
curl http://localhost:3000/api/mutual-funds | python3 -m json.tool

# Filter by category
curl "http://localhost:3000/api/mutual-funds?category=Large%20Cap%20Equity" | python3 -m json.tool
```

### **GET /api/mutual-funds/:id** - Get Specific Fund
```bash
curl http://localhost:3000/api/mutual-funds/LC001 | python3 -m json.tool
```

### **GET /api/mutual-funds/:id/history** - Get Fund History
```bash
curl http://localhost:3000/api/mutual-funds/LC001/history | python3 -m json.tool
```

**Complete API documentation:** `QUICK_API_REFERENCE.md`

---

## **📖 Documentation**

### **Getting Started**
- **`README.md`** (this file) - Overview & Quick Start
- **`QUICK_API_REFERENCE.md`** - API endpoints reference
- **`PHASE_1_COMPLETE.md`** - Phase 1 implementation summary

### **Technical Documentation**
- **`PRD.md`** - Product Requirements Document
- **`Docs/Implementation.md`** - Step-by-step implementation guide
- **`Docs/FINAL_ARCHITECTURE.md`** - System architecture  
- **`Docs/DATA_FLOW_PRODUCTION.md`** - Production data flow
- **`Docs/MORNINGSTAR_DATA_ANALYSIS.md`** - Data format analysis

### **AI Context**
- **`.cursor/rules/*.mdc`** - AI context for Phase 2 development
  - `scoring_context.mdc` - Scoring engine logic
  - `schema_context.mdc` - Database schema definitions
  - `allocation_context.mdc` - Portfolio allocation logic

---

## **🎯 Next Steps (Phase 2)**

### **Immediate Tasks:**
1. Build Collection 3: CategoryScore schema
2. Build Collection 4: MF_Scores schema
3. Implement Z-Score calculator service
4. Build qualitative converter (text → numbers in-memory)
5. Implement composite scorer with risk weighting
6. Create scoring cron job (runs after data ingestion)

### **Future Phases:**
- **Phase 3:** Portfolio construction & allocation
- **Phase 4:** API endpoints for recommendations  
- **Phase 5:** Frontend integration (see `Docs/UI_UX_doc.md`)

---

## **🤝 Contributing**

1. Follow NestJS best practices
2. Use DAO pattern for data access
3. Write unit tests for services
4. Document complex logic
5. Follow SOLID principles

---

## **📄 License**

UNLICENSED - Private project

---

## **👥 Team**

PlutoMoney Team

---

**Built with ❤️ for intelligent portfolio management**
