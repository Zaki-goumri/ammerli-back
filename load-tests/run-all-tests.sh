#!/bin/bash

# K6 Comprehensive Test Suite Runner
# Runs all load tests in sequence and generates comparison report

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

REPORT_DIR="./load-tests/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
COMPARISON_FILE="${REPORT_DIR}/comparison_${TIMESTAMP}.txt"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}     K6 Comprehensive Load Test Suite Runner      ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📅 Started at: ${YELLOW}$(date)${NC}"
echo -e "📊 Reports will be saved to: ${YELLOW}${REPORT_DIR}${NC}"
echo ""

mkdir -p "${REPORT_DIR}"

# Initialize comparison report
cat > "${COMPARISON_FILE}" << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   K6 Load Test Suite - Comparison Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execution Time: $(date)
Tests Run: smoke-test, stress-test, soak-test, spike-test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

# Array of tests to run (breakpoint test excluded from automated runs)
TESTS=("smoke-test" "stress-test" "soak-test" "spike-test")
TOTAL_TESTS=${#TESTS[@]}
CURRENT_TEST=0
FAILED_TESTS=()

# Function to extract key metrics from JSON report
extract_metrics() {
    local json_file=$1
    local test_name=$2
    
    echo "" >> "${COMPARISON_FILE}"
    echo "═══════════════════════════════════════════════════" >> "${COMPARISON_FILE}"
    echo "  Test: ${test_name}" >> "${COMPARISON_FILE}"
    echo "═══════════════════════════════════════════════════" >> "${COMPARISON_FILE}"
    
    if [ -f "${json_file}" ]; then
        local failed_rate=$(jq -r '.metrics.http_req_failed.values.rate // "N/A"' "${json_file}")
        local p95=$(jq -r '.metrics.http_req_duration.values["p(95)"] // "N/A"' "${json_file}")
        local p99=$(jq -r '.metrics.http_req_duration.values["p(99)"] // "N/A"' "${json_file}")
        local total_reqs=$(jq -r '.metrics.http_reqs.values.count // "N/A"' "${json_file}")
        local iterations=$(jq -r '.metrics.iterations.values.count // "N/A"' "${json_file}")
        local duration=$(jq -r '.state.testRunDurationMs // "N/A"' "${json_file}")
        
        # Convert duration to seconds
        if [ "${duration}" != "N/A" ]; then
            duration=$(echo "scale=2; ${duration} / 1000" | bc)
        fi
        
        # Format failure rate as percentage
        if [ "${failed_rate}" != "N/A" ]; then
            failed_rate=$(echo "scale=2; ${failed_rate} * 100" | bc)
        fi
        
        echo "Duration:        ${duration}s" >> "${COMPARISON_FILE}"
        echo "Total Requests:  ${total_reqs}" >> "${COMPARISON_FILE}"
        echo "Iterations:      ${iterations}" >> "${COMPARISON_FILE}"
        echo "Failure Rate:    ${failed_rate}%" >> "${COMPARISON_FILE}"
        echo "P95 Response:    ${p95}ms" >> "${COMPARISON_FILE}"
        echo "P99 Response:    ${p99}ms" >> "${COMPARISON_FILE}"
        
        # Status indicators
        echo "" >> "${COMPARISON_FILE}"
        echo "Status:" >> "${COMPARISON_FILE}"
        
        # Check failure rate
        if [ "${failed_rate}" != "N/A" ]; then
            threshold=$(echo "${failed_rate} < 5" | bc -l)
            if [ "$threshold" -eq 1 ]; then
                echo "  ✓ Failure rate under 5%" >> "${COMPARISON_FILE}"
            else
                echo "  ✗ Failure rate exceeds 5%" >> "${COMPARISON_FILE}"
            fi
        fi
        
        # Check p95
        if [ "${p95}" != "N/A" ]; then
            threshold=$(echo "${p95} < 2000" | bc -l)
            if [ "$threshold" -eq 1 ]; then
                echo "  ✓ P95 response time under 2000ms" >> "${COMPARISON_FILE}"
            else
                echo "  ✗ P95 response time exceeds 2000ms" >> "${COMPARISON_FILE}"
            fi
        fi
    else
        echo "Error: Report file not found" >> "${COMPARISON_FILE}"
    fi
}

# Run each test
for test in "${TESTS[@]}"; do
    CURRENT_TEST=$((CURRENT_TEST + 1))
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Running Test ${CURRENT_TEST}/${TOTAL_TESTS}: ${test}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if ./run-k6-tests.sh "${test}"; then
        echo ""
        echo -e "${GREEN}✅ ${test} completed successfully${NC}"
        
        # Find the most recent JSON report for this test
        LATEST_REPORT=$(ls -t ${REPORT_DIR}/${test}_*.json 2>/dev/null | head -1)
        if [ -n "${LATEST_REPORT}" ]; then
            extract_metrics "${LATEST_REPORT}" "${test}"
        fi
    else
        echo ""
        echo -e "${RED}❌ ${test} failed${NC}"
        FAILED_TESTS+=("${test}")
        
        echo "" >> "${COMPARISON_FILE}"
        echo "═══════════════════════════════════════════════════" >> "${COMPARISON_FILE}"
        echo "  Test: ${test}" >> "${COMPARISON_FILE}"
        echo "═══════════════════════════════════════════════════" >> "${COMPARISON_FILE}"
        echo "Status: FAILED - Test did not complete" >> "${COMPARISON_FILE}"
    fi
    
    # Wait between tests
    if [ ${CURRENT_TEST} -lt ${TOTAL_TESTS} ]; then
        echo ""
        echo -e "${YELLOW}⏳ Waiting 30 seconds before next test...${NC}"
        sleep 30
    fi
done

# Generate summary
echo "" >> "${COMPARISON_FILE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "${COMPARISON_FILE}"
echo "   Summary" >> "${COMPARISON_FILE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "${COMPARISON_FILE}"
echo "" >> "${COMPARISON_FILE}"
echo "Total Tests Run: ${TOTAL_TESTS}" >> "${COMPARISON_FILE}"
echo "Successful: $((TOTAL_TESTS - ${#FAILED_TESTS[@]}))" >> "${COMPARISON_FILE}"
echo "Failed: ${#FAILED_TESTS[@]}" >> "${COMPARISON_FILE}"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo "" >> "${COMPARISON_FILE}"
    echo "Failed Tests:" >> "${COMPARISON_FILE}"
    for failed in "${FAILED_TESTS[@]}"; do
        echo "  - ${failed}" >> "${COMPARISON_FILE}"
    done
fi

echo "" >> "${COMPARISON_FILE}"
echo "Completed at: $(date)" >> "${COMPARISON_FILE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "${COMPARISON_FILE}"

# Final summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}     Test Suite Completed     ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📊 Tests Run: ${YELLOW}${TOTAL_TESTS}${NC}"
echo -e "✅ Successful: ${GREEN}$((TOTAL_TESTS - ${#FAILED_TESTS[@]}))${NC}"
echo -e "❌ Failed: ${RED}${#FAILED_TESTS[@]}${NC}"
echo ""
echo -e "📄 Comparison Report: ${YELLOW}${COMPARISON_FILE}${NC}"
echo ""

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}⚠️  Some tests failed. Please review the reports.${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    exit 0
fi
