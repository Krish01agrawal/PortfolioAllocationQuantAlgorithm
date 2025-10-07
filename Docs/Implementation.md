# PlutoMoney Quant - Step-by-Step Implementation Guide (NestJS)

## 🎯 Overview

This guide walks you through building the entire system from scratch using **NestJS + TypeScript + MongoDB**. Each step includes:
- **What** we're building
- **Why** it's designed this way
- **How** to implement it (with code examples)

---

## 📋 Prerequisites

### **System Requirements**
- Node.js 18+ (LTS recommended)
- MongoDB 7.0+ (local or Atlas)
- Git
- VS Code with TypeScript/NestJS extensions

### **MongoDB Atlas Setup** (Recommended)
1. Create free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Whitelist your IP address
3. Create database user (username + password)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/`

---

## 🏗️ Phase 1: Project Foundation (Week 1)

### **Step 1.1: Initialize NestJS Project**

```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create new project
nest new PlutoMoneyQuant
# Choose npm or yarn as package manager

cd PlutoMoneyQuant

# Initialize Git (if not already initialized)
git init
git branch -M main

# Create .gitignore (NestJS includes this by default, but verify)
cat > .gitignore << EOF
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.vscode/
*.swp
EOF
```

**Why NestJS?**  
- **TypeScript-first**: Type safety, better refactoring, IDE support
- **Modular architecture**: Perfect for scoring engine, portfolio construction as separate modules
- **Dependency Injection**: Cleaner code, easier testing
- **Decorators**: Clean API routes, validation, pipes

---

### **Step 1.2: Install Dependencies**

```bash
# Install core NestJS dependencies
npm install --save @nestjs/common @nestjs/core @nestjs/platform-express

# Install MongoDB (Mongoose)
npm install --save @nestjs/mongoose mongoose

# Install configuration
npm install --save @nestjs/config

# Install validation
npm install --save class-validator class-transformer

# Install utilities
npm install --save @nestjs/axios axios
npm install --save @nestjs/schedule  # For cron jobs
npm install --save lodash
npm install --save moment-timezone

# Install statistics library (for Z-scores)
npm install --save simple-statistics

# Install development dependencies
npm install --save-dev @types/node @types/lodash
npm install --save-dev @nestjs/testing
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

**Dependency breakdown**:
- **@nestjs/mongoose**: MongoDB integration with Mongoose ODM
- **class-validator**: DTO validation (like Pydantic)
- **@nestjs/schedule**: Cron jobs for monthly data ingestion/scoring
- **simple-statistics**: Statistical functions (mean, stddev, Z-scores)
- **@nestjs/axios**: HTTP client for BSE API integration

---

### **Step 1.3: Create NestJS Module Structure**

```bash
# NestJS uses a modular structure - generate modules using CLI

# Generate core modules
nest generate module config
nest generate module data-ingestion
nest generate module scoring-engine
nest generate module portfolio-construction
nest generate module bse-integration
nest generate module rebalancing

# Generate services
nest generate service data-ingestion
nest generate service scoring-engine/z-score-calculator
nest generate service scoring-engine/group-scorer
nest generate service scoring-engine/composite-scorer
nest generate service portfolio-construction/allocation-engine
nest generate service portfolio-construction/fund-selector

# Generate controllers
nest generate controller recommendation
nest generate controller portfolio
nest generate controller rebalancing

# Create additional directories
mkdir -p src/schemas
mkdir -p src/config/json
mkdir -p src/common/{decorators,filters,guards,utils}
mkdir -p test/unit test/integration test/fixtures
```

**Why NestJS CLI?**  
Automatically sets up boilerplate, updates module imports, follows best practices.

---

### **Step 1.4: Setup Environment Variables**

```bash
# Create .env file
cat > .env << EOF
# MongoDB
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/plutomoney_quant

# BSE Star MFD API
BSE_API_URL=https://bsestarmf.in/RTPService
BSE_MEMBER_CODE=12345
BSE_USER_ID=youruser
BSE_PASSWORD=yourpass

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# JWT Secret
JWT_SECRET=dev-secret-key-change-in-production

# Scheduler (Cron)
MONTHLY_INGESTION_DAY=1
MONTHLY_INGESTION_HOUR=6
EOF

# Create .env.example (for Git - no secrets)
cp .env .env.example
# Manually replace real values with placeholders
```

**Security note**: `.env` is in `.gitignore` (never commit secrets!).

---

### **Step 1.5: Database Configuration Module**

**File**: `src/config/database.config.ts`

```typescript
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const uri = configService.get<string>('MONGODB_URI');
  
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  return {
    uri,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority',
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
};
```

**File**: `src/config/config.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getDatabaseConfig } from './database.config';

@Module({
  imports: [
    // Load environment variables
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Setup MongoDB connection
    MongooseModule.forRootAsync({
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
  exports: [NestConfigModule, MongooseModule],
})
export class ConfigModule {}
```

**File**: `src/app.module.ts` (update root module)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DataIngestionModule } from './data-ingestion/data-ingestion.module';
import { ScoringEngineModule } from './scoring-engine/scoring-engine.module';
import { PortfolioConstructionModule } from './portfolio-construction/portfolio-construction.module';

@Module({
  imports: [
    ConfigModule,  // Import first for global config access
    DataIngestionModule,
    ScoringEngineModule,
    PortfolioConstructionModule,
  ],
})
export class AppModule {}
```

**Why MongooseModule.forRootAsync?**  
Allows injecting ConfigService to read environment variables before connecting.

**Why connection pool settings?**  
Optimizes concurrent requests, prevents connection exhaustion.

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

## 🗄️ Phase 2: Mongoose Schemas (Week 1)

### **Step 2.1: Mongoose Schema for Collection 1**

**File**: `src/schemas/mf-scheme-track-record.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Embedded subdocument for monthly data references
 */
@Schema({ _id: false })
export class SchemeMonthTrack {
  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'MfSchemeDataMonthwise' })
  mfDataId: Types.ObjectId;
}

export const SchemeMonthTrackSchema = SchemaFactory.createForClass(SchemeMonthTrack);

/**
 * Collection 1: Master fund registry
 * One document per fund (never deleted, only status changes)
 */
@Schema({ collection: 'mfSchemeTrackRecord', timestamps: true })
export class MfSchemeTrackRecord extends Document {
  @Prop({ required: true, index: true })
  fundName: string;

  @Prop({ required: true, index: true })
  amc: string;

  @Prop({ required: true, unique: true, index: true })
  schemeCode: string;

  @Prop()
  isin?: string;

  @Prop({ default: 'Regular', enum: ['Regular', 'Direct'] })
  plan: string;

  @Prop({ default: 'Growth', enum: ['Growth', 'IDCW'] })
  option: string;

  @Prop({ type: Date })
  inceptionDate?: Date;

  @Prop({ default: 'Active', enum: ['Active', 'Closed', 'Merged'] })
  status: string;

  @Prop({ type: [SchemeMonthTrackSchema], default: [] })
  schemeMonthTrackList: SchemeMonthTrack[];
}

export const MfSchemeTrackRecordSchema = SchemaFactory.createForClass(MfSchemeTrackRecord);

// Add indexes after schema creation
MfSchemeTrackRecordSchema.index({ fundName: 1 });
MfSchemeTrackRecordSchema.index({ amc: 1 });
MfSchemeTrackRecordSchema.index({ schemeCode: 1 }, { unique: true });
```

**Why Mongoose decorators?**  
- **@Schema()**: Defines MongoDB collection
- **@Prop()**: Defines field with type validation
- **SchemaFactory**: Generates Mongoose schema from class
- **Document**: Adds _id, timestamps, Mongoose methods

---

### **Step 2.2: Mongoose Schema for Collection 2**

**File**: `src/schemas/mf-scheme-data-monthwise.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Collection 2: Monthly snapshots of fund parameters
 * Grows monthly (1,800 docs/month)
 */
@Schema({ collection: 'mfSchemeDataMonthwise', timestamps: { createdAt: true, updatedAt: false } })
export class MfSchemeDataMonthwise extends Document {
  @Prop({ required: true, index: true, type: Date })
  timestamp: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'MfSchemeTrackRecord', index: true })
  fundId: Types.ObjectId;

  @Prop({ required: true })
  fundName: string;

  @Prop({ required: true, index: true })
  fundCategory: string;

  // A. Quantitative Parameters (17 metrics)
  @Prop({ type: Number })
  fiveYearCagrEquity?: number;

  @Prop({ type: Number })
  fiveYearCagrDebtHybrid?: number;

  @Prop({ type: Number })
  threeYearRollingConsistency?: number;

  @Prop({ type: Number })
  sharpeRatio?: number;

  @Prop({ type: Number })
  sortinoRatio?: number;

  @Prop({ type: Number })
  alpha?: number;

  @Prop({ type: Number })
  beta?: number;

  @Prop({ type: Number })
  stdDevEquity?: number;

  @Prop({ type: Number })
  stdDevDebtHybrid?: number;

  @Prop({ type: Number })
  maxDrawdown?: number;

  @Prop({ type: Number })
  recoveryPeriod?: number;

  @Prop({ type: Number })
  downsideCaptureRatio?: number;

  @Prop({ type: Number })
  expenseRatioEquity?: number;

  @Prop({ type: Number })
  expenseRatioDebt?: number;

  @Prop({ type: Number })
  aumEquity?: number;

  @Prop({ type: Number })
  aumDebt?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  liquidityRisk?: number;

  @Prop({ type: Number })
  portfolioTurnoverRatio?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  concentrationSectorFit?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  styleFit?: number;

  // B. Qualitative Parameters (5 metrics)
  @Prop({ type: Number, min: 1, max: 5 })
  fundHouseReputation?: number;

  @Prop({ type: Number })
  fundManagerTenure?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  fundManagerTrackRecord?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  amcRiskManagement?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  esgGovernance?: number;

  // C. Forward-Looking Parameters (5 metrics)
  @Prop({ type: Number, min: 1, max: 5 })
  benchmarkConsistency?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  peerComparison?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  taxEfficiency?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  fundInnovation?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  forwardRiskMitigation?: number;
}

export const MfSchemeDataMonthwiseSchema = SchemaFactory.createForClass(MfSchemeDataMonthwise);

// Compound indexes for common queries
MfSchemeDataMonthwiseSchema.index({ timestamp: -1, fundId: 1 });
MfSchemeDataMonthwiseSchema.index({ fundCategory: 1, timestamp: -1 });
```

**Why nullable fields (?):**  
Not all funds have all parameters (e.g., equity funds won't have debt metrics).

---

## 📊 Phase 3: Data Ingestion (Week 2)

### **Step 3.1: Morningstar JSON Parser Service**

**File**: `src/data-ingestion/dto/morningstar-fund.dto.ts`

```typescript
import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';

/**
 * DTO for validating Morningstar fund data
 */
export class MorningstarFundDto {
  @IsString()
  fundName: string;

  @IsString()
  fundCategory: string;

  @IsOptional()
  @IsNumber()
  fiveYearCagrEquity?: number;

  @IsOptional()
  @IsNumber()
  fiveYearCagrDebtHybrid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  threeYearRollingConsistency?: number;

  @IsOptional()
  @IsNumber()
  sharpeRatio?: number;

  @IsOptional()
  @IsNumber()
  sortinoRatio?: number;

  @IsOptional()
  @IsNumber()
  alpha?: number;

  @IsOptional()
  @IsNumber()
  beta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expenseRatioEquity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expenseRatioDebt?: number;

  // ... all 27 parameters with validation rules
}
```

**File**: `src/data-ingestion/morningstar-parser.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MorningstarFundDto } from './dto/morningstar-fund.dto';

@Injectable()
export class MorningstarParserService {
  private readonly logger = new Logger(MorningstarParserService.name);
  
  private readonly REQUIRED_FIELDS = [
    'fundName',
    'fundCategory',
    'sharpeRatio',
    'expenseRatioEquity',
  ];

  /**
   * Load and parse Morningstar JSON file
   */
  async parseJsonFile(filePath: string): Promise<MorningstarFundDto[]> {
    try {
      const rawData = JSON.parse(readFileSync(filePath, 'utf-8'));
      this.logger.log(`✅ Loaded ${rawData.length} schemes from ${filePath}`);
      
      const validatedFunds: MorningstarFundDto[] = [];
      const errors: string[] = [];

      for (const fund of rawData) {
        // Validate schema
        if (!this.validateSchema(fund)) {
          errors.push(`Fund '${fund.fundName || 'Unknown'}' missing required fields`);
          continue;
        }

        // Transform to DTO
        const fundDto = plainToClass(MorningstarFundDto, fund);
        
        // Validate with class-validator
        const validationErrors = await validate(fundDto);
        if (validationErrors.length > 0) {
          errors.push(`Fund '${fund.fundName}': ${validationErrors.map(e => e.toString()).join(', ')}`);
          continue;
        }

        // Detect outliers (log warnings, don't reject)
        this.detectOutliers(fundDto);
        
        validatedFunds.push(fundDto);
      }

      this.logger.log(`✅ Validated ${validatedFunds.length}/${rawData.length} schemes`);
      if (errors.length > 0) {
        this.logger.error(`❌ ${errors.length} validation errors:\n${errors.join('\n')}`);
      }

      return validatedFunds;
    } catch (error) {
      this.logger.error(`❌ Failed to parse JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate required fields are present
   */
  private validateSchema(fund: any): boolean {
    const missingFields = this.REQUIRED_FIELDS.filter(
      field => !(field in fund) || fund[field] === null || fund[field] === undefined
    );
    
    if (missingFields.length > 0) {
      this.logger.warn(`⚠️ Fund '${fund.fundName || 'Unknown'}' missing: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Detect outliers (log warnings, don't reject)
   */
  private detectOutliers(fund: MorningstarFundDto): void {
    const outliers: string[] = [];

    // CAGR sanity check (-50% to +100%)
    if (fund.fiveYearCagrEquity !== undefined) {
      if (fund.fiveYearCagrEquity < -50 || fund.fiveYearCagrEquity > 100) {
        outliers.push(`CAGR=${fund.fiveYearCagrEquity}% (unusual)`);
      }
    }

    // Expense ratio (0.1% to 3%)
    if (fund.expenseRatioEquity !== undefined) {
      if (fund.expenseRatioEquity < 0.1 || fund.expenseRatioEquity > 3) {
        outliers.push(`Expense=${fund.expenseRatioEquity}% (unusual)`);
      }
    }

    // AUM (must be positive)
    if (fund.aumEquity !== undefined) {
      if (fund.aumEquity <= 0) {
        outliers.push(`AUM=${fund.aumEquity} (negative?)`);
      }
    }

    if (outliers.length > 0) {
      this.logger.warn(`⚠️ Outliers in '${fund.fundName}': ${outliers.join(', ')}`);
    }
  }
}
```

**Explanation**:
- **class-validator**: Decorator-based validation (like Pydantic)
- **Schema validation**: Ensures critical fields exist
- **Outlier detection**: Flags suspicious values without rejecting
- **Logger**: Built-in NestJS logger (contextual logging)

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

### **Step 4.1: Z-Score Calculator Service**

**File**: `src/scoring-engine/z-score-calculator.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { mean, standardDeviation } from 'simple-statistics';
import { MfSchemeDataMonthwise } from '../schemas/mf-scheme-data-monthwise.schema';
import { readFileSync } from 'fs';
import { join } from 'path';

interface DirectionalityConfig {
  higherIsBetter: string[];
  lowerIsBetter: string[];
}

interface FundZScores {
  fundId: string;
  fundName: string;
  zScores: Record<string, number>;
  directionalValues: Record<string, number>;
}

@Injectable()
export class ZScoreCalculatorService {
  private readonly logger = new Logger(ZScoreCalculatorService.name);
  private directionalityConfig: DirectionalityConfig;

  constructor(
    @InjectModel(MfSchemeDataMonthwise.name)
    private mfSchemeDataModel: Model<MfSchemeDataMonthwise>,
  ) {
    // Load directionality config
    const configPath = join(process.cwd(), 'src/config/json/directionality.json');
    this.directionalityConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  }

  /**
   * Calculate Z-scores for all funds in a category
   */
  async calculateForCategory(
    categoryName: string,
    timestamp: Date,
  ): Promise<FundZScores[]> {
    // Fetch all funds in this category for this month
    const funds = await this.mfSchemeDataModel.find({
      timestamp,
      fundCategory: categoryName,
    }).lean();

    if (funds.length < 3) {
      this.logger.warn(`⚠️ Only ${funds.length} funds in '${categoryName}' - skipping Z-scores`);
      return [];
    }

    this.logger.log(`📊 Calculating Z-scores for ${funds.length} funds in '${categoryName}'`);

    // Get all parameter names (27 metrics)
    const paramNames = this.getAllParameters();
    
    const fundScores: FundZScores[] = [];

    // Calculate Z-scores for each parameter
    for (const param of paramNames) {
      const values: number[] = [];
      const fundIndices: number[] = [];

      // Extract values for this parameter across all funds
      funds.forEach((fund, index) => {
        const val = fund[param];
        if (val !== null && val !== undefined && !isNaN(val)) {
          // Apply directionality
          const directionalVal = this.applyDirectionality(param, val);
          values.push(directionalVal);
          fundIndices.push(index);
        }
      });

      // Need at least 2 values to calculate stddev
      if (values.length < 2) continue;

      // Calculate category statistics
      const categoryMean = mean(values);
      let categoryStddev = standardDeviation(values);

      // Handle zero stddev (all funds have same value)
      if (categoryStddev === 0) {
        this.logger.warn(`⚠️ All funds have same ${param} value in ${categoryName} (stddev=0)`);
        categoryStddev = 1.0; // Avoid division by zero
      }

      // Calculate Z-scores
      const zScores = values.map(v => (v - categoryMean) / categoryStddev);

      // Assign Z-scores back to funds
      fundIndices.forEach((fundIndex, i) => {
        if (!fundScores[fundIndex]) {
          fundScores[fundIndex] = {
            fundId: funds[fundIndex].fundId.toString(),
            fundName: funds[fundIndex].fundName,
            zScores: {},
            directionalValues: {},
          };
        }
        fundScores[fundIndex].zScores[param] = zScores[i];
        fundScores[fundIndex].directionalValues[param] = values[i];
      });
    }

    this.logger.log(`✅ Z-scores calculated for ${fundScores.length} funds in '${categoryName}'`);
    return fundScores.filter(f => f !== undefined);
  }

  /**
   * Apply directionality (invert lower-is-better metrics)
   */
  private applyDirectionality(param: string, value: number): number {
    if (this.directionalityConfig.lowerIsBetter.includes(param)) {
      return -value;
    }
    return value;
  }

  /**
   * Get all 27 parameter names
   */
  private getAllParameters(): string[] {
    return [
      ...this.directionalityConfig.higherIsBetter,
      ...this.directionalityConfig.lowerIsBetter,
    ];
  }
}
```

**Explanation**:
- **Directionality first**: Invert "lower is better" metrics before calculating mean/stddev
- **Handle missing values**: Skip nulls/undefined (not all funds have all metrics)
- **Sample stddev**: `simple-statistics` library handles this correctly
- **Edge case handling**: stddev=0 → set to 1.0 to avoid division by zero

---

**Note**: Phases 5-8 (Portfolio Construction, BSE Integration, Rebalancing, REST API) will follow the same NestJS patterns:
- Services with dependency injection
- DTOs for validation
- Mongoose models for data persistence
- Logger for observability
- Type safety throughout

The core algorithm logic remains the same; only the syntax/framework changes from Python to TypeScript/NestJS.

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

