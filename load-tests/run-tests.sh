#!/bin/bash

# Artillery Load Testing Runner Script
# Usage: ./run-tests.sh [scenario] [environment]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
SCENARIO=${1:-mixed-load}
ENVIRONMENT=${2:-local}
REPORT_DIR="./load-tests/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Artillery Load Testing Runner${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📋 Scenario: ${YELLOW}${SCENARIO}${NC}"
echo -e "🌍 Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "📊 Report Dir: ${YELLOW}${REPORT_DIR}${NC}"
echo ""

# Create reports directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Get the scenario file path
SCENARIO_FILE="./load-tests/scenarios/${SCENARIO}.yml"

# Check if scenario file exists
if [ ! -f "${SCENARIO_FILE}" ]; then
    echo -e "${RED}❌ Error: Scenario file not found: ${SCENARIO_FILE}${NC}"
    echo ""
    echo "Available scenarios:"
    ls -1 ./load-tests/scenarios/*.yml | xargs -n 1 basename | sed 's/.yml$//' | sed 's/^/  - /'
    exit 1
fi

# Define report files
REPORT_JSON="${REPORT_DIR}/${SCENARIO}_${TIMESTAMP}.json"
REPORT_HTML="${REPORT_DIR}/${SCENARIO}_${TIMESTAMP}.html"

echo -e "${YELLOW}🚀 Starting load test...${NC}"
echo ""

# Run Artillery test
if npx artillery run \
    --environment "${ENVIRONMENT}" \
    --output "${REPORT_JSON}" \
    "${SCENARIO_FILE}"; then
    
    echo ""
    echo -e "${GREEN}✅ Load test completed successfully!${NC}"
    echo ""
    
    # Generate HTML report
    echo -e "${YELLOW}📊 Generating HTML report...${NC}"
    npx artillery report --output "${REPORT_HTML}" "${REPORT_JSON}"
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   Test Results${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "📄 JSON Report: ${YELLOW}${REPORT_JSON}${NC}"
    echo -e "📊 HTML Report: ${YELLOW}${REPORT_HTML}${NC}"
    echo ""
    echo -e "${GREEN}✨ Open the HTML report in your browser to view detailed results${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Load test failed!${NC}"
    exit 1
fi
