# PlutoMoney Quant - Product Requirements Document

## 🎯 Product Vision

PlutoMoney Quant is an **AI-powered mutual fund portfolio allocation system** that recommends personalized, risk-adjusted fund portfolios using quantitative scoring and monthly rebalancing.

---

## 🧠 Core Philosophy

**"Data-Driven, Risk-Aware, User-Centric"**

Every recommendation is:
1. **Quantitatively scored** using 27+ parameters (returns, risk, quality, ESG)
2. **Risk-profile matched** (Safety Seeker → Aggressive Explorer)
3. **Category-normalized** (Large Cap funds compete only with Large Cap peers)
4. **Monthly refreshed** (Morningstar data ingestion → re-scoring → rebalancing)

---

## 📊 How It Works (5-Step Flow)

### **1. Monthly Data Ingestion** (Day 1)
- Receive Morningstar JSON feed (~1,800 schemes)
- Store raw parameters in time-series collections
- Validate data quality, flag missing/outlier values

### **2. Scoring Engine** (Day 1-2)
- **Per Category**: Group funds by 12 categories (Large Cap, Debt – Corporate, etc.)
- **Directional Adjustment**: Invert "lower-is-better" metrics (expense ratio, drawdown)
- **Z-Score Normalization**: `(value - category_mean) / category_stddev`
- **Group Aggregation**: Average Z-scores into 8 parameter groups
- **Composite Score**: Weight groups by risk profile → final score per fund

### **3. Category Ranking** (Day 2)
- Rank all funds within each category by composite score
- Store in Collection4 (MF_Scores) with timestamp

### **4. Portfolio Construction** (On-Demand)
- **Input**: User's Risk Profile + SIP Amount
- **Lookup**: Allocation Matrix (Risk × SIP Bucket → % per category + # of funds)
- **Selection**: Pick top-N ranked funds from each category
- **Distribution**: Allocate SIP amount proportionally
- **Constraints**: Apply SIP minimums, AMC diversification, exit load checks

### **5. BSE Star MFD Integration**
- Generate trade list with scheme codes, SIP amounts, dates
- Submit to BSE API for SIP registration
- Track portfolio performance monthly

---

## 🗂️ Data Architecture

### **4 Core Collections**

#### **Collection 1: `mf_scheme_track_record`** (Master Fund Registry)
**Purpose**: Single source of truth for all fund identities  
**Lifespan**: Permanent (updated only when new funds launch)

```javascript
{
  _id: ObjectId("fund_12345"),
  fund_name: "Axis Bluechip Fund",
  amc: "Axis Mutual Fund",
  scheme_code: "INF200K01VW5",
  inception_date: ISODate("2010-01-01"),
  schemeMonthTrackList: [
    { timestamp: ISODate("2025-09-01"), mfDataId: ObjectId("data_001") },
    { timestamp: ISODate("2025-10-01"), mfDataId: ObjectId("data_002") }
  ]
}
```

**Why?**  
- Avoid duplicating fund metadata in every monthly snapshot
- Enable historical lookups: "What was this fund's score in March 2024?"

---

#### **Collection 2: `mf_scheme_data_monthwise`** (Time-Series Raw Data)
**Purpose**: Monthly snapshots of all 27+ parameters from Morningstar  
**Lifespan**: Grows monthly (never delete old snapshots for historical analysis)

```javascript
{
  _id: ObjectId("data_001"),
  timestamp: ISODate("2025-09-01"),
  fundId: ObjectId("fund_12345"),  // ← References Collection 1
  fund_name: "Axis Bluechip Fund",
  fund_category: "Large Cap Equity",
  five_year_cagr_equity: 13.8,
  sharpe_ratio: 1.12,
  expense_ratio_equity: 0.9,
  // ... 24 more parameters
}
```

**Why separate from Collection 1?**  
- Parameters change monthly (CAGR, AUM, expense ratio evolve)
- Enables trend analysis: "Has this fund's Sharpe ratio improved over 6 months?"

---

#### **Collection 3: `category_score`** (Master Category Registry)
**Purpose**: Organizes the 12 fund categories and their monthly score snapshots  
**Lifespan**: Permanent (12 categories are fixed)

```javascript
{
  _id: ObjectId("cat_001"),
  category_name: "Large Cap Equity",
  description: "Large-cap actively managed equity funds",
  mf_scores_plan_list: [
    { timestamp: ISODate("2025-09-01"), MF_Scores_id: ObjectId("score_001") },
    { timestamp: ISODate("2025-10-01"), MF_Scores_id: ObjectId("score_002") }
  ]
}
```

**Why?**  
- Categories are metadata; scores are time-series data
- Clean separation prevents bloated documents

---

#### **Collection 4: `mf_scores`** (Time-Series Computed Scores)
**Purpose**: Monthly leaderboards of ranked funds within each category  
**Lifespan**: Grows monthly

```javascript
{
  _id: ObjectId("score_001"),
  timestamp: ISODate("2025-09-01"),
  category_name: "Large Cap Equity",
  mutual_fund_category_id: ObjectId("cat_001"),  // ← References Collection 3
  mf_dec_scores: [
    {
      fund_name: "HDFC Top 100",
      fund_id: ObjectId("fund_12345"),  // ← References Collection 1
      composite_score: 1.56,
      rank: 1,
      group_scores: {
        returns_growth: 1.8,
        risk_adjusted: 1.4,
        volatility_drawdown: 0.9,
        // ... 5 more groups
      }
    },
    {
      fund_name: "Quant Large Cap",
      fund_id: ObjectId("fund_67890"),
      composite_score: 1.52,
      rank: 2,
      group_scores: { ... }
    }
  ]
}
```

**Why separate from Collection 2?**  
- Collection 2 = raw inputs (what Morningstar sends)
- Collection 4 = computed outputs (what our algorithm produces)
- Separation allows re-scoring without touching raw data

---

## 🔗 Collection Relationships (Entity-Relationship)

```
Collection 1 (mf_scheme_track_record)
    ↓ 1-to-Many
Collection 2 (mf_scheme_data_monthwise) ← Monthly raw data per fund

Collection 3 (category_score)
    ↓ 1-to-Many
Collection 4 (mf_scores) ← Monthly ranked scores per category
    ↓ Each score references
Collection 1 (via fund_id) ← Links back to fund identity
```

---

## 📈 Query Patterns (How We'll Use These Collections)

### **Pattern 1: Get Latest Data for a Fund**
```javascript
// Step 1: Find fund in Collection 1
const fund = db.mf_scheme_track_record.findOne({ fund_name: "Axis Bluechip Fund" });

// Step 2: Get latest month's data from Collection 2
const latestDataId = fund.schemeMonthTrackList[fund.schemeMonthTrackList.length - 1].mfDataId;
const latestData = db.mf_scheme_data_monthwise.findOne({ _id: latestDataId });
```

---

### **Pattern 2: Get Top 5 Funds in a Category for Current Month**
```javascript
// Step 1: Find category in Collection 3
const category = db.category_score.findOne({ category_name: "Large Cap Equity" });

// Step 2: Get latest month's scores from Collection 4
const latestScoreId = category.mf_scores_plan_list[category.mf_scores_plan_list.length - 1].MF_Scores_id;
const latestScores = db.mf_scores.findOne({ _id: latestScoreId });

// Step 3: Top 5 funds (already sorted by rank in mf_dec_scores array)
const top5 = latestScores.mf_dec_scores.slice(0, 5);
```

---

### **Pattern 3: Historical Trend for a Fund's Score**
```javascript
// Get all scores for "Axis Bluechip Fund" over last 6 months
const fund = db.mf_scheme_track_record.findOne({ fund_name: "Axis Bluechip Fund" });

// Query all Collection 4 documents where this fund appears
const scores = db.mf_scores.aggregate([
  { $match: { timestamp: { $gte: ISODate("2025-04-01") } } },
  { $unwind: "$mf_dec_scores" },
  { $match: { "mf_dec_scores.fund_id": fund._id } },
  { $project: {
      timestamp: 1,
      category_name: 1,
      score: "$mf_dec_scores.composite_score",
      rank: "$mf_dec_scores.rank"
  }},
  { $sort: { timestamp: 1 } }
]);
```

---

## 🎨 User Personas & Risk Profiles

### **1. Safety Seeker** (Conservative, Capital Protection)
- **Age**: 50-65 years
- **Goal**: Retirement corpus preservation
- **Allocation**: 70-100% Debt/Hybrid, 0-30% Equity
- **Parameter Weights**: High on Volatility (20%), Expense/AUM (20%), Downside Capture (15%)

### **2. Conservative Guardian** (Cautious Growth)
- **Age**: 40-55 years
- **Goal**: Wealth preservation with modest growth
- **Allocation**: 50-70% Debt/Hybrid, 30-50% Equity
- **Parameter Weights**: Balanced across all groups

### **3. Balanced Achiever** (Moderate Risk-Return)
- **Age**: 30-45 years
- **Goal**: Retirement planning, home purchase
- **Allocation**: 60-75% Equity, 25-40% Debt/Hybrid
- **Parameter Weights**: Balanced with slight tilt to Returns (20%) and Risk-Adjusted (15%)

### **4. Aggressive Explorer** (High Growth)
- **Age**: 25-40 years
- **Goal**: Wealth creation, long-term goals
- **Allocation**: 80-100% Equity (including Small/Mid Cap, International)
- **Parameter Weights**: Heavy on Returns (25%), ESG/Forward-Looking (15%), Risk-Adjusted (15%)

---

## 🧮 The Scoring Formula (Deep Dive)

### **Step 1: Directional Adjustment**
```python
# Higher is Better (use as-is)
higher_is_better = ['five_year_cagr_equity', 'sharpe_ratio', 'alpha', 'aum_equity', ...]

# Lower is Better (invert by multiplying -1)
lower_is_better = ['expense_ratio_equity', 'max_drawdown', 'beta', 'recovery_period', ...]

directional_value = raw_value if param in higher_is_better else -raw_value
```

### **Step 2: Z-Score Normalization (Per Category)**
```python
# Within "Large Cap Equity" peer set
category_funds = [all Large Cap funds]

for param in all_parameters:
    category_mean = mean([fund[param] for fund in category_funds])
    category_stddev = stddev([fund[param] for fund in category_funds])
    
    fund.z_scores[param] = (fund.directional_value[param] - category_mean) / category_stddev
```

**Why Z-scores?**  
- Makes apples-to-apples comparisons (expense ratio 0.5% vs Sharpe 1.2)
- Outliers don't dominate (a fund with 50% CAGR doesn't skew everything)

### **Step 3: Group Scoring**
```python
# 8 Parameter Groups
groups = {
  'returns_growth': ['five_year_cagr_equity', 'three_year_rolling_consistency'],
  'risk_adjusted': ['sharpe_ratio', 'sortino_ratio', 'alpha', 'beta'],
  'volatility_drawdown': ['std_dev_equity', 'max_drawdown', 'recovery_period'],
  'expense_aum': ['expense_ratio_equity', 'aum_equity'],
  'downside_liquidity': ['downside_capture_ratio', 'liquidity_risk'],
  'fund_house_mgr': ['fund_house_reputation', 'fund_manager_tenure', ...],
  'discipline_turnover': ['portfolio_turnover_ratio', 'concentration_sector_fit', ...],
  'esg_forward': ['esg_governance', 'benchmark_consistency', ...]
}

fund.group_scores['returns_growth'] = mean(fund.z_scores[p] for p in groups['returns_growth'])
```

### **Step 4: Composite Score (Risk-Profile Weighted)**
```python
# Risk profile weights (from "Weightage" table)
weights = {
  'Aggressive Explorer': {
    'returns_growth': 0.25,
    'risk_adjusted': 0.15,
    'volatility_drawdown': 0.10,
    'expense_aum': 0.10,
    'downside_liquidity': 0.05,
    'fund_house_mgr': 0.10,
    'discipline_turnover': 0.10,
    'esg_forward': 0.15
  },
  # ... other profiles
}

fund.composite_score = sum(
  fund.group_scores[group] * weights[risk_profile][group]
  for group in groups
)
```

---

## 🚀 Implementation Milestones

### **Phase 1: Foundation** (Weeks 1-2)
- [ ] MongoDB setup with 4 collections + indexes
- [ ] Data ingestion pipeline (Morningstar JSON → Collection 1 & 2)
- [ ] Directionality config (which params are higher-is-better)
- [ ] Allocation matrix (Risk × SIP Bucket → JSON config)

### **Phase 2: Scoring Engine** (Weeks 3-4)
- [ ] Z-score calculator (per category)
- [ ] Group scorer (8 parameter groups)
- [ ] Composite scorer (risk-profile weighted)
- [ ] Store results in Collection 3 & 4

### **Phase 3: Portfolio Construction** (Week 5)
- [ ] Allocation engine (risk + SIP → fund selection)
- [ ] Constraint handler (SIP minimums, AMC diversification)
- [ ] Portfolio optimizer (equal-weight vs score-proportional)

### **Phase 4: BSE Integration** (Week 6)
- [ ] Trade list generator
- [ ] BSE Star MFD API client
- [ ] SIP registration automation

### **Phase 5: Rebalancing & Monitoring** (Week 7)
- [ ] Monthly re-scoring automation
- [ ] Drift detector (score/allocation changes)
- [ ] Rebalancing engine (switch recommendations)

### **Phase 6: User-Facing API** (Week 8)
- [ ] REST API (GET /recommend, POST /portfolio)
- [ ] Suitability documentation (SEBI compliance)
- [ ] Explanation generator ("Why this fund?")

---

## 📏 Success Metrics

### **Technical KPIs**
- **Scoring Latency**: < 2 minutes for all 1,800 schemes
- **Data Freshness**: Scores updated within 24 hours of Morningstar feed
- **API Response Time**: < 200ms for portfolio recommendations

### **Business KPIs**
- **Portfolio Performance**: Beat benchmark by 2-3% annually
- **Rebalancing Efficiency**: Reduce exit-load impact by 80%
- **User Satisfaction**: >4.5/5 rating on recommendation quality

---

## 🔐 Compliance & Risk Management

### **SEBI Guidelines**
1. **Suitability Assessment**: Document risk profile derivation
2. **Riskometer Display**: Show fund risk labels (Low → Very High)
3. **Regular vs Direct**: Default to Regular plan (MFD commission structure)
4. **Disclosure**: "Past performance doesn't guarantee future returns"

### **Data Security**
- User portfolios encrypted at rest
- PII (Personally Identifiable Information) isolated in separate collections
- BSE API credentials in environment variables (never in code)

---

## 📞 Stakeholders

- **Product Owner**: Krish Agrawal
- **Data Provider**: Morningstar India
- **Distribution Partner**: BSE Star MFD
- **End Users**: MFD clients (retail investors)

---

**Last Updated**: October 6, 2025  
**Version**: 1.0

