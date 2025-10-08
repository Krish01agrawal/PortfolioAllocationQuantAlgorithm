# 🚀 API Testing Guide

## Quick Start

```bash
# 1. Start the server
npm run start:dev

# 2. Server will run on: http://localhost:3000

# 3. Use the endpoints below to test!
```

---

## 📡 API Endpoints

### **1. POST /api/mutual-funds/ingest** - Manual Data Ingestion

Ingest fund data directly (perfect for testing before Morningstar is configured).

#### **Request:**

```bash
curl -X POST http://localhost:3000/api/mutual-funds/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "funds": [
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
      },
      {
        "Fund_ID": "LC002",
        "Fund_Name": "ICICI Pru Bluechip Fund",
        "Category": "Large Cap",
        "NAV": 120.4,
        "AUM_Cr": 63264,
        "5Y_CAGR": 18.17,
        "3Y_Rolling": 82,
        "Sharpe_3Y": 1.18,
        "Sortino_3Y": 1.45,
        "Alpha": 1.38,
        "Beta": 0.96,
        "Std_Dev": 14.1,
        "Max_DD": -15.1,
        "Recovery_Mo": 10,
        "Downside_Capture": 68,
        "Expense": 0.91,
        "Turnover": 35,
        "Concentration": 42,
        "Fund_House": "Tier 1",
        "Manager_Tenure": 9,
        "Manager_Record": "Excellent",
        "AMC_Risk": "Excellent",
        "ESG": "Strong"
      }
    ],
    "timestamp": "2025-10-01"
  }'
```

#### **Response:**

```json
{
  "success": true,
  "message": "Successfully ingested 2/2 funds",
  "data": {
    "fundsProcessed": 2,
    "fundsAdded": 2,
    "fundsUpdated": 0,
    "errors": [],
    "timestamp": "2025-10-01T00:00:00.000Z"
  }
}
```

---

### **2. GET /api/mutual-funds** - Get All Funds

Retrieve all funds with optional filters.

#### **Request:**

```bash
# Get all funds
curl http://localhost:3000/api/mutual-funds

# Filter by category
curl "http://localhost:3000/api/mutual-funds?category=Large%20Cap%20Equity"

# Filter by status
curl "http://localhost:3000/api/mutual-funds?status=Active"
```

#### **Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "67053abc...",
      "Fund_ID": "LC001",
      "Fund_Name": "Nippon India Large Cap Fund",
      "Category": "Large Cap Equity",
      "status": "Active",
      "schemeMonthTrackList": [
        {
          "timestamp": "2025-10-01T00:00:00.000Z",
          "mfDataId": "67053abc..."
        }
      ]
    }
  ],
  "count": 6
}
```

---

### **3. GET /api/mutual-funds/:id** - Get Fund by ID

Get detailed information about a specific fund.

#### **Request:**

```bash
curl http://localhost:3000/api/mutual-funds/LC001
```

#### **Response:**

```json
{
  "success": true,
  "data": {
    "_id": "67053abc...",
    "Fund_ID": "LC001",
    "Fund_Name": "Nippon India Large Cap Fund",
    "Category": "Large Cap Equity",
    "status": "Active",
    "schemeMonthTrackList": [
      {
        "timestamp": "2025-10-01T00:00:00.000Z",
        "mfDataId": "67053abc..."
      }
    ],
    "createdAt": "2025-10-08T...",
    "updatedAt": "2025-10-08T..."
  }
}
```

---

### **4. GET /api/mutual-funds/:id/history** - Get Fund History

Get historical monthly snapshots for a fund.

#### **Request:**

```bash
# Get all history
curl http://localhost:3000/api/mutual-funds/LC001/history

# Filter by date range
curl "http://localhost:3000/api/mutual-funds/LC001/history?fromDate=2025-01-01&toDate=2025-12-31"
```

#### **Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "67053abc...",
      "timestamp": "2025-10-01T00:00:00.000Z",
      "fundId": "67053...",
      "Fund_ID": "LC001",
      "Fund_Name": "Nippon India Large Cap Fund",
      "Category": "Large Cap Equity",
      "NAV": 85.5,
      "AUM_Cr": 35700,
      "5Y_CAGR": 18.86,
      "Sharpe_3Y": 1.22,
      "Fund_House": "Tier 1",
      "Manager_Record": "Excellent",
      "ESG": "Strong"
    }
  ],
  "count": 12
}
```

---

## 📋 Sample JSON Payloads

### **Minimal Payload (Required fields only)**

```json
{
  "funds": [
    {
      "Fund_ID": "TEST001",
      "Fund_Name": "Test Fund",
      "Category": "Large Cap"
    }
  ]
}
```

### **Complete Payload (All fields)**

```json
{
  "funds": [
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
  ],
  "timestamp": "2025-10-01"
}
```

### **Multiple Funds**

```json
{
  "funds": [
    {
      "Fund_ID": "LC001",
      "Fund_Name": "Nippon India Large Cap Fund",
      "Category": "Large Cap",
      "NAV": 85.5,
      "5Y_CAGR": 18.86,
      "Sharpe_3Y": 1.22,
      "Fund_House": "Tier 1",
      "Manager_Record": "Excellent",
      "ESG": "Strong"
    },
    {
      "Fund_ID": "MC001",
      "Fund_Name": "Axis Midcap Fund",
      "Category": "Mid Cap",
      "NAV": 72.3,
      "5Y_CAGR": 22.45,
      "Sharpe_3Y": 1.35,
      "Fund_House": "Tier 1",
      "Manager_Record": "Good",
      "ESG": "Moderate"
    },
    {
      "Fund_ID": "DC001",
      "Fund_Name": "Aditya Birla SL Corp Bond",
      "Category": "Debt-Corp",
      "NAV": 125.6,
      "5Y_CAGR": 6.7,
      "Sharpe_3Y": 1.56,
      "Fund_House": "Tier 1",
      "Manager_Record": "Good",
      "ESG": "Moderate"
    }
  ],
  "timestamp": "2025-11-01"
}
```

---

## 🧪 Testing with Postman

1. **Import Collection:**
   - Create a new collection "PlutoMoney Quant"
   - Add base URL variable: `{{base_url}}` = `http://localhost:3000`

2. **Create Requests:**
   - `POST {{base_url}}/api/mutual-funds/ingest`
   - `GET {{base_url}}/api/mutual-funds`
   - `GET {{base_url}}/api/mutual-funds/LC001`
   - `GET {{base_url}}/api/mutual-funds/LC001/history`

3. **Set Headers:**
   - `Content-Type: application/json`

4. **Add Body (for POST):**
   - Select "raw" + "JSON"
   - Paste sample payload

---

## 🧪 Testing with HTTPie (Alternative to curl)

```bash
# Install httpie (optional)
brew install httpie  # macOS
# or
pip install httpie   # Python

# POST request (cleaner syntax)
http POST http://localhost:3000/api/mutual-funds/ingest \
  funds:='[{"Fund_ID":"LC001","Fund_Name":"Test","Category":"Large Cap"}]' \
  timestamp="2025-10-01"

# GET request
http GET http://localhost:3000/api/mutual-funds

# GET with query params
http GET http://localhost:3000/api/mutual-funds category=="Large Cap Equity"
```

---

## ✅ Expected Workflow

### **First Ingestion (New Funds):**

```bash
POST /api/mutual-funds/ingest
→ Response: fundsAdded: 2, fundsUpdated: 0
```

### **Re-run Same Data (Update Existing):**

```bash
POST /api/mutual-funds/ingest (same data, same timestamp)
→ Response: fundsAdded: 0, fundsUpdated: 2
```

### **New Month's Data:**

```bash
POST /api/mutual-funds/ingest (new timestamp)
→ Response: fundsAdded: 2, fundsUpdated: 0
```

### **Verify in MongoDB:**

```bash
mongosh plutomoney_quant --eval "
  print('Funds:', db.mfSchemeTrackRecord.countDocuments());
  print('Snapshots:', db.mfSchemeDataMonthwise.countDocuments());
"
```

---

## 🔍 Validation Errors

The API validates all incoming data. If you send invalid data:

```bash
# Example: Missing required field
curl -X POST http://localhost:3000/api/mutual-funds/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "funds": [
      {
        "Fund_Name": "Test Fund"
        // Missing Fund_ID and Category (required!)
      }
    ]
  }'
```

**Response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Fund_ID is required",
    "Category is required"
  ]
}
```

---

## 💡 Tips

1. **Use jq for pretty printing:**
   ```bash
   curl http://localhost:3000/api/mutual-funds | jq
   ```

2. **Save to file:**
   ```bash
   curl http://localhost:3000/api/mutual-funds > funds.json
   ```

3. **Check response time:**
   ```bash
   time curl http://localhost:3000/api/mutual-funds
   ```

4. **Watch MongoDB in real-time:**
   ```bash
   watch -n 1 "mongosh plutomoney_quant --quiet --eval 'db.mfSchemeDataMonthwise.countDocuments()'"
   ```

---

## 🚀 Production Use

When Morningstar is configured (Phase 2), the cron job will automatically fetch data. But you can still use this API to:

1. **Manual data ingestion** (if Morningstar is down)
2. **Testing new data formats**
3. **Backfilling historical data**
4. **Admin operations**

---

## 🎯 Next Steps

Once you've tested the API:

1. ✅ Verify data is stored correctly in MongoDB
2. ✅ Test with different categories (Large Cap, Mid Cap, Debt, etc.)
3. ✅ Test with multiple months of data
4. ✅ Ready for Phase 2: Scoring Engine!

---

**Happy Testing! 🚀**

