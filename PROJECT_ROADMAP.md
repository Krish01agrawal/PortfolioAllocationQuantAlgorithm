# 🗺️ PlutoMoney Quant - Project Roadmap

**Last Updated:** October 9, 2025  
**Current Phase:** Phase 1 Complete ✅ → Moving to Phase 2  

---

## 📊 Project Overview

**Goal:** Build an AI-powered, risk-adjusted mutual fund portfolio allocation algorithm

**Tech Stack:** NestJS + TypeScript + MongoDB  
**Architecture:** Modular microservices pattern with SOLID principles  
**Data Source:** Morningstar API (1,800+ mutual funds)  
**End Product:** REST API + Web Dashboard for portfolio recommendations  

---

## 🎯 Complete Phase Breakdown

### **✅ Phase 1: Data Ingestion & Foundation** - COMPLETE

**Objective:** Establish data pipeline and storage for Morningstar fund data

**Collections Built:**
- ✅ Collection 1: `mfSchemeTrackRecord` (Master fund registry)
- ✅ Collection 2: `mfSchemeDataMonthwise` (Monthly snapshots)

**Features Implemented:**
1. ✅ Morningstar API integration
   - Parser service (validates AS-IS format)
   - API service (HTTP client with retry logic)
   - Data stored in PascalCase_Underscore format (source of truth)

2. ✅ Data Ingestion Pipeline
   - Monthly cron job (1st of month, 2 AM IST)
   - Validation & error handling
   - Category normalization
   - Empty string → null handling

3. ✅ DAO Pattern Implementation
   - `MfSchemeTrackRecordDao` - Master fund operations
   - `MfSchemeDataMonthwiseDao` - Monthly snapshot operations
   - Clean separation of data access from business logic

4. ✅ REST API (4 Endpoints)
   - `POST /api/mutual-funds/ingest` - Manual data ingestion
   - `GET /api/mutual-funds` - Get all funds (with filters)
   - `GET /api/mutual-funds/:id` - Get specific fund
   - `GET /api/mutual-funds/:id/history` - Get fund history

5. ✅ Testing & Verification
   - E2E test script: `npm run test:ingestion`
   - Currently: 8 funds, 13 snapshots in database
   - All endpoints tested and working

**Key Decisions:**
- **Store AS-IS:** Morningstar data stored exactly as received (no transformation)
- **Text fields:** Qualitative values like "Tier 1", "Excellent" stored as text
- **Conversion:** Text → numbers happens IN-MEMORY during scoring (Phase 2)

**Documentation:**
- ✅ `PHASE_1_COMPLETE.md` - Complete Phase 1 summary
- ✅ `README.md` - Updated with current status
- ✅ `QUICK_API_REFERENCE.md` - API documentation
- ✅ `Docs/MORNINGSTAR_DATA_ANALYSIS.md` - Data format analysis

**Status:** ✅ **PRODUCTION READY**

---

### **🚧 Phase 2: Scoring Engine** - NEXT

**Objective:** Implement Z-score normalization and composite scoring system

**Timeline:** 2-3 weeks  
**Dependencies:** Phase 1 complete ✅

#### **Collections to Build:**

1. **Collection 3: `categoryScore`**
   ```javascript
   {
     _id: ObjectId(),
     category_name: "Large Cap Equity",
     mf_scores_plan_list: [
       {
         timestamp: ISODate("2025-10-01"),
         MF_Scores_id: ObjectId()  // References Collection 4
       }
     ],
     createdAt: ISODate(),
     updatedAt: ISODate()
   }
   ```

2. **Collection 4: `mfScores`**
   ```javascript
   {
     _id: ObjectId(),
     timestamp: ISODate("2025-10-01"),
     category_name: "Large Cap Equity",
     mutual_fund_category_id: ObjectId(),  // References Collection 3
     
     // Category-level statistics (same for all funds)
     category_stats: {
       total_funds: 50,
       parameters: {
         '5Y_CAGR': { mean: 7.8, stdev: 1.8 },
         'Sharpe_3Y': { mean: 8.2, stdev: 1.5 },
         // ... all 27 parameters
       }
     },
     
     // Fund-level data (risk-agnostic)
     funds_data: [
       {
         fund_id: ObjectId(),  // References Collection 1
         fund_name: "Nippon India Large Cap Fund",
         
         raw_values: {
           '5Y_CAGR': 18.86,
           'Sharpe_3Y': 1.22,
           'Fund_House': "Tier 1",      // Stored AS-IS
           'Manager_Record': "Excellent", // Stored AS-IS
           // ... all 27 parameters
         },
         
         points: {
           '5Y_CAGR': 10,        // ≥15% → 10 pts
           'Sharpe_3Y': 10,      // ≥1.2 → 10 pts
           'Fund_House': 10,     // "Tier 1" → 10 pts
           'Manager_Record': 10, // "Excellent" → 10 pts
           // ... all 27 parameters
         },
         
         z_scores: {
           '5Y_CAGR_zscore': 1.22,
           'Sharpe_3Y_zscore': 1.20,
           // ... normalized scores (same across all risk profiles)
         }
       }
       // ... all funds in category
     ],
     
     // ⚠️ CRITICAL: Risk-profile-specific scores and rankings
     risk_profile_scores: [
       {
         risk_profile: "Aggressive Explorer",
         weighted_scores: [
           {
             fund_id: ObjectId(),
             fund_name: "Nippon India Large Cap Fund",
             composite_score: 87.5,  // High score (returns weighted more)
             rank: 1
           },
           {
             fund_id: ObjectId(),
             fund_name: "ICICI Bluechip Fund",
             composite_score: 82.1,
             rank: 3
           }
         ]
       },
       {
         risk_profile: "Safety Seeker",
         weighted_scores: [
           {
             fund_id: ObjectId(),
             fund_name: "ICICI Bluechip Fund",  // Different top fund!
             composite_score: 82.3,  // Higher score (risk weighted more)
             rank: 1
           },
           {
             fund_id: ObjectId(),
             fund_name: "Nippon India Large Cap Fund",
             composite_score: 79.1,  // Lower score, lower rank
             rank: 3
           }
         ]
       },
       {
         risk_profile: "Balanced Achiever",
         weighted_scores: [ /* ... */ ]
       },
       {
         risk_profile: "Conservative Guardian",
         weighted_scores: [ /* ... */ ]
       }
     ],
     
     createdAt: ISODate()
   }
   ```
   
   **Why Risk Profiles Matter:**
   - Each risk profile has DIFFERENT weightages for parameters
   - Same Z-scores, but different weights → different composite scores
   - Rankings differ by risk profile (top fund for Aggressive ≠ top fund for Safety Seeker)
   - See `Docs/SCORING_ENGINE_DEEP_DIVE.md` for complete explanation

#### **Services to Build:**

1. **✅ Schemas**
   - [ ] `src/modules/scoring/schemas/category-score.schema.ts`
   - [ ] `src/modules/scoring/schemas/mf-scores.schema.ts`

2. **✅ DAOs**
   - [ ] `src/modules/scoring/dao/category-score.dao.ts`
   - [ ] `src/modules/scoring/dao/mf-scores.dao.ts`

3. **✅ Core Services** (4-Step Process)
   
   **Step 1: Points Assignment Service**
   - [ ] `src/modules/scoring/services/points-assignment.service.ts`
     - Convert raw Morningstar values to points (0, 3, 5, 7, 10)
     - Handle quantitative ranges (e.g., 5Y_CAGR: ≥15% → 10pts)
     - Convert qualitative text to points:
       - Fund_House: "Tier 1" → 10, "Strong Tier 2" → 7, "Tier 2" → 5, etc.
       - Manager_Record: "Excellent" → 10, "Good" → 7, "Average" → 5, etc.
       - AMC_Risk: "Excellent" → 10, "Good" → 7, "Average" → 5, etc.
       - ESG: "Strong" → 10, "Moderate" → 7, "Neutral" → 5, etc.
     - Apply "lower is better" logic (e.g., lower expense → higher points)
   
   **Step 2: Category Statistics Service**
   - [ ] `src/modules/scoring/services/category-stats.service.ts`
     - Calculate mean for each parameter across all funds in category
     - Calculate standard deviation for each parameter
     - Store in `category_stats` section of Collection 4
   
   **Step 3: Z-Score Calculator Service**
   - [ ] `src/modules/scoring/services/z-score-calculator.service.ts`
     - Compute Z-scores: `(points - category_mean) / category_stdev`
     - Handle outliers (cap at ±3 standard deviations)
     - Apply directional adjustment (invert for "lower is better" params)
     - Z-scores are SAME across all risk profiles (normalized values)
   
   **Step 4: Composite Scorer Service**
   - [ ] `src/modules/scoring/services/composite-scorer.service.ts`
     - Load risk profile weights from config
     - Calculate weighted composite score for EACH risk profile:
       `Composite_Score = Σ(Z_Score * Weight_for_RiskProfile)`
     - Rank funds separately for EACH risk profile
     - Store in `risk_profile_scores` array (4 entries per category)

4. **✅ Risk Profile Weighting**
   - [ ] `src/modules/scoring/weights/risk-profile-weights.ts`
     - Safety Seeker (conservative)
     - Conservative Guardian
     - Balanced Achiever
     - Aggressive Explorer

5. **✅ Cron Job**
   - [ ] `src/modules/scoring/services/scoring-cron.service.ts`
     - Runs after data ingestion completes
     - Processes all categories
     - Stores scores in Collections 3 & 4
     - Logs results & sends alerts

#### **Weight Configuration (Based on Weightage Table)**

**Aggressive Explorer (Growth-focused):**
```typescript
{
  // Returns & Growth (25%)
  '5Y_CAGR': 0.125,                    // 25% / 2 params
  '3Y_Rolling': 0.125,
  
  // Risk-Adjusted Metrics (15%)
  'Sharpe_3Y': 0.0375,                 // 15% / 4 params
  'Sortino_3Y': 0.0375,
  'Alpha': 0.0375,
  'Beta': 0.0375,
  
  // Volatility & Drawdown (10%)
  'Std_Dev': 0.0333,                   // 10% / 3 params
  'Max_DD': 0.0333,
  'Recovery_Mo': 0.0333,
  
  // Expense Ratio & AUM (10%)
  'Expense': 0.05,                     // 10% / 2 params
  'AUM_Cr': 0.05,
  
  // Downside Capture / Liquidity (5%)
  'Downside_Capture': 0.025,           // 5% / 2 params
  'Liquidity_Redemption': 0.025,
  
  // Fund House & Manager Quality (10%)
  'Fund_House': 0.025,                 // 10% / 4 params
  'Manager_Tenure': 0.025,
  'Manager_Record': 0.025,
  'AMC_Risk': 0.025,
  
  // Portfolio Discipline & Turnover (10%)
  'Concentration': 0.0333,             // 10% / 3 params
  'Turnover': 0.0333,
  'Style_Fit': 0.0333,
  
  // ESG / Forward-Looking (15%)
  'ESG': 0.025,                        // 15% / 6 params
  'Benchmark_Consistency': 0.025,
  'Peer_Comparison': 0.025,
  'Tax_Efficiency': 0.025,
  'Fund_Innovation': 0.025,
  'Forward_Risk_Mitigation': 0.025
}
```

**Safety Seeker (Risk-focused):**
```typescript
{
  // Returns & Growth (10%) - LOWER priority
  '5Y_CAGR': 0.05,                     // 10% / 2 params
  '3Y_Rolling': 0.05,
  
  // Risk-Adjusted Metrics (10%)
  'Sharpe_3Y': 0.025,                  // 10% / 4 params
  'Sortino_3Y': 0.025,
  'Alpha': 0.025,
  'Beta': 0.025,
  
  // Volatility & Drawdown (20%) - HIGHER priority
  'Std_Dev': 0.0667,                   // 20% / 3 params
  'Max_DD': 0.0667,
  'Recovery_Mo': 0.0667,
  
  // Expense Ratio & AUM (20%) - HIGHER priority
  'Expense': 0.10,                     // 20% / 2 params
  'AUM_Cr': 0.10,
  
  // Downside Capture / Liquidity (15%)
  'Downside_Capture': 0.075,           // 15% / 2 params
  'Liquidity_Redemption': 0.075,
  
  // Fund House & Manager Quality (10%)
  'Fund_House': 0.025,                 // 10% / 4 params
  'Manager_Tenure': 0.025,
  'Manager_Record': 0.025,
  'AMC_Risk': 0.025,
  
  // Portfolio Discipline & Turnover (10%)
  'Concentration': 0.0333,             // 10% / 3 params
  'Turnover': 0.0333,
  'Style_Fit': 0.0333,
  
  // ESG / Forward-Looking (5%) - LOWER priority
  'ESG': 0.00833,                      // 5% / 6 params
  'Benchmark_Consistency': 0.00833,
  'Peer_Comparison': 0.00833,
  'Tax_Efficiency': 0.00833,
  'Fund_Innovation': 0.00833,
  'Forward_Risk_Mitigation': 0.00833
}
```

**Balanced Achiever & Conservative Guardian:** See `Docs/SCORING_ENGINE_DEEP_DIVE.md` for complete weight tables.

#### **Testing Plan:**
- [ ] Unit tests for Z-score calculator
- [ ] Unit tests for qualitative converter
- [ ] Integration test for complete scoring flow
- [ ] Verify scores in MongoDB
- [ ] Compare scores across risk profiles

#### **Deliverables:**
- [ ] Collections 3 & 4 operational
- [ ] All services implemented and tested
- [ ] Cron job configured
- [ ] API endpoints for score retrieval (optional for Phase 2)
- [ ] Documentation updated

**Status:** 🚧 **READY TO START**

---

### **📋 Phase 3: Portfolio Construction** - FUTURE

**Objective:** Build portfolio allocation logic based on scores

**Timeline:** 2 weeks  
**Dependencies:** Phase 2 complete

#### **Features to Build:**

1. **SIP Bucket Determination**
   - Categorize user SIP amount into 6 buckets
   - Micro (₹500-₹2K), Ultra-Small (₹2K-₹5K), Small (₹5K-₹10K)
   - Moderate (₹10K-₹25K), High (₹25K-₹50K), Ultra-High (₹50K+)

2. **Allocation Matrix Lookup**
   - 4 risk profiles × 6 SIP buckets × 12 asset categories
   - Predefined percentage allocation per category
   - Example: Safety Seeker + Small SIP:
     - Large Cap: 35%
     - Debt-Corporate: 30%
     - Hybrid-Conservative: 20%
     - Debt-Short: 15%

3. **Fund Selection**
   - Read scores from Collection 4
   - Select top-ranked funds from each category
   - Apply allocation percentages
   - Calculate exact SIP amounts per fund

4. **Constraints & Validation**
   - Minimum fund allocation: ₹500
   - Maximum funds per portfolio: 8
   - Diversification rules
   - Liquidity requirements

#### **Services to Build:**

- [ ] `src/modules/portfolio/services/sip-bucket.service.ts`
- [ ] `src/modules/portfolio/services/allocation-matrix.service.ts`
- [ ] `src/modules/portfolio/services/fund-selector.service.ts`
- [ ] `src/modules/portfolio/services/portfolio-constructor.service.ts`

#### **New Collection:**

**Collection 5: `portfolioRecommendations`**
```javascript
{
  _id: ObjectId(),
  user_id: ObjectId(),
  risk_profile: "Safety Seeker",
  sip_amount: 10000,
  sip_bucket: "Small",
  timestamp: ISODate("2025-10-01"),
  allocation: [
    {
      fund_id: ObjectId(),
      fund_name: "Nippon India Large Cap Fund",
      category: "Large Cap Equity",
      score: 87.5,
      rank: 1,
      allocated_percentage: 35,
      monthly_sip: 3500
    }
  ],
  total_funds: 4,
  expected_cagr: 12.5,
  expected_sharpe: 1.18,
  risk_score: 6.2
}
```

**Status:** 📋 **PLANNED**

---

### **🌐 Phase 4: API & Recommendations** - FUTURE

**Objective:** Build user-facing API endpoints

**Timeline:** 1 week  
**Dependencies:** Phase 3 complete

#### **API Endpoints to Build:**

1. **POST /api/portfolio/recommend**
   - Input: `{ sip_amount, risk_profile }`
   - Output: Complete portfolio recommendation

2. **GET /api/portfolio/rebalance/:id**
   - Check if rebalancing needed
   - Suggest fund changes

3. **GET /api/funds/scores/:category**
   - Get all scores for a category
   - Include rankings

4. **GET /api/funds/compare**
   - Compare multiple funds
   - Side-by-side scores

5. **GET /api/analytics/performance**
   - Historical performance
   - Risk metrics

**Status:** 🌐 **PLANNED**

---

### **🎨 Phase 5: Frontend Dashboard** - FUTURE

**Objective:** Build web interface

**Timeline:** 3-4 weeks  
**Dependencies:** Phase 4 complete

#### **Features:**

1. **User Onboarding**
   - Risk profiling questionnaire
   - SIP amount input
   - Goals & timeline

2. **Portfolio Dashboard**
   - Current allocation
   - Performance charts
   - Rebalancing alerts

3. **Fund Explorer**
   - Search & filter funds
   - Compare funds
   - View detailed scores

4. **Analytics & Reports**
   - Portfolio performance
   - Risk analysis
   - Tax reports

**Tech Stack:**
- Next.js 14 (React)
- TailwindCSS
- Recharts
- React Query

**Reference:** `Docs/UI_UX_doc.md`

**Status:** 🎨 **PLANNED**

---

## 📁 Current Codebase Structure

```
PlutoMoneyQuant/
├── .cursor/rules/              # AI Context (3 files)
│   ├── allocation_context.mdc  # Portfolio allocation logic
│   ├── schema_context.mdc      # Database schema context
│   └── scoring_context.mdc     # Scoring engine context
│
├── Docs/                       # Technical Docs (5 files)
│   ├── DATA_FLOW_PRODUCTION.md
│   ├── FINAL_ARCHITECTURE.md
│   ├── Implementation.md
│   ├── MORNINGSTAR_DATA_ANALYSIS.md
│   └── UI_UX_doc.md
│
├── src/                        # Source Code (27 TS files)
│   ├── app/                    # Root module
│   ├── config/                 # Configuration
│   ├── database/               # Database setup
│   ├── enums/                  # Type definitions
│   ├── modules/
│   │   ├── cron/               # Scheduled jobs
│   │   ├── morningstar/        # External API integration
│   │   └── mutual-fund/        # Core business logic (Phase 1)
│   ├── scripts/                # Test scripts
│   └── utils/                  # Helper functions
│
├── README.md                   # Main documentation
├── PRD.md                      # Product requirements
├── QUICK_API_REFERENCE.md      # API reference
├── PHASE_1_COMPLETE.md         # Phase 1 summary
├── PROJECT_ROADMAP.md          # This file - Master roadmap
├── generate.mdc                # Code generation guidelines
│
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── nest-cli.json               # NestJS CLI config
├── sample.env                  # Environment template
├── test-api-payload.json       # Sample test data
└── .gitignore                  # Git ignore rules
```

---

## 🎯 Success Metrics

### **Phase 1 (Completed)**
- ✅ 100% data ingestion success rate
- ✅ 4 REST API endpoints operational
- ✅ 8 funds ingested successfully
- ✅ MongoDB collections created and indexed

### **Phase 2 (Target)**
- [ ] Z-scores calculated for 1,800+ funds
- [ ] All 27 parameters scored
- [ ] 4 risk profiles configured
- [ ] Scoring cron job running monthly
- [ ] API response time < 200ms

### **Phase 3 (Target)**
- [ ] Portfolio recommendations for all risk profiles
- [ ] 6 SIP buckets implemented
- [ ] Allocation matrix operational
- [ ] Constraints validated

### **Phase 4 (Target)**
- [ ] All API endpoints operational
- [ ] API response time < 300ms
- [ ] Comprehensive error handling
- [ ] Rate limiting implemented

### **Phase 5 (Target)**
- [ ] Web dashboard deployed
- [ ] User onboarding flow complete
- [ ] Interactive charts & analytics
- [ ] Mobile responsive

---

## 📝 Documentation Status

### **✅ Complete & Up-to-Date:**
- `README.md` - Overview, Quick Start, API endpoints
- `QUICK_API_REFERENCE.md` - Complete API documentation
- `PHASE_1_COMPLETE.md` - Phase 1 detailed summary
- `PROJECT_ROADMAP.md` - This master roadmap
- `Docs/Implementation.md` - Technical implementation guide
- `Docs/FINAL_ARCHITECTURE.md` - System architecture
- `Docs/MORNINGSTAR_DATA_ANALYSIS.md` - Data format analysis
- `Docs/DATA_FLOW_PRODUCTION.md` - Production data flow

### **📋 Reference Documents:**
- `PRD.md` - Product requirements
- `generate.mdc` - Code generation guidelines
- `.cursor/rules/*.mdc` - AI context for development

### **🎨 Future Reference:**
- `Docs/UI_UX_doc.md` - Frontend design (Phase 5)

---

## 🚀 Getting Started with Phase 2

### **Prerequisites:**
1. Phase 1 complete ✅
2. MongoDB operational with Collections 1 & 2 ✅
3. Sample data available for testing ✅

### **Setup:**
```bash
# 1. Create Phase 2 branch
git checkout -b phase-2-scoring-engine

# 2. Create module structure
mkdir -p src/modules/scoring/{schemas,dao,services,weights}

# 3. Start with schemas
# Create Collection 3 & 4 Mongoose schemas

# 4. Build DAOs
# Implement data access layer

# 5. Implement core services
# Z-score calculator → Qualitative converter → Composite scorer

# 6. Add cron job
# Scoring cron service

# 7. Test thoroughly
npm run test

# 8. Document everything
# Update PHASE_2_COMPLETE.md
```

### **Development Workflow:**
1. Read `PHASE_1_COMPLETE.md` to understand current state
2. Review `.cursor/rules/scoring_context.mdc` for scoring logic
3. Review `.cursor/rules/schema_context.mdc` for Collections 3 & 4
4. Build incrementally: Schemas → DAOs → Services → Cron → Tests
5. Document as you build
6. Test with sample data
7. Verify in MongoDB
8. Update documentation

---

## 🎉 Summary

**Current State:**
- ✅ Phase 1: Data Ingestion - COMPLETE
- ✅ REST API operational
- ✅ 8 funds, 13 snapshots in database
- ✅ Documentation up-to-date

**Next Steps:**
- 🚧 Phase 2: Build Scoring Engine
- 📋 Phase 3: Portfolio Construction (future)
- 🌐 Phase 4: API Endpoints (future)
- 🎨 Phase 5: Frontend Dashboard (future)

**Timeline:**
- Phase 2: 2-3 weeks
- Phase 3: 2 weeks
- Phase 4: 1 week
- Phase 5: 3-4 weeks
- **Total:** ~8-10 weeks to complete product

---

**Last Updated:** October 9, 2025  
**Maintained By:** PlutoMoney Team  
**Status:** ✅ Ready for Phase 2 Development

