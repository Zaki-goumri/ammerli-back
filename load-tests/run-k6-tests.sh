#!/bin/bash

# k6 Load Testing Runner Script
# Usage: ./run-k6-tests.sh [test_name]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
TEST_NAME=${1:-smoke-test}
REPORT_DIR="./load-tests/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}         k6 Load Testing Runner         ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📋 Test: ${YELLOW}${TEST_NAME}${NC}"
echo -e "📊 Report Dir: ${YELLOW}${REPORT_DIR}${NC}"
echo ""

# Create reports directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Get the test file path
TEST_FILE="./load-tests/k6/${TEST_NAME}.js"

# Check if test file exists
if [ ! -f "${TEST_FILE}" ]; then
    echo -e "${RED}❌ Error: Test file not found: ${TEST_FILE}${NC}"
    echo ""
    echo "Available tests:"
    ls -1 ./load-tests/k6/*.js | xargs -n 1 basename | sed 's/.js$//' | sed 's/^/  - /'
    exit 1
fi

# Define report file
REPORT_JSON="${REPORT_DIR}/${TEST_NAME}_${TIMESTAMP}.json"

echo -e "${YELLOW}🚀 Starting k6 load test...${NC}"
echo ""

# Run k6 test
if k6 run --summary-export="${REPORT_JSON}" "${TEST_FILE}"; then
    echo ""
    echo -e "${GREEN}✅ Load test completed successfully!${NC}"
    echo ""
    echo -e "📄 JSON Report: ${YELLOW}${REPORT_JSON}${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Load test failed!${NC}"
    exit 1
fi
