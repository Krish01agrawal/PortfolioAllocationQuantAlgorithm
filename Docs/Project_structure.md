# PlutoMoney Quant - Project Structure

## 📂 Directory Layout (NestJS)

```
PlutoMoneyQuant/
│
├── .cursor/                          # Cursor AI context rules
│   └── rules/                        # Context engineering configs
│       ├── scoring_context.mdc       # Scoring engine knowledge
│       ├── schema_context.mdc        # Database schema knowledge
│       └── allocation_context.mdc    # Allocation matrix knowledge
│
├── .claude/                          # Claude AI conversation history
│
├── Docs/                             # Product documentation
│   ├── Project_structure.md          # This file
│   ├── Implementation.md             # Step-by-step implementation guide
│   ├── Bug_tracking.md               # Known issues & fixes
│   └── UI_UX_doc.md                  # Frontend design system
│
├── generate.mdc                      # Code generation guidelines (NestJS)
├── workflow.mdc                      # Git workflow & conventions
├── PRD.md                            # Product Requirements Document
│
├── src/                              # Source code (NestJS)
│   ├── config/                       # Configuration module
│   │   ├── config.module.ts          # ConfigModule setup
│   │   ├── database.config.ts        # MongoDB connection config
│   │   └── json/                     # JSON configuration files
│   │       ├── allocation-matrix.json    # Risk × SIP → Allocation %
│   │       ├── directionality.json       # Parameter direction config
│   │       └── weightage.json            # Risk profile weightage config
│   │
│   ├── schemas/                      # Mongoose schemas
│   │   ├── mf-scheme-track-record.schema.ts
│   │   ├── mf-scheme-data-monthwise.schema.ts
│   │   ├── category-score.schema.ts
│   │   └── mf-scores.schema.ts
│   │
│   ├── data-ingestion/               # Data ingestion module
│   │   ├── data-ingestion.module.ts
│   │   ├── data-ingestion.service.ts
│   │   ├── morningstar-parser.service.ts
│   │   └── dto/
│   │       └── morningstar-fund.dto.ts   # DTO with validation
│   │
│   ├── scoring-engine/               # Scoring engine module
│   │   ├── scoring-engine.module.ts
│   │   ├── scoring-engine.service.ts
│   │   ├── z-score-calculator.service.ts
│   │   ├── group-scorer.service.ts
│   │   ├── composite-scorer.service.ts
│   │   └── ranker.service.ts
│   │
│   ├── portfolio-construction/       # Portfolio construction module
│   │   ├── portfolio-construction.module.ts
│   │   ├── portfolio-construction.service.ts
│   │   ├── allocation-engine.service.ts
│   │   ├── fund-selector.service.ts
│   │   ├── constraints.service.ts
│   │   └── dto/
│   │       ├── recommendation-request.dto.ts
│   │       └── portfolio-response.dto.ts
│   │
│   ├── bse-integration/              # BSE Star MFD API module
│   │   ├── bse-integration.module.ts
│   │   ├── bse-client.service.ts
│   │   ├── trade-generator.service.ts
│   │   └── dto/
│   │       └── bse-sip-registration.dto.ts
│   │
│   ├── rebalancing/                  # Rebalancing module
│   │   ├── rebalancing.module.ts
│   │   ├── rebalancing.service.ts
│   │   └── drift-detector.service.ts
│   │
│   ├── recommendation/               # Recommendation controller
│   │   └── recommendation.controller.ts
│   │
│   ├── portfolio/                    # Portfolio controller
│   │   └── portfolio.controller.ts
│   │
│   ├── common/                       # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── utils/
│   │       ├── logger.util.ts
│   │       ├── date.util.ts
│   │       └── explanation-generator.util.ts
│   │
│   ├── app.module.ts                 # Root module
│   └── main.ts                       # Application entry point
│
├── scripts/                          # Automation scripts
│   ├── monthly-ingestion.ts          # Cron: Morningstar data fetch
│   ├── monthly-scoring.ts            # Cron: Run scoring engine
│   └── db-migration.ts               # Database schema updates
│
├── test/                             # Unit & integration tests (Jest)
│   ├── unit/
│   │   ├── z-score-calculator.service.spec.ts
│   │   ├── group-scorer.service.spec.ts
│   │   └── allocation-engine.service.spec.ts
│   ├── e2e/
│   │   ├── recommendation.e2e-spec.ts
│   │   └── portfolio.e2e-spec.ts
│   └── fixtures/
│       ├── sample-morningstar-data.json
│       └── sample-allocation-matrix.json
│
├── package.json                      # npm dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── nest-cli.json                     # NestJS CLI configuration
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
└── README.md                         # Quick start guide
```

---

## 🗄️ Database Structure (MongoDB)

### **Database Name**: `plutomoney_quant`

### **Collections Overview**

| Collection Name | Purpose | Growth Rate | Indexes |
|----------------|---------|-------------|---------|
| `mf_scheme_track_record` | Fund master list | Slow (new funds only) | `fund_name`, `scheme_code` |
| `mf_scheme_data_monthwise` | Raw monthly data | 1,800 docs/month | `timestamp`, `fundId`, `fund_category` |
| `category_score` | Category master list | Static (12 categories) | `category_name` |
| `mf_scores` | Computed scores | 12 docs/month | `timestamp`, `category_name`, `mf_dec_scores.rank` |
| `user_portfolios` | User holdings | Per user | `user_id`, `created_at` |
| `rebalancing_logs` | Monthly changes | Per user/month | `user_id`, `timestamp` |

---

## 🔧 Technology Stack

### **Backend**
- **Language**: TypeScript 5.0+
- **Framework**: NestJS 10+ (modular, scalable architecture)
- **Database**: MongoDB 7.0+ (Atlas recommended)
- **ODM**: Mongoose 8+ (schema validation, middleware)
- **Scheduler**: @nestjs/schedule (monthly cron jobs)

### **Data Processing**
- **simple-statistics**: Statistical calculations (mean, stddev, Z-scores)
- **lodash**: Utility functions for data manipulation

### **Validation & Transformation**
- **class-validator**: DTO validation with decorators
- **class-transformer**: Plain object to class transformation
- **@nestjs/swagger**: Auto-generated API documentation

### **API Integration**
- **@nestjs/axios**: HTTP client wrapper for BSE API
- **axios**: Promise-based HTTP client

### **DevOps**
- **Logging**: Built-in NestJS Logger (contextual logging)
- **Monitoring**: Prometheus + Grafana (optional)
- **Testing**: Jest + @nestjs/testing
- **CI/CD**: GitHub Actions (auto-deploy to production)

### **Frontend** (Future)
- **Framework**: Next.js 14 (React Server Components)
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand
- **Charts**: Recharts (portfolio performance visualization)

---

## 🔗 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONTHLY DATA INGESTION                       │
│                         (Day 1)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   Morningstar JSON (~1,800 schemes)     │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │      morningstar_parser.py              │
        │   • Validate schema                     │
        │   • Handle nulls/outliers               │
        │   • Extract fund metadata               │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │         data_loader.py                  │
        │   • Upsert Collection 1 (if new fund)   │
        │   • Insert Collection 2 (new snapshot)  │
        │   • Update schemeMonthTrackList refs    │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SCORING ENGINE                                │
│                         (Day 1-2)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   z_score_calculator.py                 │
        │   FOR EACH category:                    │
        │     1. Fetch all funds in category      │
        │     2. Apply directionality             │
        │     3. Calc category mean/stddev        │
        │     4. Compute Z-scores                 │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   group_scorer.py                       │
        │   FOR EACH fund:                        │
        │     1. Group params into 8 groups       │
        │     2. Average Z-scores per group       │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   composite_scorer.py                   │
        │   FOR EACH risk_profile:                │
        │     1. Apply profile weights            │
        │     2. Sum weighted group scores        │
        │     3. Store composite_score            │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   ranker.py                             │
        │   FOR EACH category:                    │
        │     1. Sort by composite_score DESC     │
        │     2. Assign rank (1, 2, 3...)         │
        │     3. Insert into Collection 4         │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               PORTFOLIO CONSTRUCTION                             │
│                   (On-Demand)                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   USER INPUT                            │
        │   • risk_profile: "Balanced Achiever"   │
        │   • monthly_sip: 25000                  │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   allocation_engine.py                  │
        │   • Lookup allocation_matrix.json       │
        │   • Map: (risk, SIP bucket) → %s        │
        │   • Result: Large Cap 20%, Mid Cap 15%  │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   fund_selector.py                      │
        │   FOR EACH category:                    │
        │     • Fetch top-N from Collection 4     │
        │     • Split category amount equally     │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   constraints.py                        │
        │   • Check SIP minimums                  │
        │   • Enforce AMC diversification         │
        │   • Validate riskometer alignment       │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   PORTFOLIO OUTPUT                      │
        │   [                                     │
        │     {fund: "Axis Bluechip", sip: 5000}, │
        │     {fund: "HDFC Mid Cap", sip: 3750},  │
        │     ...                                 │
        │   ]                                     │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BSE STAR MFD INTEGRATION                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   trade_generator.py                    │
        │   • Map fund names → scheme codes       │
        │   • Format BSE API payload              │
        │   • Add user KYC details                │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   bse_client.py                         │
        │   • POST /SIPOrderEntry                 │
        │   • Receive order confirmation          │
        │   • Store transaction ID                │
        └─────────────────────────────────────────┘
```

---

## 📊 Collection Schema Details

### **Collection 1: `mf_scheme_track_record`**

```python
{
    "_id": ObjectId,
    "fund_name": str,                  # "Axis Bluechip Fund"
    "amc": str,                        # "Axis Mutual Fund"
    "scheme_code": str,                # "INF200K01VW5" (BSE/AMFI code)
    "isin": str,                       # "INF200K01VW5"
    "plan": str,                       # "Regular" or "Direct"
    "option": str,                     # "Growth" or "IDCW"
    "inception_date": datetime,        # Fund launch date
    "status": str,                     # "Active" | "Closed" | "Merged"
    "schemeMonthTrackList": [
        {
            "timestamp": datetime,     # ISODate("2025-09-01")
            "mfDataId": ObjectId       # Reference to Collection 2
        }
    ],
    "created_at": datetime,
    "updated_at": datetime
}
```

**Indexes**:
```javascript
db.mf_scheme_track_record.createIndex({ "fund_name": 1 })
db.mf_scheme_track_record.createIndex({ "scheme_code": 1 }, { unique: true })
db.mf_scheme_track_record.createIndex({ "amc": 1 })
```

---

### **Collection 2: `mf_scheme_data_monthwise`**

```python
{
    "_id": ObjectId,
    "timestamp": datetime,             # ISODate("2025-09-01")
    "fundId": ObjectId,                # Reference to Collection 1
    "fund_name": str,
    "fund_category": str,              # "Large Cap Equity"
    
    # A. Quantitative Parameters (17 metrics)
    "five_year_cagr_equity": float,
    "five_year_cagr_debt_hybrid": float,
    "three_year_rolling_consistency": float,
    "sharpe_ratio": float,
    "sortino_ratio": float,
    "alpha": float,
    "beta": float,
    "std_dev_equity": float,
    "std_dev_debt_hybrid": float,
    "max_drawdown": float,
    "recovery_period": int,
    "downside_capture_ratio": float,
    "expense_ratio_equity": float,
    "expense_ratio_debt": float,
    "aum_equity": float,
    "aum_debt": float,
    "liquidity_risk": int,             # 1-5 scale
    "portfolio_turnover_ratio": float,
    "concentration_sector_fit": int,   # 1-5 scale
    "style_fit": int,                  # 1-5 scale
    
    # B. Qualitative Parameters (5 metrics)
    "fund_house_reputation": int,      # 1-5 scale
    "fund_manager_tenure": float,      # Years
    "fund_manager_track_record": float,# 1-5 scale
    "amc_risk_management": float,      # 1-5 scale
    "esg_governance": float,           # 1-5 scale
    
    # C. Forward-Looking Parameters (5 metrics)
    "benchmark_consistency": float,    # 1-5 scale
    "peer_comparison": float,          # 1-5 scale
    "tax_efficiency": float,           # 1-5 scale
    "fund_innovation": float,          # 1-5 scale
    "forward_risk_mitigation": float,  # 1-5 scale
    
    "created_at": datetime
}
```

**Indexes**:
```javascript
db.mf_scheme_data_monthwise.createIndex({ "timestamp": -1, "fundId": 1 })
db.mf_scheme_data_monthwise.createIndex({ "fund_category": 1, "timestamp": -1 })
db.mf_scheme_data_monthwise.createIndex({ "fundId": 1 })
```

---

### **Collection 3: `category_score`**

```python
{
    "_id": ObjectId,
    "category_name": str,              # "Large Cap Equity"
    "description": str,                # "Large-cap actively managed equity funds"
    "category_code": str,              # "LARGE_CAP" (enum-friendly)
    "asset_class": str,                # "Equity" | "Debt" | "Hybrid"
    "mf_scores_plan_list": [
        {
            "timestamp": datetime,     # ISODate("2025-09-01")
            "MF_Scores_id": ObjectId   # Reference to Collection 4
        }
    ],
    "created_at": datetime,
    "updated_at": datetime
}
```

**Indexes**:
```javascript
db.category_score.createIndex({ "category_name": 1 }, { unique: true })
db.category_score.createIndex({ "category_code": 1 })
```

---

### **Collection 4: `mf_scores`**

```python
{
    "_id": ObjectId,
    "timestamp": datetime,             # ISODate("2025-09-01")
    "category_name": str,              # "Large Cap Equity"
    "mutual_fund_category_id": ObjectId, # Reference to Collection 3
    "risk_profile": str,               # "Aggressive Explorer" (scores vary per profile)
    
    "mf_dec_scores": [
        {
            "fund_name": str,          # "HDFC Top 100"
            "fund_id": ObjectId,       # Reference to Collection 1
            "composite_score": float,  # 1.56
            "rank": int,               # 1, 2, 3...
            
            # Breakdown of 8 group scores
            "group_scores": {
                "returns_growth": float,
                "risk_adjusted": float,
                "volatility_drawdown": float,
                "expense_aum": float,
                "downside_liquidity": float,
                "fund_house_mgr": float,
                "discipline_turnover": float,
                "esg_forward": float
            },
            
            # Individual Z-scores (for transparency)
            "z_scores": {
                "five_year_cagr_equity": float,
                "sharpe_ratio": float,
                # ... all 27 parameters
            }
        }
    ],
    "created_at": datetime
}
```

**Indexes**:
```javascript
db.mf_scores.createIndex({ "timestamp": -1, "category_name": 1, "risk_profile": 1 })
db.mf_scores.createIndex({ "mf_dec_scores.rank": 1 })
db.mf_scores.createIndex({ "mf_dec_scores.fund_id": 1 })
```

---

## 🚦 Environment Variables (`.env`)

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/plutomoney_quant
MONGODB_DATABASE=plutomoney_quant

# BSE Star MFD API
BSE_API_URL=https://bsestarmf.in/RTPService
BSE_MEMBER_CODE=12345
BSE_USER_ID=youruser
BSE_PASSWORD=yourpass
BSE_ENCRYPTION_KEY=abcd1234

# Application
ENV=production  # development | staging | production
LOG_LEVEL=INFO
SECRET_KEY=your-jwt-secret-key
API_RATE_LIMIT=100  # requests per minute

# Scheduler
MONTHLY_INGESTION_DAY=1  # Day of month to fetch data
MONTHLY_INGESTION_HOUR=6  # 6 AM IST

# Optional: External Services
SENTRY_DSN=https://...  # Error tracking
SLACK_WEBHOOK_URL=https://...  # Alerts
```

---

## 🧪 Testing Strategy

### **Unit Tests** (80% coverage target)
- `test_z_score_calculator.py`: Test Z-score math with known inputs/outputs
- `test_group_scorer.py`: Validate group averaging logic
- `test_allocation_engine.py`: Test allocation matrix lookups

### **Integration Tests**
- `test_end_to_end_flow.py`: Morningstar JSON → Portfolio output
- `test_bse_integration.py`: Mock BSE API responses

### **Fixtures**
- `sample_morningstar_data.json`: 10-fund sample with all parameters
- `sample_allocation_matrix.json`: All risk profiles × SIP buckets

---

## 📦 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION                              │
│                                                             │
│  ┌────────────────┐       ┌────────────────┐              │
│  │   FastAPI App  │──────▶│  MongoDB Atlas │              │
│  │   (Gunicorn)   │       │  (Replica Set) │              │
│  └────────────────┘       └────────────────┘              │
│         ↑                                                   │
│         │                                                   │
│  ┌────────────────┐                                        │
│  │  APScheduler   │  (Monthly cron jobs)                   │
│  │  (Background)  │                                        │
│  └────────────────┘                                        │
│         ↑                                                   │
│         │                                                   │
│  ┌────────────────┐                                        │
│  │   BSE Star MFD │  (External API)                        │
│  │   API Client   │                                        │
│  └────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

**Next**: See `Implementation.md` for step-by-step build guide.

