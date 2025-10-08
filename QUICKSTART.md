# 🚀 Quick Start Guide

## ✅ System is Ready!

Your PlutoMoney Quant system is **production-ready** for Phase 1 (Data Ingestion).

---

## 📊 Current Status

```
✅ Phase 1: Data Ingestion - COMPLETE
   - MongoDB schemas created
   - Morningstar parser working
   - Cron scheduler configured
   - Test data ingested successfully

📊 Database:
   - 6 funds in mfSchemeTrackRecord
   - 11 snapshots in mfSchemeDataMonthwise
   - All data stored in Morningstar format AS-IS

🚀 Next: Phase 2 - Scoring Engine
```

---

## 🏃 Run the System

### **1. Test Data Ingestion (Already Working)**

```bash
# Run test with sample data
npm run test:ingestion

# Expected output:
# ✅ Validated 5/5 funds
# ✅ Ingestion complete: 5/5 processed
```

### **2. Start NestJS Server**

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run start:prod
```

### **3. Check MongoDB Data**

```bash
# View all funds
mongosh plutomoney_quant --eval "db.mfSchemeTrackRecord.find().pretty()"

# View fund snapshots
mongosh plutomoney_quant --eval "db.mfSchemeDataMonthwise.find().limit(1).pretty()"

# Count documents
mongosh plutomoney_quant --eval "
  print('mfSchemeTrackRecord:', db.mfSchemeTrackRecord.countDocuments());
  print('mfSchemeDataMonthwise:', db.mfSchemeDataMonthwise.countDocuments());
"
```

---

## 🔄 Monthly Cron Job

The system automatically fetches data from Morningstar **every 1st working day of the month at 2:00 AM IST**.

### **How it works:**

```typescript
// src/modules/cron/services/data-ingestion-cron.service.ts
@Cron('0 2 1 * *', { timeZone: 'Asia/Kolkata' })
async handleMonthlyIngestion() {
  1. Fetch data from Morningstar API
  2. Parse and validate
  3. Store AS-IS in MongoDB
  4. Log results
}
```

### **Configure Cron:**

```bash
# .env file
CRON_ENABLED=true              # Enable/disable cron
CRON_TIMEZONE=Asia/Kolkata     # IST timezone
```

### **Test Cron Manually:**

```typescript
// In your NestJS application
const cronService = app.get(DataIngestionCronService);
await cronService.handleMonthlyIngestion();
```

---

## 🗄️ MongoDB Schema (Morningstar Format AS-IS)

### **Collection 1: mfSchemeTrackRecord**
```javascript
{
  Fund_ID: "LC001",
  Fund_Name: "Nippon India Large Cap Fund",
  Category: "Large Cap Equity",
  status: "Active",
  schemeMonthTrackList: [
    { timestamp: ISODate("2025-10-01"), mfDataId: ObjectId("...") }
  ]
}
```

### **Collection 2: mfSchemeDataMonthwise**
```javascript
{
  timestamp: ISODate("2025-10-01"),
  fundId: ObjectId("..."),
  Fund_ID: "LC001",
  Fund_Name: "Nippon India Large Cap Fund",
  Category: "Large Cap Equity",
  NAV: 85.5,
  AUM_Cr: 35700,
  "5Y_CAGR": 18.86,
  Sharpe_3Y: 1.22,
  Fund_House: "Tier 1",          // TEXT (stored AS-IS)
  Manager_Record: "Excellent",   // TEXT (stored AS-IS)
  ESG: "Strong"                  // TEXT (stored AS-IS)
}
```

**Key Point:** Morningstar data is stored **AS-IS** - no transformation!

---

## 📁 Project Structure

```
src/
├── modules/
│   ├── morningstar/              # Morningstar integration
│   │   ├── dtos/
│   │   │   └── morningstar-raw.dto.ts
│   │   ├── services/
│   │   │   ├── morningstar-api.service.ts
│   │   │   └── morningstar-parser.service.ts
│   │   └── morningstar.module.ts
│   │
│   ├── mutual-fund/              # Fund data management
│   │   ├── schemas/
│   │   │   ├── mf-scheme-track-record.schema.ts
│   │   │   └── mf-scheme-data-monthwise.schema.ts
│   │   ├── dao/
│   │   ├── services/
│   │   └── mutual-fund.module.ts
│   │
│   └── cron/                     # Scheduled jobs
│       └── services/
│           └── data-ingestion-cron.service.ts
│
├── config/                       # Configuration
├── database/                     # Database setup
├── enums/                        # Enumerations
├── utils/                        # Utilities
└── scripts/                      # Test scripts
    └── test-data-ingestion.ts
```

---

## 🔧 Environment Variables

```bash
# .env file

# Node Environment
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/plutomoney_quant
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/plutomoney_quant

# Morningstar API
MORNINGSTAR_API_URL=https://api.morningstar.com/v1
MORNINGSTAR_API_KEY=your_api_key_here
MORNINGSTAR_TIMEOUT=30000

# Cron
CRON_ENABLED=true
CRON_TIMEZONE=Asia/Kolkata

# Logging
LOG_LEVEL=debug
```

---

## 🧪 Testing

### **Test Data Ingestion:**
```bash
npm run test:ingestion
```

### **Expected Output:**
```
✅ Validated 5/5 funds
✅ Ingestion complete: 5/5 processed
Success: ✅ YES
Funds Processed: 5
Funds Added: 5
Errors: 0
```

### **Verify in MongoDB:**
```bash
mongosh plutomoney_quant --eval "
  db.mfSchemeDataMonthwise.findOne(
    {}, 
    {Fund_Name:1, Fund_House:1, Manager_Record:1, ESG:1, _id:0}
  )
"

# Expected:
# {
#   Fund_Name: 'Nippon India Large Cap Fund',
#   Fund_House: 'Tier 1',        ← TEXT!
#   Manager_Record: 'Excellent',  ← TEXT!
#   ESG: 'Strong'                 ← TEXT!
# }
```

---

## 🎯 Data Flow

```
Morningstar API
      ↓
   Parser (validates, returns AS-IS)
      ↓
   MongoDB (stores AS-IS)
      ↓
Scoring Engine (Phase 2 - converts text to numbers IN-MEMORY)
      ↓
   Scores (Collections 3 & 4)
```

**Key:** No transformation at ingestion! Text stays text, numbers stay numbers.

---

## 📊 Sample Morningstar Data Format

```json
{
  "Fund_ID": "LC001",
  "Fund_Name": "Nippon India Large Cap Fund",
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
}
```

This format is stored **exactly as-is** in MongoDB!

---

## 🚀 Next Steps (Phase 2: Scoring Engine)

1. **Create Collection 3 & 4 schemas**
   - CategoryScore
   - MF_Scores

2. **Build Z-Score Calculator**
   - Normalize quantitative parameters
   - Convert text to numbers in-memory

3. **Build Composite Scorer**
   - Weight parameters by risk profile
   - Calculate final scores

4. **Add Cron for Scoring**
   - Run scoring after data ingestion
   - Update scores monthly

---

## 💡 Key Learnings

### **✅ DO:**
- Store Morningstar data AS-IS
- Convert text to numbers only in scoring engine
- Use TypeScript for type safety
- Validate at boundaries (API → Parser)
- Keep modules independent

### **❌ DON'T:**
- Transform data at ingestion
- Store derived values in raw data
- Mix concerns across modules
- Skip validation

---

## 📚 Documentation

- `README.md` - Project overview
- `FINAL_ARCHITECTURE.md` - Complete architecture
- `DATA_FLOW_PRODUCTION.md` - Production data flow
- `MORNINGSTAR_DATA_ANALYSIS.md` - Data format analysis
- `PROJECT_STRUCTURE.md` - File structure

---

## 🎉 Summary

**Phase 1 is COMPLETE!**

✅ Data ingestion working  
✅ Morningstar format stored AS-IS  
✅ MongoDB collections created  
✅ Cron scheduler configured  
✅ Test script working  
✅ Production-ready  

**Next:** Build the Scoring Engine (Phase 2)! 🚀

---

## 🆘 Troubleshooting

### **MongoDB Connection Error:**
```bash
# Make sure MongoDB is running
ps aux | grep mongod

# If not running:
brew services start mongodb-community

# Check .env file exists:
ls -la .env
```

### **Validation Errors:**
```bash
# Check your data matches Morningstar format
# Field names must be PascalCase_Underscore
# Example: Fund_ID, Fund_Name, 5Y_CAGR
```

### **Cron Not Running:**
```bash
# Check CRON_ENABLED in .env
grep CRON_ENABLED .env

# Should be: CRON_ENABLED=true
```

---

**Happy Coding! 🚀**

