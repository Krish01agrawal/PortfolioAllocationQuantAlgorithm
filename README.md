# 🚀 PlutoMoney Quant - AI-Powered Portfolio Allocation System

**Built with NestJS + TypeScript + MongoDB**

**Intelligent, Risk-Adjusted Mutual Fund Recommendations Using Quantitative Scoring**

---

## 📖 Overview

PlutoMoney Quant is a sophisticated portfolio allocation algorithm that recommends personalized mutual fund portfolios by:

1. **Scoring 1,800+ funds monthly** using 27 quantitative & qualitative parameters
2. **Normalizing scores within categories** (Large Cap funds compete only with Large Cap peers)
3. **Weighting parameters by risk profile** (Safety Seeker vs Aggressive Explorer)
4. **Constructing diversified portfolios** based on SIP amount and risk tolerance
5. **Rebalancing monthly** to maintain optimal allocation

**Tech Stack**: NestJS, TypeScript, MongoDB (Mongoose), simple-statistics, class-validator

---

## 🎯 Key Features

✅ **Category-Normalized Scoring**: Z-score normalization ensures fair comparisons  
✅ **Risk-Profile Weighted**: Different weightage for Safety Seeker vs Aggressive Explorer  
✅ **Time-Series Architecture**: Track historical performance & rank changes  
✅ **Constraint-Aware**: Respects SIP minimums, AMC diversification, exit loads  
✅ **BSE Star MFD Integration**: Direct SIP registration via API  
✅ **SEBI Compliant**: Riskometer alignment, suitability documentation  

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MONTHLY DATA FLOW                        │
└─────────────────────────────────────────────────────────────┘

Day 1: Morningstar JSON (1,800 schemes)
   ↓
Parse & Validate (morningstar_parser.py)
   ↓
Store in MongoDB (Collection 1 & 2)
   ↓
Z-Score Calculation per Category (z_score_calculator.py)
   ↓
Group Scoring (8 parameter groups)
   ↓
Composite Scoring (risk-profile weighted)
   ↓
Ranking (1, 2, 3... per category)
   ↓
Store Scores (Collection 3 & 4)

On-Demand: User Request (Risk Profile + SIP Amount)
   ↓
Lookup Allocation Matrix (allocation_engine.py)
   ↓
Select Top-N Funds per Category (fund_selector.py)
   ↓
Apply Constraints (SIP minimums, AMC diversity)
   ↓
Generate Trade List (trade_generator.py)
   ↓
Submit to BSE Star MFD (bse_client.py)
```

---

## 🗄️ Database Schema (MongoDB)

### 4 Core Collections

| Collection | Purpose | Growth |
|------------|---------|--------|
| `mf_scheme_track_record` | Master fund registry | Slow (~50/year) |
| `mf_scheme_data_monthwise` | Time-series raw data | Fast (1,800/month) |
| `category_score` | Category master list | Static (12 categories) |
| `mf_scores` | Time-series scored funds | Medium (12/month) |

**Design Philosophy**: Separate raw data from computed scores, use references for historical tracking.

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB 7.0+ (Atlas recommended)
- Git
- npm or yarn

### 2. Clone & Setup

```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Clone repository (or create new project)
git clone https://github.com/yourorg/plutomoney-quant.git
cd PlutoMoneyQuant

# Or create new project
# nest new PlutoMoneyQuant

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, BSE credentials
```

### 3. Install Project Dependencies

```bash
# Core dependencies
npm install @nestjs/mongoose mongoose
npm install @nestjs/config
npm install class-validator class-transformer
npm install simple-statistics
npm install @nestjs/axios axios
npm install @nestjs/schedule

# Dev dependencies
npm install --save-dev @types/node
npm install --save-dev @nestjs/testing
```

### 4. Run Development Server

```bash
# Start in development mode (hot reload)
npm run start:dev

# Visit http://localhost:3000/api for API
```

### 5. Run Monthly Data Ingestion (Scripts)

```bash
# Parse Morningstar JSON and load into DB
npm run script:ingest -- --file data/morningstar_oct2025.json --timestamp 2025-10-01
```

### 6. Run Scoring Engine

```bash
# Calculate scores for all categories and risk profiles
npm run script:score -- --timestamp 2025-10-01
```

### 7. Access API Documentation

```bash
# Swagger UI available at:
# http://localhost:3000/api/docs
```

---

## 📊 API Endpoints

### POST `/api/recommend`

**Request**:
```json
{
  "risk_profile": "Balanced Achiever",
  "monthly_sip": 25000
}
```

**Response**:
```json
{
  "success": true,
  "portfolio": {
    "funds": [
      {
        "fund_name": "Axis Bluechip Fund",
        "category": "Large Cap",
        "sip_amount": 5000,
        "composite_score": 1.56,
        "rank": 1,
        "why_recommended": "High alpha (2.3), Low beta (0.88), Consistent returns"
      }
      // ... 9 more funds
    ],
    "total_allocated": 25000,
    "asset_mix": {
      "equity": 17500,
      "debt": 7500
    }
  }
}
```

---

### GET `/api/portfolio/{user_id}`

Retrieve existing portfolio for a user.

---

### GET `/api/rebalancing/{user_id}`

Get monthly rebalancing recommendations (fund switches).

---

## 🧮 Scoring Algorithm (Simplified)

### Step 1: Directional Adjustment
```python
# Higher is better → use as-is
# Lower is better → multiply by -1
directional_value = raw_value if param in higher_is_better else -raw_value
```

### Step 2: Z-Score Normalization (Per Category)
```python
category_mean = mean(all_large_cap_funds[param])
category_stddev = stddev(all_large_cap_funds[param])

z_score = (fund[param] - category_mean) / category_stddev
```

### Step 3: Group Scoring (8 Groups)
```python
# Example: Returns & Growth group
group_score = average([
    z_score['five_year_cagr_equity'],
    z_score['five_year_cagr_debt_hybrid'],
    z_score['three_year_rolling_consistency']
])
```

### Step 4: Composite Score (Risk-Weighted)
```python
# Aggressive Explorer weights
composite_score = (
    group_scores['returns_growth'] * 0.25 +
    group_scores['risk_adjusted'] * 0.15 +
    group_scores['volatility_drawdown'] * 0.10 +
    # ... 5 more groups
)
```

### Step 5: Ranking
```python
# Sort by composite_score DESC within category
funds_ranked = sorted(large_cap_funds, key=lambda f: f.composite_score, reverse=True)
```

---

## 📁 Project Structure

```
PlutoMoneyQuant/
├── .cursor/rules/          # Cursor AI context engineering
├── Docs/                   # Comprehensive documentation
│   ├── Project_structure.md
│   ├── Implementation.md
│   ├── Bug_tracking.md
│   └── UI_UX_doc.md
├── src/
│   ├── config/             # JSON configs (allocation matrix, directionality, weightage)
│   ├── models/             # Pydantic models for MongoDB collections
│   ├── data_ingestion/     # Morningstar JSON parser & loader
│   ├── scoring_engine/     # Z-score, group scorer, composite scorer
│   ├── portfolio_construction/  # Allocation engine, fund selector, constraints
│   ├── bse_integration/    # BSE Star MFD API client
│   ├── rebalancing/        # Monthly rebalancing logic
│   ├── api/                # FastAPI REST endpoints
│   └── utils/              # Logging, date utils, explanation generator
├── scripts/                # Monthly cron jobs (ingestion, scoring)
├── tests/                  # Unit & integration tests
├── notebooks/              # Jupyter notebooks (exploration)
├── PRD.md                  # Product Requirements Document
├── generate.mdc            # Code generation guidelines
├── workflow.mdc            # Git workflow & CI/CD
└── README.md               # This file
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

### Coverage Report

```bash
# Coverage report generated in /coverage directory
# Open coverage/lcov-report/index.html in browser
```

**Target**: ≥80% coverage on all modules

---

## 📚 Documentation

### Deep Dive Guides

1. **[PRD.md](PRD.md)**: Product requirements, algorithm explanation, success metrics
2. **[Docs/Project_structure.md](Docs/Project_structure.md)**: Architecture, tech stack, deployment
3. **[Docs/Implementation.md](Docs/Implementation.md)**: Step-by-step implementation guide
4. **[Docs/Bug_tracking.md](Docs/Bug_tracking.md)**: Known issues, debugging checklists
5. **[Docs/UI_UX_doc.md](Docs/UI_UX_doc.md)**: Design system, wireframes, user flows

### Context Engineering (Cursor AI)

The `.cursor/rules/` directory contains deep context for AI assistance:

- **scoring_context.mdc**: Z-score calculation, group scoring, ranking logic
- **schema_context.mdc**: Database collections, indexes, query patterns
- **allocation_context.mdc**: Allocation matrix, portfolio construction, constraints

These files help Cursor AI understand the project deeply when you ask questions or request code changes.

---

## 🔧 Configuration Files

### `src/config/allocation_matrix.json`

Maps (Risk Profile × SIP Bucket) → (% per category + # of funds).

Example:
```json
{
  "Balanced Achiever": {
    "Moderate": {
      "Large Cap": { "percentage": 0.20, "num_schemes": 1 },
      "Mid Cap": { "percentage": 0.15, "num_schemes": 1 },
      ...
    }
  }
}
```

### `src/config/directionality.json`

Defines which parameters are "higher is better" vs "lower is better".

### `src/config/weightage.json`

Risk-profile specific weights for 8 parameter groups.

---

## 🌍 Deployment

### Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DATABASE=plutomoney_quant

# BSE Star MFD API
BSE_API_URL=https://bsestarmf.in/RTPService
BSE_MEMBER_CODE=12345
BSE_USER_ID=youruser
BSE_PASSWORD=yourpass

# Application
ENV=production
LOG_LEVEL=INFO
SECRET_KEY=your-jwt-secret
```

### Docker Deployment (Optional)

```bash
# Build image
docker build -t plutomoney-quant:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name plutomoney-quant \
  plutomoney-quant:latest
```

---

## 🤝 Contributing

### Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'feat: add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open Pull Request

**See [workflow.mdc](workflow.mdc) for detailed Git conventions.**

### Code Style

- **Formatting**: Black (line length 100)
- **Linting**: Ruff
- **Type Hints**: Required on all functions
- **Docstrings**: Google style for public functions

```bash
# Format code
black src/ tests/

# Lint
ruff check src/

# Type check
mypy src/
```

---

## 📊 Monthly Operations

### Cron Schedule

```bash
# Day 1 of every month at 6 AM IST
0 6 1 * * cd /app && python scripts/monthly_ingestion.py && python scripts/monthly_scoring.py
```

### Manual Trigger

```bash
# Ingest data for specific month
python scripts/monthly_ingestion.py --file data/morningstar_oct2025.json --timestamp 2025-10-01

# Run scoring
python scripts/monthly_scoring.py --timestamp 2025-10-01
```

---

## 🐛 Known Issues

See [Docs/Bug_tracking.md](Docs/Bug_tracking.md) for:
- Current open bugs
- Debugging checklists
- Incident response plans

---

## 📈 Roadmap

### Phase 1 (Weeks 1-2) ✅
- [x] Project structure & documentation
- [x] Database schema design
- [x] Configuration files (allocation matrix, directionality, weightage)

### Phase 2 (Weeks 3-4) 🚧
- [ ] Data ingestion pipeline
- [ ] Scoring engine implementation
- [ ] Unit tests (≥80% coverage)

### Phase 3 (Week 5)
- [ ] Portfolio construction logic
- [ ] Constraint handling
- [ ] Integration tests

### Phase 4 (Week 6)
- [ ] BSE Star MFD integration
- [ ] Trade list generation

### Phase 5 (Week 7)
- [ ] Rebalancing engine
- [ ] Monthly drift detection

### Phase 6 (Week 8)
- [ ] FastAPI REST API
- [ ] Authentication & rate limiting
- [ ] API documentation (Swagger/OpenAPI)

### Phase 7 (Weeks 9-10)
- [ ] Frontend (Next.js)
- [ ] User dashboard
- [ ] Performance charts

### Phase 8 (Week 11)
- [ ] Production deployment
- [ ] Monitoring & alerting
- [ ] Load testing

---

## 🔒 Security

- **No secrets in code**: All credentials in `.env` (never committed)
- **Input validation**: All API requests validated via Pydantic
- **Rate limiting**: 100 requests/minute per IP
- **Authentication**: JWT tokens for user sessions
- **MongoDB injection prevention**: Parameterized queries only

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourorg/plutomoney-quant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourorg/plutomoney-quant/discussions)
- **Email**: support@plutomoney.com

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Morningstar**: Data provider for fund metrics
- **BSE Star MFD**: SIP registration platform
- **SEBI**: Regulatory framework guidance

---

## 📅 Last Updated

**October 6, 2025** - Version 1.0

---

**Built with ❤️ by the PlutoMoney team**

