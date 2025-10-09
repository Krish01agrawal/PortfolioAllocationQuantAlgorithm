# 🧮 Scoring Engine Deep Dive - Complete Understanding

**Date:** October 9, 2025  
**Purpose:** Detailed explanation of the complete scoring calculation flow

---

## 🎯 The Critical Issue (CORRECTED)

### ❌ **WRONG APPROACH** (Previous Design):
```javascript
// Collection 4 - INCORRECT
{
  mf_dec_scores: [
    {
      fund_name: "Nippon India Large Cap Fund",
      composite_score: 87.5,  // ❌ ONE score for ALL risk profiles
      rank: 1                 // ❌ ONE rank for ALL risk profiles
    }
  ]
}
```

**Why This is Wrong:**
- Each risk profile has **DIFFERENT weightages**
- Therefore, each fund must have **DIFFERENT composite scores** for each risk profile
- Rankings will also be **DIFFERENT** for each risk profile
- A fund ranked #1 for "Aggressive Explorer" might be #5 for "Safety Seeker"

### ✅ **CORRECT APPROACH** (Updated Design):
```javascript
// Collection 4 - CORRECT
{
  risk_profile_scores: [
    {
      risk_profile: "Aggressive Explorer",
      weighted_scores: [
        { fund_name: "HDFC Large Cap", score: 87.5, rank: 1 }
      ]
    },
    {
      risk_profile: "Safety Seeker",
      weighted_scores: [
        { fund_name: "ICICI Bluechip", score: 82.3, rank: 1 },  // Different fund!
        { fund_name: "HDFC Large Cap", score: 79.1, rank: 3 }   // Different rank!
      ]
    }
  ]
}
```

---

## 📊 Complete Scoring Flow (4 Steps)

### **Step 1: Points Assignment (Parameter → Points)**

**Source:** Image 1 - Parameters Table

For each parameter, assign points based on value ranges:

#### Example: Quantitative Parameters

| Parameter | 10 pts | 7 pts | 5 pts | 3 pts | 0 pts |
|-----------|--------|-------|-------|-------|-------|
| 5Y CAGR (Equity) | ≥15% | 12-15% | 10-12% | 8-10% | <8% |
| Sharpe Ratio (3Y) | ≥1.2 | 1.0-1.19 | 0.8-0.99 | 0.6-0.79 | <0.6 |
| Alpha | ≥2 | 1.5-1.9 | 1-1.49 | 0.5-0.99 | <0.5 |
| Max Drawdown | ≤12% | 12-18% | 18-22% | 22-28% | >28% |
| Expense Ratio | ≤1.5% | 1.5-2% | 2-2.5% | 2.5-3% | >3% |

#### Example: Qualitative Parameters

| Parameter | 10 pts | 7 pts | 5 pts | 3 pts | 0 pts |
|-----------|--------|-------|-------|-------|-------|
| Fund House | Tier 1 AMC | Strong Tier 2 | Tier 2 | Tier 3 | New/Unknown |
| Manager Record | Excellent | Good | Average | Below Avg | Poor |
| AMC Risk Mgmt | Excellent | Good | Average | Below Avg | Poor |
| ESG | Strong | Moderate | Neutral | Weak | Poor |

**Text → Number Conversion (In-Memory Only):**
```typescript
// Fund_House
"Tier 1" → 10 points
"Strong Tier 2" → 7 points
"Tier 2" → 5 points
"Tier 3" → 3 points
"New/Unknown" → 0 points

// Manager_Record, AMC_Risk
"Excellent" → 10 points
"Good" → 7 points
"Average" → 5 points
"Below Avg" → 3 points
"Poor" → 0 points

// ESG
"Strong" → 10 points
"Moderate" → 7 points
"Neutral" → 5 points
"Weak" → 3 points
"Poor" → 0 points
```

**Example Calculation:**
```typescript
// Fund: Nippon India Large Cap Fund
// Morningstar Data → Points

{
  // Morningstar raw → Points assigned
  '5Y_CAGR': 18.86,        → 10 points (≥15%)
  'Sharpe_3Y': 1.22,       → 10 points (≥1.2)
  'Alpha': 1.5,            → 7 points (1.5-1.9)
  'Max_DD': -14.2,         → 7 points (12-18%)
  'Expense': 0.66,         → 10 points (≤1.5%)
  'Fund_House': "Tier 1",  → 10 points
  'Manager_Record': "Excellent", → 10 points
  'ESG': "Strong",         → 10 points
  // ... all 27 parameters
}
```

---

### **Step 2: Category-Level Statistics**

**Calculate for entire category (e.g., "Large Cap Equity"):**

#### Mean Calculation:
```
Category_Mean(parameter) = Σ(points of all funds) / total_funds

Example:
- Large Cap has 50 funds
- 5Y_CAGR points: [10, 10, 7, 7, 10, 5, 7, 10, ...]
- Mean = (10+10+7+7+10+5+7+10+...) / 50 = 7.8
```

#### Standard Deviation Calculation:
```
Category_StdDev(parameter) = √[Σ(points - mean)² / (total_funds - 1)]

Example:
- Mean = 7.8
- Points: [10, 10, 7, 7, 10, 5, 7, 10, ...]
- StdDev = √[((10-7.8)² + (10-7.8)² + (7-7.8)² + ...) / 49] = 1.8
```

**Store in Collection 4:**
```javascript
{
  category_stats: {
    total_funds: 50,
    parameters: {
      '5Y_CAGR': { mean: 7.8, stdev: 1.8 },
      'Sharpe_3Y': { mean: 8.2, stdev: 1.5 },
      'Alpha': { mean: 6.5, stdev: 2.1 },
      // ... all 27 parameters
    }
  }
}
```

---

### **Step 3: Z-Score Normalization**

**Source:** Image 3 - Scoring Engine Formulas

For each fund, calculate Z-scores for each parameter:

```
Z-Score(parameter) = (points - category_mean) / category_stdev
```

**Example:**
```typescript
// Nippon India Large Cap Fund
// Points: 5Y_CAGR = 10, Sharpe_3Y = 10, Alpha = 7
// Category: mean_5Y = 7.8, stdev_5Y = 1.8

z_scores: {
  '5Y_CAGR_zscore': (10 - 7.8) / 1.8 = 1.22,
  'Sharpe_3Y_zscore': (10 - 8.2) / 1.5 = 1.20,
  'Alpha_zscore': (7 - 6.5) / 2.1 = 0.24,
  // ... all 27 parameters
}
```

**Important:** Z-scores are **SAME across all risk profiles** because they're just normalized values.

**Handle Outliers:**
- Cap Z-scores at ±3 standard deviations
- If Z-score > 3, set to 3
- If Z-score < -3, set to -3

**Directional Adjustment:**
Some parameters are "lower is better" (e.g., Expense Ratio, Max Drawdown):
```typescript
// For "lower is better" parameters, invert the Z-score
if (isLowerBetter(parameter)) {
  z_score = -z_score;
}

// Example: Max Drawdown
// Fund A: Max_DD = -10% → 10 points → Z-score = +1.5
// Fund B: Max_DD = -25% → 3 points → Z-score = -1.2
// After inversion:
// Fund A: Z-score = +1.5 (good, low drawdown)
// Fund B: Z-score = -1.2 (bad, high drawdown)
```

---

### **Step 4: Risk-Profile-Specific Weighted Composite Score**

**Source:** Image 2 - Weightage Recommendations Table

#### **Weightage Configuration:**

**Parameter Groups:**
1. **Returns & Growth** (2 params)
   - 5Y CAGR Return
   - 3Y Rolling Returns Consistency

2. **Risk-Adjusted Metrics** (4 params)
   - Sharpe Ratio (3Y)
   - Sortino Ratio (3Y)
   - Alpha
   - Beta

3. **Volatility & Drawdown** (3 params)
   - Standard Deviation
   - Max Drawdown
   - Recovery Period

4. **Expense Ratio & AUM** (2 params)
   - Expense Ratio
   - AUM

5. **Downside Capture / Liquidity** (2 params)
   - Downside Capture Ratio
   - Liquidity & Redemption Risk

6. **Fund House & Manager Quality** (4 params)
   - Fund House Reputation
   - Fund Manager Tenure
   - Fund Manager Track Record
   - AMC Risk Management Practices

7. **Portfolio Discipline & Turnover** (3 params)
   - Concentration / Sector Allocation Discipline
   - Portfolio Turnover Ratio
   - Style Fit

8. **ESG / Forward-Looking Parameters** (6 params)
   - ESG / Governance Consideration
   - Benchmark Consistency
   - Peer Comparison
   - Tax Efficiency
   - Fund Innovation
   - Forward-Looking Risk Mitigation

**Total:** 27 parameters

#### **Risk Profile Weights:**

| Parameter Group | Aggressive Explorer | Balanced Achiever | Conservative Guardian | Safety Seeker |
|-----------------|---------------------|-------------------|----------------------|---------------|
| Returns & Growth | 25% | 20% | 15% | 10% |
| Risk-Adjusted Metrics | 15% | 15% | 10% | 10% |
| Volatility & Drawdown | 10% | 15% | 15% | 20% |
| Expense Ratio & AUM | 10% | 10% | 15% | 20% |
| Downside Capture / Liquidity | 5% | 10% | 15% | 15% |
| Fund House & Manager Quality | 10% | 10% | 15% | 10% |
| Portfolio Discipline & Turnover | 10% | 10% | 10% | 10% |
| ESG / Forward-Looking | 15% | 10% | 5% | 5% |
| **Total** | **100%** | **100%** | **100%** | **100%** |

#### **Individual Parameter Weights:**

**Example: Aggressive Explorer**
```typescript
{
  // Returns & Growth (25% total)
  '5Y_CAGR': 0.125,              // 25% / 2 params = 12.5% each
  '3Y_Rolling': 0.125,
  
  // Risk-Adjusted Metrics (15% total)
  'Sharpe_3Y': 0.0375,           // 15% / 4 params = 3.75% each
  'Sortino_3Y': 0.0375,
  'Alpha': 0.0375,
  'Beta': 0.0375,
  
  // Volatility & Drawdown (10% total)
  'Std_Dev': 0.0333,             // 10% / 3 params = 3.33% each
  'Max_DD': 0.0333,
  'Recovery_Mo': 0.0333,
  
  // Expense Ratio & AUM (10% total)
  'Expense': 0.05,               // 10% / 2 params = 5% each
  'AUM_Cr': 0.05,
  
  // Downside Capture / Liquidity (5% total)
  'Downside_Capture': 0.025,     // 5% / 2 params = 2.5% each
  'Liquidity_Redemption': 0.025,
  
  // Fund House & Manager Quality (10% total)
  'Fund_House': 0.025,           // 10% / 4 params = 2.5% each
  'Manager_Tenure': 0.025,
  'Manager_Record': 0.025,
  'AMC_Risk': 0.025,
  
  // Portfolio Discipline & Turnover (10% total)
  'Concentration': 0.0333,       // 10% / 3 params = 3.33% each
  'Turnover': 0.0333,
  'Style_Fit': 0.0333,
  
  // ESG / Forward-Looking (15% total)
  'ESG': 0.025,                  // 15% / 6 params = 2.5% each
  'Benchmark_Consistency': 0.025,
  'Peer_Comparison': 0.025,
  'Tax_Efficiency': 0.025,
  'Fund_Innovation': 0.025,
  'Forward_Risk_Mitigation': 0.025
}

// Total = 100% = 1.0
```

**Example: Safety Seeker**
```typescript
{
  // Returns & Growth (10% total) - LOWER priority
  '5Y_CAGR': 0.05,               // 10% / 2 = 5% each
  '3Y_Rolling': 0.05,
  
  // Risk-Adjusted Metrics (10% total)
  'Sharpe_3Y': 0.025,            // 10% / 4 = 2.5% each
  'Sortino_3Y': 0.025,
  'Alpha': 0.025,
  'Beta': 0.025,
  
  // Volatility & Drawdown (20% total) - HIGHER priority
  'Std_Dev': 0.0667,             // 20% / 3 = 6.67% each
  'Max_DD': 0.0667,
  'Recovery_Mo': 0.0667,
  
  // Expense Ratio & AUM (20% total) - HIGHER priority
  'Expense': 0.10,               // 20% / 2 = 10% each
  'AUM_Cr': 0.10,
  
  // ... and so on
}
```

#### **Composite Score Calculation:**

```
Composite_Score = Σ(Z_Score(param) * Weight(param, risk_profile))
```

**Example: Nippon India Large Cap Fund**

**For Aggressive Explorer:**
```typescript
Composite_Score_Aggressive = 
  (1.22 * 0.125) +      // 5Y_CAGR z-score * weight
  (0.85 * 0.125) +      // 3Y_Rolling z-score * weight
  (1.20 * 0.0375) +     // Sharpe_3Y z-score * weight
  (0.98 * 0.0375) +     // Sortino_3Y z-score * weight
  (0.24 * 0.0375) +     // Alpha z-score * weight
  (-0.12 * 0.0375) +    // Beta z-score * weight
  // ... all 27 parameters
  = 87.5
```

**For Safety Seeker:**
```typescript
Composite_Score_SafetySeeker = 
  (1.22 * 0.05) +       // 5Y_CAGR z-score * LOWER weight
  (0.85 * 0.05) +       // 3Y_Rolling z-score * LOWER weight
  (1.20 * 0.025) +      // Sharpe_3Y z-score * weight
  (0.98 * 0.025) +      // Sortino_3Y z-score * weight
  (0.24 * 0.025) +      // Alpha z-score * weight
  (-0.12 * 0.025) +     // Beta z-score * weight
  (0.65 * 0.0667) +     // Std_Dev z-score * HIGHER weight
  (1.15 * 0.0667) +     // Max_DD z-score * HIGHER weight
  (0.88 * 0.0667) +     // Recovery_Mo z-score * HIGHER weight
  // ... all 27 parameters
  = 79.1  // DIFFERENT SCORE!
```

**Result:**
- Same fund (Nippon India Large Cap)
- Same Z-scores (normalized values)
- Different weights applied
- **Different composite scores:** 87.5 vs 79.1

---

### **Step 5: Ranking (Risk-Profile-Specific)**

After calculating composite scores for all funds in a category, rank them separately for each risk profile.

**Example: Large Cap Equity Category**

**Aggressive Explorer Rankings:**
1. Nippon India Large Cap → Score: 87.5
2. Quant Large Cap → Score: 85.2
3. ICICI Bluechip → Score: 82.1
4. Axis Bluechip → Score: 80.5

**Safety Seeker Rankings:**
1. ICICI Bluechip → Score: 82.3  ← Different fund on top!
2. Axis Bluechip → Score: 81.7
3. Nippon India Large Cap → Score: 79.1  ← Ranked lower
4. Quant Large Cap → Score: 76.8

**Why Rankings Differ:**
- ICICI Bluechip might have:
  - Lower Max Drawdown (higher Z-score)
  - Lower Expense Ratio (higher Z-score)
  - Higher AUM (more stable)
  - These factors get HIGHER weights in Safety Seeker profile
- Nippon India Large Cap might have:
  - Higher 5Y CAGR (higher Z-score)
  - Higher Alpha (higher Z-score)
  - These factors get LOWER weights in Safety Seeker profile

---

## 🗄️ Corrected MongoDB Schema (Collection 4)

```typescript
// Collection 4: MF_Scores
{
  _id: ObjectId(),
  timestamp: ISODate("2025-10-01T00:00:00Z"),
  category_name: "Large Cap Equity",
  mutual_fund_category_id: ObjectId(),  // Reference to Collection 3
  
  // =====================================
  // SECTION 1: Category-Level Statistics
  // =====================================
  category_stats: {
    total_funds: 50,
    parameters: {
      '5Y_CAGR': { mean: 7.8, stdev: 1.8 },
      'Sharpe_3Y': { mean: 8.2, stdev: 1.5 },
      'Alpha': { mean: 6.5, stdev: 2.1 },
      'Beta': { mean: 7.0, stdev: 1.2 },
      'Std_Dev': { mean: 6.8, stdev: 1.9 },
      'Max_DD': { mean: 7.5, stdev: 1.6 },
      'Expense': { mean: 7.2, stdev: 1.4 },
      'Fund_House': { mean: 6.9, stdev: 2.0 },
      'Manager_Record': { mean: 7.1, stdev: 1.8 },
      // ... all 27 parameters
    }
  },
  
  // =====================================
  // SECTION 2: Fund-Level Data (Risk-Agnostic)
  // =====================================
  funds_data: [
    {
      fund_id: ObjectId("ref_to_collection_1"),
      fund_name: "Nippon India Large Cap Fund",
      
      // Raw values from Morningstar (AS-IS)
      raw_values: {
        '5Y_CAGR': 18.86,
        'Sharpe_3Y': 1.22,
        'Alpha': 1.5,
        'Beta': 0.95,
        'Std_Dev': 13.8,
        'Max_DD': -14.2,
        'Expense': 0.66,
        'Fund_House': "Tier 1",
        'Manager_Record': "Excellent",
        'ESG': "Strong",
        // ... all 27 parameters
      },
      
      // Points assigned based on ranges (Step 1)
      points: {
        '5Y_CAGR': 10,        // ≥15% → 10 pts
        'Sharpe_3Y': 10,      // ≥1.2 → 10 pts
        'Alpha': 7,           // 1.5-1.9 → 7 pts
        'Beta': 10,           // 0.8-1.0 → 10 pts
        'Std_Dev': 7,         // 12-15% → 7 pts
        'Max_DD': 7,          // 12-18% → 7 pts
        'Expense': 10,        // ≤1.5% → 10 pts
        'Fund_House': 10,     // "Tier 1" → 10 pts
        'Manager_Record': 10, // "Excellent" → 10 pts
        'ESG': 10,            // "Strong" → 10 pts
        // ... all 27 parameters
      },
      
      // Z-scores (normalized, Step 3)
      z_scores: {
        '5Y_CAGR_zscore': 1.22,
        'Sharpe_3Y_zscore': 1.20,
        'Alpha_zscore': 0.24,
        'Beta_zscore': 2.50,
        'Std_Dev_zscore': 0.11,
        'Max_DD_zscore': -0.31,
        'Expense_zscore': 2.00,
        'Fund_House_zscore': 1.55,
        'Manager_Record_zscore': 1.61,
        'ESG_zscore': 1.50,
        // ... all 27 parameters
      }
    },
    {
      fund_id: ObjectId("ref_to_collection_1"),
      fund_name: "ICICI Pru Bluechip Fund",
      raw_values: { ... },
      points: { ... },
      z_scores: { ... }
    }
    // ... all 50 funds in Large Cap Equity
  ],
  
  // =====================================
  // SECTION 3: Risk-Profile-Specific Scores (Step 4 & 5)
  // =====================================
  risk_profile_scores: [
    {
      risk_profile: "Aggressive Explorer",
      weighted_scores: [
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "Nippon India Large Cap Fund",
          composite_score: 87.5,
          rank: 1
        },
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "Quant Large Cap Fund",
          composite_score: 85.2,
          rank: 2
        },
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "ICICI Pru Bluechip Fund",
          composite_score: 82.1,
          rank: 3
        }
        // ... all 50 funds sorted by composite_score DESC
      ]
    },
    {
      risk_profile: "Balanced Achiever",
      weighted_scores: [
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "ICICI Pru Bluechip Fund",
          composite_score: 84.7,
          rank: 1
        },
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "Nippon India Large Cap Fund",
          composite_score: 83.2,
          rank: 2
        }
        // ... all 50 funds sorted by composite_score DESC
      ]
    },
    {
      risk_profile: "Conservative Guardian",
      weighted_scores: [
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "Axis Bluechip Fund",
          composite_score: 81.9,
          rank: 1
        }
        // ... all 50 funds sorted by composite_score DESC
      ]
    },
    {
      risk_profile: "Safety Seeker",
      weighted_scores: [
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "ICICI Pru Bluechip Fund",
          composite_score: 82.3,
          rank: 1
        },
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "Axis Bluechip Fund",
          composite_score: 81.7,
          rank: 2
        },
        {
          fund_id: ObjectId("ref_to_collection_1"),
          fund_name: "Nippon India Large Cap Fund",
          composite_score: 79.1,
          rank: 3
        }
        // ... all 50 funds sorted by composite_score DESC
      ]
    }
  ],
  
  createdAt: ISODate("2025-10-01T02:15:30Z"),
  processing_time_ms: 2347,
  status: "completed"
}
```

---

## 🔄 Monthly Data Flow

**Month 1 (Oct 2025):**
```javascript
// Collection 4 - October snapshot
{
  timestamp: ISODate("2025-10-01"),
  category_name: "Large Cap Equity",
  risk_profile_scores: [
    {
      risk_profile: "Aggressive Explorer",
      weighted_scores: [
        { fund_name: "HDFC", score: 87.5, rank: 1 },
        { fund_name: "ICICI", score: 85.2, rank: 2 }
      ]
    },
    {
      risk_profile: "Safety Seeker",
      weighted_scores: [
        { fund_name: "ICICI", score: 82.3, rank: 1 },
        { fund_name: "HDFC", score: 79.1, rank: 2 }
      ]
    }
  ]
}
```

**Month 2 (Nov 2025):**
```javascript
// Collection 4 - November snapshot (NEW document)
{
  timestamp: ISODate("2025-11-01"),
  category_name: "Large Cap Equity",
  risk_profile_scores: [
    {
      risk_profile: "Aggressive Explorer",
      weighted_scores: [
        { fund_name: "Quant", score: 89.2, rank: 1 },  // ← Rankings changed!
        { fund_name: "HDFC", score: 86.1, rank: 2 }
      ]
    },
    {
      risk_profile: "Safety Seeker",
      weighted_scores: [
        { fund_name: "ICICI", score: 83.5, rank: 1 },
        { fund_name: "Axis", score: 81.2, rank: 2 }
      ]
    }
  ]
}
```

**Why Rankings Change:**
- New Morningstar data each month
- Performance metrics updated
- Z-scores recalculated
- Rankings refreshed

---

## 💡 Key Insights

### 1. **Z-Scores are Universal**
- Calculated once per category
- Same across all risk profiles
- Represent normalized performance within category

### 2. **Composite Scores are Risk-Specific**
- Calculated 4 times per fund (once per risk profile)
- Apply different weightages
- Result in different scores

### 3. **Rankings are Risk-Specific**
- Each risk profile has its own ranking
- Top fund for Aggressive ≠ Top fund for Safety Seeker
- Reflects different investor priorities

### 4. **Monthly Recalculation**
- New document in Collection 4 each month
- Historical scores preserved
- Can track ranking changes over time

### 5. **Portfolio Recommendation**
When user requests portfolio:
```typescript
// User: Risk Profile = "Safety Seeker", SIP = ₹10,000
// System looks up:
// - Collection 4 → Latest timestamp
// - risk_profile_scores → "Safety Seeker"
// - weighted_scores → Take top-ranked funds
// - Apply allocation matrix
// - Return personalized portfolio
```

---

## 🎯 Implementation Priority (Phase 2)

1. **Build Schemas** (Collection 3 & 4)
2. **Points Assignment Service** (Text → Numbers, Range → Points)
3. **Z-Score Calculator Service** (Category stats, normalization)
4. **Weightage Config** (4 risk profiles)
5. **Composite Scorer Service** (Apply weights, calculate scores)
6. **Ranking Service** (Sort by score, assign ranks)
7. **Scoring Cron Job** (Orchestrate all services)
8. **Testing** (Verify scores match expected values)

---

**Status:** ✅ **Complete Understanding Achieved**

**Next:** Update PROJECT_ROADMAP.md with corrected schema design

