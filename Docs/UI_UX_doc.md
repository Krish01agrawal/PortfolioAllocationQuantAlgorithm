# PlutoMoney Quant - UI/UX Design Guidelines

## 🎨 Design Philosophy

**"Transparency, Simplicity, Trust"**

- **Transparency**: Show WHY each fund is recommended (scores, strengths)
- **Simplicity**: Complex algorithms hidden behind clean interface
- **Trust**: SEBI compliance, riskometer alignment, performance disclaimers

---

## 🧭 User Flows

### **Flow 1: New User → Portfolio Recommendation**

```
┌──────────────────┐
│  Landing Page    │
│  "Get Started"   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Risk Profiling  │
│  (5 questions)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Enter SIP Amt   │
│  ₹1,000 - ₹1L    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Review Portfolio│
│  (10 funds list) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Confirm & Submit│
│  (BSE API call)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Success Screen  │
│  "SIP Registered"│
└──────────────────┘
```

**Estimated Time**: 3-5 minutes

---

### **Flow 2: Existing User → Monthly Rebalancing**

```
┌──────────────────┐
│  Dashboard       │
│  Portfolio View  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Rebalancing Alert│
│  "2 changes"     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Review Changes  │
│  (Fund X → Y)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Approve/Defer   │
│  (Exit load warn)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Switch Executed │
│  "Done!"         │
└──────────────────┘
```

---

## 📱 Screen Wireframes

### **1. Risk Profiling Questionnaire**

```
┌────────────────────────────────────────────────┐
│  PlutoMoney Quant                       [Help] │
├────────────────────────────────────────────────┤
│                                                │
│  📊 Understanding Your Risk Profile            │
│                                                │
│  Question 1 of 5                               │
│  Progress: ████░░░░░░░░ 20%                   │
│                                                │
│  What is your investment goal?                 │
│                                                │
│  ○ Retirement (>10 years)                      │
│  ○ Home Purchase (5-10 years)                  │
│  ○ Child Education (7-15 years)                │
│  ○ Wealth Creation (Long-term)                 │
│                                                │
│                        [Back]    [Next] →      │
└────────────────────────────────────────────────┘
```

**Design Notes**:
- **Progress bar**: Visual feedback on completion
- **Single-select radio**: One answer per question
- **Help icon**: Explains why we ask this

---

### **2. Portfolio Recommendation Screen**

```
┌────────────────────────────────────────────────────────────────┐
│  PlutoMoney Quant                            [Profile] [Logout] │
├────────────────────────────────────────────────────────────────┤
│  Your Personalized Portfolio                                   │
│  Risk Profile: Balanced Achiever  |  SIP: ₹25,000/month        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📈 Projected Returns (5Y): 12-14% CAGR                        │
│  📊 Portfolio Score: 1.38 (Top 15% in your category)           │
│  🎯 Risk Level: Moderate                                       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Recommended Funds (10)                  [Download Report PDF] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🏆 Equity (70%) - ₹17,500/month                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Axis Bluechip Fund                  ₹5,000    [Details ▼]│ │
│  │ Large Cap Equity  |  Rank: #1/45  |  Score: 1.56         │ │
│  │ ★ High alpha (2.3), Low beta (0.88), Consistent returns  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ HDFC Mid-Cap Opportunities Fund      ₹3,750   [Details ▼]│ │
│  │ Mid Cap Equity  |  Rank: #2/38  |  Score: 1.42           │ │
│  │ ★ Strong manager (10Y tenure), Top peer comparison       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ... [8 more funds]                                            │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  💰 Debt (30%) - ₹7,500/month                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ICICI Corporate Bond Fund           ₹2,500    [Details ▼]│ │
│  │ Debt - Corporate  |  Rank: #1/22  |  Score: 0.98         │ │
│  │ ★ Low expense (0.5%), High credit quality (AAA 85%)      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ... [2 more debt funds]                                       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  ⚠️ Important Disclosures                                      │
│  • Past performance doesn't guarantee future returns           │
│  • Mutual funds are subject to market risks                   │
│  • Exit load: 1% if redeemed within 1 year                    │
│                                                                │
│              [Modify Portfolio]    [Confirm & Invest] →        │
└────────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- **Portfolio summary**: High-level metrics at top
- **Fund cards**: Expandable for detailed view
- **Visual hierarchy**: Equity vs Debt sections clear
- **Strength indicators**: "Why this fund?" in plain language
- **SEBI compliance**: Disclaimers visible

---

### **3. Fund Details Modal** (Expanded)

```
┌────────────────────────────────────────────────────────────────┐
│  Axis Bluechip Fund - Regular Growth                      [✕]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 Performance                                                │
│  ├─ 5Y CAGR: 13.8%  (Benchmark: 12.1%)  ✅ Outperforming      │
│  ├─ 3Y Rolling Consistency: 84%  (High stability)             │
│  ├─ Max Drawdown: -11.2%  (Lower than peers)                  │
│  └─ Recovery Period: 5 months                                  │
│                                                                │
│  📈 Risk Metrics                                               │
│  ├─ Sharpe Ratio: 1.12  (Excellent risk-adjusted return)      │
│  ├─ Beta: 0.88  (Less volatile than market)                   │
│  ├─ Alpha: 2.3  (Generates excess return)                     │
│  └─ Std Deviation: 12.1%                                       │
│                                                                │
│  💰 Cost & Size                                                │
│  ├─ Expense Ratio: 0.9%  (Low cost)                           │
│  ├─ AUM: ₹18,000 Cr  (Large, stable fund)                     │
│  └─ Exit Load: 1% if redeemed <1 year                         │
│                                                                │
│  🏢 Fund House                                                 │
│  ├─ AMC: Axis Mutual Fund  (Reputation: ★★★★★)               │
│  ├─ Manager Tenure: 8 years                                   │
│  └─ Fund Launch: Jan 2010                                     │
│                                                                │
│  📉 Historical Performance Chart                               │
│  [Line chart: NAV vs Benchmark over 5 years]                  │
│                                                                │
│  🎯 Composite Score Breakdown                                  │
│  ├─ Returns & Growth: 1.8 (25% weight)                        │
│  ├─ Risk-Adjusted: 1.4 (15% weight)                           │
│  ├─ Volatility: 0.9 (15% weight)                              │
│  └─ ... [5 more groups]                                       │
│                                                                │
│              [Remove from Portfolio]    [Keep Fund]            │
└────────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- **Transparency**: Show exact scores + group breakdown
- **Plain language**: "Excellent risk-adjusted return" not just "Sharpe 1.12"
- **Visual charts**: Historical performance vs benchmark

---

### **4. Rebalancing Alert Screen**

```
┌────────────────────────────────────────────────────────────────┐
│  PlutoMoney Quant                            [Profile] [Logout] │
├────────────────────────────────────────────────────────────────┤
│  Monthly Rebalancing Recommendation                            │
│  Review Period: October 2025                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔄 2 Changes Recommended                                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  CHANGE 1: Large Cap Equity                              │ │
│  │                                                          │ │
│  │  ❌ Remove: Quant Large Cap Fund                         │ │
│  │     Reason: Rank dropped from #1 to #4 (score: 1.45)    │ │
│  │     Exit Load: ₹0 (held >1 year)                        │ │
│  │                                                          │ │
│  │  ✅ Add: HDFC Top 100 Fund                               │ │
│  │     Reason: Now #1 ranked (score: 1.56)                 │ │
│  │     Strength: Improved Sharpe ratio (1.2 → 1.3)         │ │
│  │                                                          │ │
│  │     Impact: +0.8% expected annual return                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  CHANGE 2: Debt - Corporate                              │ │
│  │                                                          │ │
│  │  ❌ Remove: Aditya Birla Corporate Bond                  │ │
│  │     Reason: Expense ratio increased (0.6% → 0.9%)       │ │
│  │     ⚠️ Exit Load: ₹50 (held 8 months, <1 year)          │ │
│  │                                                          │ │
│  │  ✅ Add: ICICI Corporate Bond Fund                       │ │
│  │     Reason: Lower expense (0.5%), better YTM            │ │
│  │                                                          │ │
│  │     Impact: -₹50 exit load, +0.3% annual return         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  💡 Recommendation: Defer Change 2 for 4 months to avoid      │
│     exit load. Net impact: +0.2% return after load.           │
│                                                                │
│              [Defer All]    [Approve Change 1 Only] →          │
└────────────────────────────────────────────────────────────────┘
```

**Design Notes**:
- **Clear trade-offs**: Exit load vs expected gain
- **Actionable insights**: "Defer 4 months" recommendation
- **Selective approval**: Allow partial rebalancing

---

## 🎨 Design System

### **Colors**

| Usage | Color | Hex | When to Use |
|-------|-------|-----|-------------|
| Primary | Blue | `#2563EB` | CTAs, links, highlights |
| Success | Green | `#10B981` | Positive metrics, gains |
| Warning | Yellow | `#F59E0B` | Exit loads, cautions |
| Danger | Red | `#EF4444` | Losses, errors |
| Neutral | Gray | `#6B7280` | Body text, secondary info |

### **Typography**

- **Headings**: Inter, 600 weight, 24-32px
- **Body**: Inter, 400 weight, 16px, 1.6 line-height
- **Captions**: Inter, 400 weight, 14px, muted color

### **Spacing**

- **Section gaps**: 32px
- **Card padding**: 24px
- **Element margin**: 16px
- **Input padding**: 12px

### **Components**

#### **Fund Card**

```html
<div class="fund-card">
  <div class="fund-header">
    <h3>Axis Bluechip Fund</h3>
    <span class="fund-amount">₹5,000</span>
  </div>
  <div class="fund-meta">
    <span>Large Cap Equity</span>
    <span>Rank: #1/45</span>
    <span>Score: 1.56</span>
  </div>
  <div class="fund-strengths">
    ★ High alpha (2.3), Low beta (0.88), Consistent returns
  </div>
  <button class="details-toggle">Details ▼</button>
</div>
```

**CSS**:
```css
.fund-card {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.fund-card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border-color: #2563EB;
}
```

---

## 📊 Data Visualization

### **Performance Chart (5Y NAV vs Benchmark)**

Use **Recharts** (React) or **Chart.js**:

```javascript
<LineChart data={historicalData}>
  <Line type="monotone" dataKey="nav" stroke="#2563EB" name="Fund NAV" />
  <Line type="monotone" dataKey="benchmark" stroke="#10B981" name="Benchmark" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
</LineChart>
```

### **Score Breakdown (Radar Chart)**

```javascript
<RadarChart data={groupScores}>
  <PolarGrid />
  <PolarAngleAxis dataKey="group" />
  <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.6} />
</RadarChart>
```

---

## ♿ Accessibility (A11y)

### **WCAG 2.1 AA Compliance**

1. **Color Contrast**: Minimum 4.5:1 ratio (text vs background)
2. **Keyboard Navigation**: All interactive elements accessible via Tab
3. **Screen Readers**: Proper ARIA labels on buttons/inputs
4. **Focus Indicators**: Visible outline on focused elements

### **Example**:

```html
<button 
  aria-label="View details for Axis Bluechip Fund"
  class="details-button"
>
  Details ▼
</button>
```

---

## 📱 Responsive Design

### **Breakpoints**

| Device | Width | Adjustments |
|--------|-------|-------------|
| Mobile | <640px | Stack fund cards vertically, hide detailed scores |
| Tablet | 640-1024px | 2-column fund grid |
| Desktop | >1024px | 3-column fund grid, side-by-side comparison |

---

## 🔔 Notifications & Alerts

### **Types**

1. **Info**: "Your portfolio was updated for October 2025" (Blue)
2. **Success**: "SIP registration successful!" (Green)
3. **Warning**: "Exit load of ₹50 applies if you switch now" (Yellow)
4. **Error**: "BSE API is down. Please try again later." (Red)

### **Placement**

- **Toast**: Bottom-right corner, auto-dismiss after 5 seconds
- **Banner**: Top of screen, manual dismiss for critical alerts

---

## 🧪 Usability Testing Plan

### **Test Scenarios**

1. **First-time user completes risk profiling** (Target: <5 mins)
2. **User understands why a fund is recommended** (Comprehension test)
3. **User approves rebalancing without confusion** (Decision confidence)

### **Success Metrics**

- **Task completion rate**: >90%
- **Time on task**: <5 mins for portfolio creation
- **User satisfaction**: >4.2/5 (post-interaction survey)

---

**Last Updated**: October 6, 2025  
**Version**: 1.0

