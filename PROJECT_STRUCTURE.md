# 📁 Project Structure - PlutoMoney Quant

## **Clean, Minimal, Production-Ready**

Only essential files for the system to function.

---

## **Root Directory**

```
PlutoMoneyQuant/
├── README.md                    # Comprehensive guide
├── PRD.md                       # Product requirements
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── nest-cli.json                # NestJS CLI config
├── sample.env                   # Environment template
├── Docs/                        # Technical documentation
│   ├── Implementation.md        # Step-by-step implementation
│   └── Project_structure.md     # Architecture details
├── files/                       # Data files
│   ├── Expanded_Dummy_Fund_Data.xlsx
│   └── Portfolio Allocation Table.xlsx
├── .cursor/rules/               # AI context (for development)
│   ├── scoring_context.mdc
│   ├── schema_context.mdc
│   └── allocation_context.mdc
└── src/                         # Source code
```

---

## **Source Code Structure**

```
src/
├── app/                                      # Application root
│   └── app.module.ts                         # Main module (imports all features)
│
├── config/                                   # Configuration
│   ├── app.config.ts                         # App config factory
│   └── config.module.ts                      # Global config module
│
├── database/                                 # Database layer
│   ├── database.config.ts                    # MongoDB connection settings
│   └── database.module.ts                    # Database module
│
├── enums/                                    # Global type definitions
│   ├── fund-category.enum.ts                 # 12 fund categories
│   ├── fund-status.enum.ts                   # Active, Closed, etc.
│   └── index.ts                              # Barrel export
│
├── utils/                                    # Utility functions
│   └── date.util.ts                          # Date helpers
│
├── modules/                                  # 🎯 FEATURE MODULES
│   │
│   ├── mutual-fund/                          # Collections 1 & 2
│   │   ├── schemas/                          # MongoDB schemas
│   │   │   ├── mf-scheme-track-record.schema.ts    (Collection 1)
│   │   │   └── mf-scheme-data-monthwise.schema.ts  (Collection 2)
│   │   ├── dao/                              # Data Access Objects
│   │   │   ├── mf-scheme-track-record.dao.ts
│   │   │   └── mf-scheme-data-monthwise.dao.ts
│   │   ├── dtos/                             # Validation
│   │   │   └── fund-data.dto.ts              # 27 parameters validation
│   │   ├── services/                         # Business logic
│   │   │   └── mutual-fund.service.ts        # Ingestion workflow
│   │   └── mutual-fund.module.ts             # Module definition
│   │
│   ├── morningstar/                          # Data source
│   │   ├── services/
│   │   │   ├── morningstar-parser.service.ts # JSON parser & validator
│   │   │   └── morningstar-api.service.ts    # API client (future)
│   │   └── morningstar.module.ts
│   │
│   └── cron/                                 # Scheduled tasks
│       ├── services/
│       │   └── data-ingestion-cron.service.ts # Monthly cron (1st, 2 AM)
│       └── cron.module.ts
│
├── scripts/                                  # Utility scripts
│   └── test-data-ingestion.ts                # Test script
│
└── main.ts                                   # Application entry point
```

---

## **File Count**

### **Total: 23 TypeScript Files**

#### **Core (6 files)**
- `main.ts`
- `app/app.module.ts`
- `config/app.config.ts`, `config/config.module.ts`
- `database/database.config.ts`, `database/database.module.ts`

#### **Enums (3 files)**
- `enums/fund-category.enum.ts`
- `enums/fund-status.enum.ts`
- `enums/index.ts`

#### **Utils (1 file)**
- `utils/date.util.ts`

#### **Mutual Fund Module (7 files)**
- Schemas (2): Track record, Monthwise data
- DAOs (2): Track record DAO, Monthwise DAO
- DTOs (1): Fund data validation
- Services (1): Mutual fund service
- Module (1): mutual-fund.module.ts

#### **Morningstar Module (3 files)**
- Services (2): Parser, API client
- Module (1): morningstar.module.ts

#### **Cron Module (2 files)**
- Services (1): Data ingestion cron
- Module (1): cron.module.ts

#### **Scripts (1 file)**
- `test-data-ingestion.ts`

---

## **Module Responsibilities**

### **1. MutualFundModule**
**Purpose:** Manage Collections 1 & 2  
**Exports:**
- `MutualFundService` - Ingestion workflow, business logic
- `MfSchemeTrackRecordDao` - CRUD for Collection 1
- `MfSchemeDataMonthwiseDao` - CRUD for Collection 2

### **2. MorningstarModule**
**Purpose:** Data source integration  
**Exports:**
- `MorningstarParserService` - Parse & validate JSON
- `MorningstarApiService` - API client (placeholder)

### **3. CronModule**
**Purpose:** Scheduled tasks  
**Exports:**
- `DataIngestionCronService` - Monthly ingestion (1st, 2 AM IST)

---

## **Dependencies Between Modules**

```
AppModule (root)
├── ConfigModule (global)
├── DatabaseModule
│   └── requires: ConfigModule
├── MutualFundModule
│   └── requires: DatabaseModule
├── MorningstarModule
│   └── no dependencies
└── CronModule
    └── requires: MutualFundModule, MorningstarModule
```

---

## **Design Patterns**

### **1. Module Pattern**
Each feature is a self-contained NestJS module.

### **2. DAO Pattern (Repository)**
Data access abstracted into DAOs.
```typescript
// Service uses DAO
const fund = await this.fundDao.findByFundName('Axis');

// NOT direct model access
```

### **3. Service Layer**
Business logic in services.
```typescript
// MutualFundService.ingestMonthlyData()
// Orchestrates: Upsert master → Insert snapshot → Update references
```

### **4. Dependency Injection**
All dependencies injected via constructor.

### **5. SOLID Principles**
- **S**: Each class has one job
- **O**: Easy to extend without modification
- **L**: Services implement interfaces
- **I**: Small, focused interfaces
- **D**: Depend on abstractions (DAOs)

---

## **Why This Structure?**

### **✅ Minimal**
- Only essential files
- No redundant documentation
- No empty folders

### **✅ Clear**
- Easy to navigate
- Obvious where to add features
- Clear module boundaries

### **✅ Scalable**
- Add new modules without touching existing code
- Example: Add `ScoringEngineModule` → Just import in AppModule

### **✅ Testable**
- DAOs can be mocked
- Services isolated
- Clear dependencies

### **✅ Production-Ready**
- Follows NestJS best practices
- Enterprise-grade architecture
- Well-documented

---

## **Adding New Features**

### **Example: Scoring Engine Module**

**Step 1:** Create structure
```bash
mkdir -p src/modules/scoring-engine/{schemas,dao,services}
```

**Step 2:** Add files
```
src/modules/scoring-engine/
├── schemas/
│   ├── category-score.schema.ts       # Collection 3
│   └── mf-scores.schema.ts            # Collection 4
├── dao/
│   ├── category-score.dao.ts
│   └── mf-scores.dao.ts
├── services/
│   ├── z-score-calculator.service.ts
│   └── composite-score-calculator.service.ts
└── scoring-engine.module.ts
```

**Step 3:** Import in AppModule
```typescript
@Module({
  imports: [
    // ...
    ScoringEngineModule,
  ],
})
export class AppModule {}
```

---

## **Key Files Explained**

### **`main.ts`**
Application entry point. Bootstraps NestJS.

### **`app.module.ts`**
Root module. Imports all feature modules.

### **`config.module.ts`**
Global configuration. Environment variables.

### **`database.module.ts`**
MongoDB connection setup.

### **`mutual-fund.module.ts`**
Feature module for Collections 1 & 2.

### **`morningstar.module.ts`**
Feature module for data source.

### **`cron.module.ts`**
Feature module for scheduled tasks.

---

## **Next Steps**

### **Phase 2: Scoring Engine**
Add `src/modules/scoring-engine/` with:
- Collections 3 & 4 schemas
- Z-score calculation
- Group score aggregation
- Composite score calculation

### **Phase 3: Allocation**
Add `src/modules/allocation/` with:
- Allocation matrix loader
- SIP bucket determination
- Fund selection logic
- Constraint application

### **Phase 4: BSE Integration**
Add `src/modules/bse-integration/` with:
- BSE API client
- Trade submission
- Order tracking

---

**Clean, minimal, production-ready structure!** 🚀

