# PlutoMoney Quant - Step-by-Step Implementation Guide

## 🎯 Overview

This guide walks you through building the entire system from scratch. Each step includes:
- **What** we're building
- **Why** it's designed this way
- **How** to implement it (with code examples)

---

## 📋 Prerequisites

### **System Requirements**
- Python 3.11+
- MongoDB 7.0+ (local or Atlas)
- Git
- VS Code with Python extension

### **MongoDB Atlas Setup** (Recommended)
1. Create free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Whitelist your IP address
3. Create database user (username + password)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/`

---

## 🏗️ Phase 1: Project Foundation (Week 1)

### **Step 1.1: Initialize Project**

```bash
# Create project directory
mkdir PlutoMoneyQuant
cd PlutoMoneyQuant

# Initialize Git
git init
git branch -M main

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create .gitignore
cat > .gitignore << EOF
venv/
__pycache__/
*.pyc
.env
.DS_Store
*.log
.pytest_cache/
.coverage
htmlcov/
EOF
```

**Why virtual environment?**  
Isolates dependencies from your system Python, prevents version conflicts.

---

### **Step 1.2: Install Dependencies**

```bash
# Create requirements.txt
cat > requirements.txt << EOF
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
motor==3.3.2              # Async MongoDB driver
pymongo==4.6.1            # Sync MongoDB driver (for scripts)

# Data Processing
pandas==2.2.0
numpy==1.26.3
scipy==1.12.0

# HTTP Client
httpx==0.26.0

# Scheduling
apscheduler==3.10.4

# Utilities
python-dotenv==1.0.0
loguru==0.7.2
python-jose[cryptography]==3.3.0  # JWT tokens
passlib[bcrypt]==1.7.4            # Password hashing

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0
faker==22.0.0             # Generate test data

# Development
black==24.1.1             # Code formatter
ruff==0.1.14              # Linter
ipython==8.20.0
ipykernel==6.29.0         # For Jupyter notebooks
EOF

# Install all dependencies
pip install -r requirements.txt
```

**Dependency breakdown**:
- **FastAPI**: Modern, fast web framework (async support)
- **Motor**: Async MongoDB driver (non-blocking DB queries)
- **Pandas/NumPy**: Z-score calculations, data manipulation
- **APScheduler**: Monthly cron jobs (data ingestion + scoring)

---

### **Step 1.3: Create Directory Structure**

```bash
mkdir -p src/{config,models,data_ingestion,scoring_engine,portfolio_construction,bse_integration,rebalancing,api/{routes,middleware},utils}
mkdir -p scripts tests/{unit,integration,fixtures} notebooks Docs .cursor/rules
```

---

### **Step 1.4: Setup Environment Variables**

```bash
# Create .env file
cat > .env << EOF
# MongoDB
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/
MONGODB_DATABASE=plutomoney_quant

# BSE Star MFD API (get credentials from BSE)
BSE_API_URL=https://bsestarmf.in/RTPService
BSE_MEMBER_CODE=12345
BSE_USER_ID=youruser
BSE_PASSWORD=yourpass

# Application
ENV=development
LOG_LEVEL=DEBUG
SECRET_KEY=dev-secret-key-change-in-production

# Scheduler
MONTHLY_INGESTION_DAY=1
MONTHLY_INGESTION_HOUR=6
EOF

# Create .env.example (for Git - no secrets)
cp .env .env.example
# Manually replace real values with placeholders in .env.example
```

**Security note**: `.env` is in `.gitignore` (never commit secrets!).

---

### **Step 1.5: Database Connection**

**File**: `src/config/database.py`

```python
"""
MongoDB connection using Motor (async driver).
Singleton pattern ensures one connection pool for entire app.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """
    Environment variables loaded from .env file.
    Pydantic validates types and provides defaults.
    """
    mongodb_uri: str
    mongodb_database: str
    env: str = "development"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Async client for FastAPI routes
async_client: AsyncIOMotorClient = None
async_db: AsyncIOMotorDatabase = None

# Sync client for scripts (monthly ingestion)
sync_client: MongoClient = None
sync_db = None

async def connect_db():
    """
    Initialize async MongoDB connection.
    Called once on FastAPI startup.
    """
    global async_client, async_db
    async_client = AsyncIOMotorClient(settings.mongodb_uri)
    async_db = async_client[settings.mongodb_database]
    print(f"✅ Connected to MongoDB: {settings.mongodb_database}")

async def close_db():
    """
    Close MongoDB connection pool.
    Called on FastAPI shutdown.
    """
    global async_client
    if async_client:
        async_client.close()
        print("❌ Closed MongoDB connection")

def get_sync_db():
    """
    Get synchronous MongoDB connection.
    Used in scheduled scripts (APScheduler).
    """
    global sync_client, sync_db
    if not sync_client:
        sync_client = MongoClient(settings.mongodb_uri)
        sync_db = sync_client[settings.mongodb_database]
    return sync_db

# Helper to get async database instance
def get_db() -> AsyncIOMotorDatabase:
    return async_db
```

**Why async?**  
FastAPI is async-first. Async DB queries free up the server to handle other requests while waiting for MongoDB.

**Why sync client too?**  
APScheduler runs in background threads. Motor (async) doesn't play well with threads; use `pymongo` (sync) instead.

---

### **Step 1.6: Configuration Files**

#### **A. Directionality Config**

**File**: `src/config/directionality.json`

```json
{
  "higher_is_better": [
    "five_year_cagr_equity",
    "five_year_cagr_debt_hybrid",
    "three_year_rolling_consistency",
    "sharpe_ratio",
    "sortino_ratio",
    "alpha",
    "aum_equity",
    "aum_debt",
    "fund_house_reputation",
    "fund_manager_tenure",
    "fund_manager_track_record",
    "amc_risk_management",
    "esg_governance",
    "benchmark_consistency",
    "peer_comparison",
    "tax_efficiency",
    "fund_innovation",
    "forward_risk_mitigation"
  ],
  "lower_is_better": [
    "beta",
    "std_dev_equity",
    "std_dev_debt_hybrid",
    "max_drawdown",
    "recovery_period",
    "downside_capture_ratio",
    "expense_ratio_equity",
    "expense_ratio_debt",
    "liquidity_risk",
    "portfolio_turnover_ratio",
    "concentration_sector_fit"
  ],
  "special_handling": {
    "style_fit": "higher_is_better_comment: 5=perfect match, 1=drift"
  }
}
```

**Explanation**:
- **Higher is better**: More = stronger performance (CAGR, Sharpe, Alpha)
- **Lower is better**: Less = lower risk/cost (Beta, Expense, Drawdown)
- We'll multiply `lower_is_better` params by -1 before Z-scoring

---

#### **B. Weightage Config**

**File**: `src/config/weightage.json`

```json
{
  "Aggressive Explorer": {
    "returns_growth": 0.25,
    "risk_adjusted": 0.15,
    "volatility_drawdown": 0.10,
    "expense_aum": 0.10,
    "downside_liquidity": 0.05,
    "fund_house_mgr": 0.10,
    "discipline_turnover": 0.10,
    "esg_forward": 0.15
  },
  "Balanced Achiever": {
    "returns_growth": 0.20,
    "risk_adjusted": 0.15,
    "volatility_drawdown": 0.15,
    "expense_aum": 0.10,
    "downside_liquidity": 0.10,
    "fund_house_mgr": 0.10,
    "discipline_turnover": 0.10,
    "esg_forward": 0.10
  },
  "Conservative Guardian": {
    "returns_growth": 0.15,
    "risk_adjusted": 0.10,
    "volatility_drawdown": 0.15,
    "expense_aum": 0.15,
    "downside_liquidity": 0.15,
    "fund_house_mgr": 0.15,
    "discipline_turnover": 0.10,
    "esg_forward": 0.05
  },
  "Safety Seeker": {
    "returns_growth": 0.10,
    "risk_adjusted": 0.10,
    "volatility_drawdown": 0.20,
    "expense_aum": 0.20,
    "downside_liquidity": 0.15,
    "fund_house_mgr": 0.10,
    "discipline_turnover": 0.10,
    "esg_forward": 0.05
  },
  "parameter_groups": {
    "returns_growth": [
      "five_year_cagr_equity",
      "five_year_cagr_debt_hybrid",
      "three_year_rolling_consistency"
    ],
    "risk_adjusted": [
      "sharpe_ratio",
      "sortino_ratio",
      "alpha",
      "beta"
    ],
    "volatility_drawdown": [
      "std_dev_equity",
      "std_dev_debt_hybrid",
      "max_drawdown",
      "recovery_period"
    ],
    "expense_aum": [
      "expense_ratio_equity",
      "expense_ratio_debt",
      "aum_equity",
      "aum_debt"
    ],
    "downside_liquidity": [
      "downside_capture_ratio",
      "liquidity_risk"
    ],
    "fund_house_mgr": [
      "fund_house_reputation",
      "fund_manager_tenure",
      "fund_manager_track_record",
      "amc_risk_management"
    ],
    "discipline_turnover": [
      "portfolio_turnover_ratio",
      "concentration_sector_fit",
      "style_fit"
    ],
    "esg_forward": [
      "esg_governance",
      "benchmark_consistency",
      "peer_comparison",
      "tax_efficiency",
      "fund_innovation",
      "forward_risk_mitigation"
    ]
  }
}
```

**Explanation**:
- Each risk profile has different priorities
- `parameter_groups` maps parameters to 8 groups (used by `group_scorer.py`)

---

#### **C. Allocation Matrix** (Partial - see full version in PRD.md)

**File**: `src/config/allocation_matrix.json`

```json
{
  "Safety Seeker": {
    "Micro": {
      "Large Cap": { "percentage": 0.0, "num_schemes": 0 },
      "Mid Cap": { "percentage": 0.0, "num_schemes": 0 },
      "Hybrid – Conservative": { "percentage": 1.0, "num_schemes": 1 }
    },
    "Ultra-Small": {
      "Hybrid – Conservative": { "percentage": 0.60, "num_schemes": 1 },
      "Debt – Corporate": { "percentage": 0.20, "num_schemes": 1 },
      "Debt – Short/Ultra Short": { "percentage": 0.20, "num_schemes": 1 }
    }
  },
  "Balanced Achiever": {
    "Moderate": {
      "Large Cap": { "percentage": 0.20, "num_schemes": 1 },
      "Mid Cap": { "percentage": 0.15, "num_schemes": 1 },
      "Small Cap": { "percentage": 0.10, "num_schemes": 1 },
      "Flexi-Cap / MultiCap": { "percentage": 0.10, "num_schemes": 1 },
      "Index / ETF": { "percentage": 0.05, "num_schemes": 1 },
      "International": { "percentage": 0.05, "num_schemes": 1 },
      "Hybrid – Equity-Oriented": { "percentage": 0.15, "num_schemes": 1 },
      "Debt – Corporate": { "percentage": 0.10, "num_schemes": 1 },
      "Debt – Short/Ultra Short": { "percentage": 0.05, "num_schemes": 1 },
      "Debt – Banking / PSU": { "percentage": 0.05, "num_schemes": 1 }
    }
  }
}
```

*(Add all risk profiles × SIP buckets from your Excel images)*

---

## 🗄️ Phase 2: Data Models (Week 1)

### **Step 2.1: Pydantic Models**

**File**: `src/models/mf_scheme_track_record.py`

```python
"""
Pydantic model for Collection 1: mf_scheme_track_record
Validates data structure before inserting into MongoDB.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    """
    Custom type for MongoDB ObjectId in Pydantic.
    Allows auto-generation of IDs.
    """
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {'type': 'string'}

class SchemeMonthTrack(BaseModel):
    """Embedded document: Reference to monthly data snapshot"""
    timestamp: datetime
    mfDataId: PyObjectId

class MFSchemeTrackRecord(BaseModel):
    """
    Master fund registry.
    Each fund has one document here (never deleted, only status changes).
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    fund_name: str
    amc: str
    scheme_code: str  # BSE/AMFI scheme code
    isin: Optional[str] = None
    plan: str = "Regular"  # Regular | Direct
    option: str = "Growth"  # Growth | IDCW
    inception_date: Optional[datetime] = None
    status: str = "Active"  # Active | Closed | Merged
    schemeMonthTrackList: List[SchemeMonthTrack] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Similar models for Collection 2, 3, 4...
```

**Why Pydantic?**  
- Type validation (catches errors before DB insertion)
- Auto-documentation (FastAPI generates OpenAPI schema)
- JSON serialization (ObjectId → string)

---

*(Continue with models for Collections 2, 3, 4 - similar structure)*

---

## 📊 Phase 3: Data Ingestion (Week 2)

### **Step 3.1: Morningstar JSON Parser**

**File**: `src/data_ingestion/morningstar_parser.py`

```python
"""
Parse Morningstar JSON feed and validate data quality.
Handles missing values, outliers, and schema mismatches.
"""

import json
from typing import List, Dict, Any
from datetime import datetime
from loguru import logger

class MorningstarParser:
    """
    Validates and normalizes Morningstar JSON data.
    """
    
    REQUIRED_FIELDS = [
        "fund_name",
        "fund_category",
        "five_year_cagr_equity",  # At least one CAGR required
        "sharpe_ratio",
        "expense_ratio_equity"
    ]
    
    def __init__(self, json_path: str):
        self.json_path = json_path
        self.raw_data = []
        self.validated_data = []
        self.errors = []
    
    def load_json(self) -> List[Dict[str, Any]]:
        """Load JSON file from path"""
        try:
            with open(self.json_path, 'r') as f:
                self.raw_data = json.load(f)
            logger.info(f"✅ Loaded {len(self.raw_data)} schemes from {self.json_path}")
            return self.raw_data
        except FileNotFoundError:
            logger.error(f"❌ File not found: {self.json_path}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON: {e}")
            raise
    
    def validate_schema(self, fund_data: Dict[str, Any]) -> bool:
        """
        Check if fund has minimum required fields.
        Missing optional fields are allowed (will be null in DB).
        """
        missing_fields = []
        for field in self.REQUIRED_FIELDS:
            # Check if field exists AND is not null
            if field not in fund_data or fund_data[field] is None:
                missing_fields.append(field)
        
        if missing_fields:
            error = f"Fund '{fund_data.get('fund_name', 'Unknown')}' missing: {missing_fields}"
            self.errors.append(error)
            logger.warning(f"⚠️ {error}")
            return False
        
        return True
    
    def detect_outliers(self, fund_data: Dict[str, Any]) -> bool:
        """
        Flag suspicious values (e.g., CAGR > 100%, negative AUM).
        Don't reject, just log warnings.
        """
        outliers = []
        
        # CAGR sanity check (-50% to +100%)
        if fund_data.get("five_year_cagr_equity"):
            cagr = fund_data["five_year_cagr_equity"]
            if cagr < -50 or cagr > 100:
                outliers.append(f"CAGR={cagr}% (unusual)")
        
        # Expense ratio (0.1% to 3%)
        if fund_data.get("expense_ratio_equity"):
            er = fund_data["expense_ratio_equity"]
            if er < 0.1 or er > 3:
                outliers.append(f"Expense={er}% (unusual)")
        
        # AUM (must be positive)
        if fund_data.get("aum_equity"):
            aum = fund_data["aum_equity"]
            if aum <= 0:
                outliers.append(f"AUM={aum} (negative?)")
        
        if outliers:
            logger.warning(f"⚠️ Outliers in '{fund_data['fund_name']}': {outliers}")
        
        return len(outliers) == 0
    
    def parse(self) -> List[Dict[str, Any]]:
        """
        Main parsing function.
        Returns list of validated fund data.
        """
        self.load_json()
        
        for idx, fund in enumerate(self.raw_data):
            # Skip if validation fails
            if not self.validate_schema(fund):
                continue
            
            # Detect outliers (but don't reject)
            self.detect_outliers(fund)
            
            # Add metadata
            fund['parsed_at'] = datetime.utcnow()
            fund['data_source'] = 'Morningstar'
            
            self.validated_data.append(fund)
        
        logger.info(f"✅ Validated {len(self.validated_data)}/{len(self.raw_data)} schemes")
        if self.errors:
            logger.error(f"❌ {len(self.errors)} validation errors")
        
        return self.validated_data

# Usage example:
# parser = MorningstarParser("data/morningstar_oct2025.json")
# valid_funds = parser.parse()
```

**Explanation**:
- **Schema validation**: Ensures critical fields exist (fund_name, CAGR, expense ratio)
- **Outlier detection**: Flags suspicious values without rejecting them
- **Error logging**: Tracks which funds failed validation

---

### **Step 3.2: Data Loader (Insert into DB)**

**File**: `src/data_ingestion/data_loader.py`

```python
"""
Load validated Morningstar data into MongoDB Collections 1 & 2.
Handles upserts (new funds) and monthly snapshots.
"""

from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
from src.config.database import get_sync_db
from loguru import logger

class DataLoader:
    """
    Inserts Morningstar data into mf_scheme_track_record and mf_scheme_data_monthwise.
    """
    
    def __init__(self, timestamp: datetime):
        self.db = get_sync_db()
        self.timestamp = timestamp  # Month of data (e.g., 2025-10-01)
        self.collection1 = self.db["mf_scheme_track_record"]
        self.collection2 = self.db["mf_scheme_data_monthwise"]
    
    def load_fund_data(self, validated_funds: List[Dict[str, Any]]):
        """
        Main loading function.
        For each fund:
          1. Upsert Collection 1 (if new fund)
          2. Insert into Collection 2 (new monthly snapshot)
          3. Update schemeMonthTrackList reference
        """
        for fund_data in validated_funds:
            try:
                # Step 1: Get or create fund in Collection 1
                fund_id = self._upsert_fund_master(fund_data)
                
                # Step 2: Insert monthly snapshot into Collection 2
                snapshot_id = self._insert_monthly_snapshot(fund_id, fund_data)
                
                # Step 3: Update Collection 1 with reference to snapshot
                self._update_track_list(fund_id, snapshot_id)
                
                logger.debug(f"✅ Loaded: {fund_data['fund_name']}")
            
            except Exception as e:
                logger.error(f"❌ Failed to load {fund_data.get('fund_name', 'Unknown')}: {e}")
        
        logger.info(f"🎉 Loaded {len(validated_funds)} funds for {self.timestamp}")
    
    def _upsert_fund_master(self, fund_data: Dict[str, Any]) -> ObjectId:
        """
        Insert fund into Collection 1 if new, or return existing _id.
        """
        existing = self.collection1.find_one({"fund_name": fund_data["fund_name"]})
        
        if existing:
            return existing["_id"]
        
        # New fund - insert
        new_fund = {
            "fund_name": fund_data["fund_name"],
            "amc": fund_data.get("amc", "Unknown AMC"),
            "scheme_code": fund_data.get("scheme_code", ""),
            "plan": "Regular",  # Default
            "option": "Growth",
            "status": "Active",
            "schemeMonthTrackList": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = self.collection1.insert_one(new_fund)
        logger.info(f"🆕 New fund added: {fund_data['fund_name']}")
        return result.inserted_id
    
    def _insert_monthly_snapshot(self, fund_id: ObjectId, fund_data: Dict[str, Any]) -> ObjectId:
        """
        Insert all 27 parameters into Collection 2.
        """
        snapshot = {
            "timestamp": self.timestamp,
            "fundId": fund_id,
            "fund_name": fund_data["fund_name"],
            "fund_category": fund_data["fund_category"],
            
            # Copy all 27 parameters from Morningstar JSON
            **{k: v for k, v in fund_data.items() 
               if k not in ["fund_name", "fund_category", "parsed_at", "data_source"]},
            
            "created_at": datetime.utcnow()
        }
        
        result = self.collection2.insert_one(snapshot)
        return result.inserted_id
    
    def _update_track_list(self, fund_id: ObjectId, snapshot_id: ObjectId):
        """
        Add reference to new snapshot in Collection 1's schemeMonthTrackList.
        """
        self.collection1.update_one(
            {"_id": fund_id},
            {
                "$push": {
                    "schemeMonthTrackList": {
                        "timestamp": self.timestamp,
                        "mfDataId": snapshot_id
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

# Usage example:
# from src.data_ingestion.morningstar_parser import MorningstarParser
# parser = MorningstarParser("data/morningstar_oct2025.json")
# valid_funds = parser.parse()
# 
# loader = DataLoader(timestamp=datetime(2025, 10, 1))
# loader.load_fund_data(valid_funds)
```

**Key Design Decisions**:
1. **Upsert logic**: Prevents duplicate funds in Collection 1
2. **Timestamp parameter**: Allows historical data loading (backfill)
3. **Sync driver**: `get_sync_db()` for use in scheduled scripts

---

## 🧮 Phase 4: Scoring Engine (Weeks 3-4)

### **Step 4.1: Z-Score Calculator**

**File**: `src/scoring_engine/z_score_calculator.py`

```python
"""
Calculate Z-scores for all funds within each category.
Z-Score = (value - category_mean) / category_stddev

This normalizes different metrics (CAGR %, Sharpe ratio, expense %)
so they can be compared apples-to-apples.
"""

import json
from typing import Dict, List
from datetime import datetime
import numpy as np
from src.config.database import get_sync_db
from loguru import logger

class ZScoreCalculator:
    """
    Computes Z-scores per category per month.
    """
    
    def __init__(self, timestamp: datetime):
        self.db = get_sync_db()
        self.timestamp = timestamp
        self.collection2 = self.db["mf_scheme_data_monthwise"]
        
        # Load directionality config
        with open("src/config/directionality.json", "r") as f:
            self.directionality = json.load(f)
    
    def calculate_for_category(self, category_name: str) -> List[Dict]:
        """
        Calculate Z-scores for all funds in a category.
        
        Returns:
            List of dicts with fund_id, z_scores{}, directional_values{}
        """
        # Fetch all funds in this category for this month
        funds = list(self.collection2.find({
            "timestamp": self.timestamp,
            "fund_category": category_name
        }))
        
        if len(funds) < 3:
            logger.warning(f"⚠️ Only {len(funds)} funds in '{category_name}' - skipping Z-scores")
            return []
        
        logger.info(f"📊 Calculating Z-scores for {len(funds)} funds in '{category_name}'")
        
        # Get all parameter names (27 metrics)
        param_names = self._get_all_parameters()
        
        # Store results
        fund_scores = []
        
        for param in param_names:
            # Step 1: Extract values for this parameter across all funds
            values = []
            fund_indices = []  # Track which fund each value belongs to
            
            for idx, fund in enumerate(funds):
                val = fund.get(param)
                if val is not None and not np.isnan(val):
                    # Apply directionality
                    directional_val = self._apply_directionality(param, val)
                    values.append(directional_val)
                    fund_indices.append(idx)
            
            # Step 2: Calculate category statistics
            if len(values) < 2:
                continue  # Can't calculate stddev with <2 values
            
            category_mean = np.mean(values)
            category_stddev = np.std(values, ddof=1)  # Sample stddev
            
            # Handle zero stddev (all funds have same value)
            if category_stddev == 0:
                category_stddev = 1.0  # Avoid division by zero
            
            # Step 3: Calculate Z-scores
            z_scores = [(v - category_mean) / category_stddev for v in values]
            
            # Step 4: Assign Z-scores back to funds
            for fund_idx, z_score in zip(fund_indices, z_scores):
                if fund_idx >= len(fund_scores):
                    # Initialize dict for this fund
                    fund_scores.append({
                        "fund_id": funds[fund_idx]["fundId"],
                        "fund_name": funds[fund_idx]["fund_name"],
                        "z_scores": {},
                        "directional_values": {}
                    })
                
                fund_scores[fund_idx]["z_scores"][param] = z_score
                fund_scores[fund_idx]["directional_values"][param] = values[z_scores.index(z_score)]
        
        logger.info(f"✅ Z-scores calculated for {len(fund_scores)} funds in '{category_name}'")
        return fund_scores
    
    def _apply_directionality(self, param: str, value: float) -> float:
        """
        Invert value if parameter is 'lower is better'.
        E.g., expense_ratio=0.5 becomes -0.5
        """
        if param in self.directionality["lower_is_better"]:
            return -value
        return value
    
    def _get_all_parameters(self) -> List[str]:
        """Return list of all 27 parameter names"""
        return (
            self.directionality["higher_is_better"] +
            self.directionality["lower_is_better"]
        )

# Usage example:
# calculator = ZScoreCalculator(timestamp=datetime(2025, 10, 1))
# large_cap_scores = calculator.calculate_for_category("Large Cap Equity")
```

**Explanation**:
- **Directionality first**: Invert "lower is better" metrics before calculating mean/stddev
- **Handle missing values**: Skip nulls (not all funds have all metrics)
- **Sample stddev**: Use `ddof=1` for unbiased estimator

---

*(Continue with Step 4.2 Group Scorer, 4.3 Composite Scorer, 4.4 Ranker...)*

---

## 📌 **TO BE CONTINUED**

This implementation guide continues with:
- **Phase 5**: Portfolio Construction
- **Phase 6**: BSE Integration
- **Phase 7**: Rebalancing Engine
- **Phase 8**: FastAPI REST API
- **Phase 9**: Testing & Deployment

Each phase follows the same detailed format with:
- Code examples
- Explanations of design decisions
- Usage examples

---

**Next Steps for YOU**:
1. Review Steps 1-4 above
2. Ask questions about any confusing parts
3. I'll continue with remaining phases once you confirm understanding

**Key Takeaway**:
Every line of code has a **WHY** - understanding the reasoning makes you a better engineer, not just a code copier. 🚀

