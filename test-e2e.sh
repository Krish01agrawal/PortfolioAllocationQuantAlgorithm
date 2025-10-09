#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║            PHASE 1 END-TO-END TEST SCRIPT                            ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -e

BASE_URL="http://localhost:3000"
PAYLOAD_FILE="test-morningstar-payload.json"
TEST_TIMESTAMP="2025-11-01"

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║                  🧪 PHASE 1 END-TO-END TEST SUITE 🧪                      ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=7

echo "📋 Test Configuration:"
echo "   - Base URL: $BASE_URL"
echo "   - Payload: $PAYLOAD_FILE"
echo "   - Timestamp: $TEST_TIMESTAMP"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 1: Server Health Check
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Server Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/mutual-funds)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Server is responding (HTTP $HTTP_CODE)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Server not responding (HTTP $HTTP_CODE)"
    ((TESTS_FAILED++))
    exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 2: Data Ingestion (POST /api/mutual-funds/ingest)
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Data Ingestion"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📤 Sending POST request to $BASE_URL/api/mutual-funds/ingest..."

RESPONSE=$(curl -s -X POST $BASE_URL/api/mutual-funds/ingest \
  -H "Content-Type: application/json" \
  -d @$PAYLOAD_FILE)

SUCCESS=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")
FUNDS_PROCESSED=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('fundsProcessed', 0))")

echo ""
echo "📊 Ingestion Result:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

if [ "$SUCCESS" = "True" ] && [ "$FUNDS_PROCESSED" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Successfully ingested $FUNDS_PROCESSED funds"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Ingestion failed"
    ((TESTS_FAILED++))
fi
echo ""

# Wait for data to be fully written
echo "⏳ Waiting 2 seconds for data to be written..."
sleep 2
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 3: Get All Funds (GET /api/mutual-funds)
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Get All Funds"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s $BASE_URL/api/mutual-funds)
FUND_COUNT=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('count', 0))")

echo "📊 Retrieved $FUND_COUNT funds"
echo "$RESPONSE" | python3 -m json.tool | head -30
echo "..."
echo ""

if [ "$FUND_COUNT" -ge 8 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Retrieved $FUND_COUNT funds (expected >= 8)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Expected >= 8 funds, got $FUND_COUNT"
    ((TESTS_FAILED++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 4: Get Fund by ID (GET /api/mutual-funds/:id)
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Get Fund by ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_FUND_ID="TEST_LC_001"
echo "🔍 Fetching fund: $TEST_FUND_ID"

RESPONSE=$(curl -s $BASE_URL/api/mutual-funds/$TEST_FUND_ID)
SUCCESS=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")

echo "$RESPONSE" | python3 -m json.tool
echo ""

if [ "$SUCCESS" = "True" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Successfully retrieved fund $TEST_FUND_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Failed to retrieve fund $TEST_FUND_ID"
    ((TESTS_FAILED++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 5: Get Fund History (GET /api/mutual-funds/:id/history)
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Get Fund History"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Fetching history for: $TEST_FUND_ID"

RESPONSE=$(curl -s $BASE_URL/api/mutual-funds/$TEST_FUND_ID/history)
SNAPSHOT_COUNT=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('count', 0))")

echo "$RESPONSE" | python3 -m json.tool | head -40
echo "..."
echo ""

if [ "$SNAPSHOT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Retrieved $SNAPSHOT_COUNT snapshots for $TEST_FUND_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: No history found for $TEST_FUND_ID"
    ((TESTS_FAILED++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 6: Filter by Category (GET /api/mutual-funds?category=...)
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Filter by Category"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_CATEGORY="Large Cap Equity"
echo "🔍 Filtering by category: $TEST_CATEGORY"

RESPONSE=$(curl -s "$BASE_URL/api/mutual-funds?category=$TEST_CATEGORY")
CATEGORY_COUNT=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('count', 0))")

echo "$RESPONSE" | python3 -m json.tool | head -30
echo "..."
echo ""

if [ "$CATEGORY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Retrieved $CATEGORY_COUNT funds in category '$TEST_CATEGORY'"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: No funds found in category '$TEST_CATEGORY'"
    ((TESTS_FAILED++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# TEST 7: MongoDB Data Verification
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: MongoDB Data Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🗄️ Checking MongoDB collections..."
echo ""

# Check Collection 1
COL1_COUNT=$(mongosh plutomoney_quant --quiet --eval "db.mfSchemeTrackRecord.countDocuments()" 2>/dev/null || echo "0")
echo "   Collection 1 (mfSchemeTrackRecord): $COL1_COUNT documents"

# Check Collection 2
COL2_COUNT=$(mongosh plutomoney_quant --quiet --eval "db.mfSchemeDataMonthwise.countDocuments()" 2>/dev/null || echo "0")
echo "   Collection 2 (mfSchemeDataMonthwise): $COL2_COUNT documents"

echo ""

if [ "$COL1_COUNT" -gt 0 ] && [ "$COL2_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: MongoDB collections populated (Col1: $COL1_COUNT, Col2: $COL2_COUNT)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: MongoDB collections not properly populated"
    ((TESTS_FAILED++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# FINAL REPORT
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                         TEST RESULTS SUMMARY                               ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "   Total Tests:  $TOTAL_TESTS"
echo -e "   ${GREEN}Passed:       $TESTS_PASSED${NC}"
echo -e "   ${RED}Failed:       $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                            ║${NC}"
    echo -e "${GREEN}║                    ✅ ALL TESTS PASSED! ✅                                ║${NC}"
    echo -e "${GREEN}║                                                                            ║${NC}"
    echo -e "${GREEN}║               Phase 1 is fully operational and ready!                      ║${NC}"
    echo -e "${GREEN}║                 Ready to proceed to Phase 2! 🚀                           ║${NC}"
    echo -e "${GREEN}║                                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                            ║${NC}"
    echo -e "${RED}║                    ❌ SOME TESTS FAILED ❌                                ║${NC}"
    echo -e "${RED}║                                                                            ║${NC}"
    echo -e "${RED}║              Please review the errors above and fix them.                  ║${NC}"
    echo -e "${RED}║                                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

