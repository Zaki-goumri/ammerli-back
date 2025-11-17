# Artillery Load Testing

This directory contains load testing scenarios for the 3ammerli API using Artillery.

## 📁 Directory Structure

```
load-tests/
├── config/
│   └── endpoints.yml       # API endpoints configuration
├── scenarios/
│   ├── auth-flow.yml       # Authentication load tests
│   ├── products-flow.yml   # Product browsing tests
│   ├── orders-flow.yml     # Order management tests
│   ├── payment-flow.yml    # Payment processing tests
│   └── mixed-load.yml      # Realistic mixed traffic
├── data/
│   └── (CSV files for test data)
├── reports/
│   └── (Generated test reports)
├── run-tests.sh            # Test runner script
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

2. Ensure your backend is running:
```bash
pnpm run start:dev
```

3. Create test accounts in your database:
   - **Supermarket accounts**: +213555200001 to +213555200005
   - **Wholesaler accounts**: +213555100001 to +213555100003
   - Set password: `supermarketPassword` or `wholesalerPassword`

### Run Tests

#### Basic Usage
```bash
# Make script executable (first time only)
chmod +x load-tests/run-tests.sh

# Run mixed load test (default)
./load-tests/run-tests.sh

# Run specific scenario
./load-tests/run-tests.sh auth-flow
./load-tests/run-tests.sh products-flow
./load-tests/run-tests.sh orders-flow
./load-tests/run-tests.sh payment-flow
```

#### Using Artillery Directly
```bash
# Run a specific test
npx artillery run load-tests/scenarios/auth-flow.yml

# Run with custom environment
npx artillery run --environment dev load-tests/scenarios/mixed-load.yml

# Generate report
npx artillery run --output report.json load-tests/scenarios/products-flow.yml
npx artillery report report.json
```

## 📊 Test Scenarios

### 1. Authentication Flow (`auth-flow.yml`)
Tests authentication endpoints:
- Send OTP
- Verify OTP
- Login with JWT

**Load Profile:**
- Warm-up: 5 users/sec for 30s
- Normal: 10 users/sec for 2 min
- Peak: 20 users/sec for 3 min

### 2. Products Flow (`products-flow.yml`)
Tests product browsing and management:
- List products with pagination
- View product details
- Search products
- Filter by category
- Create products (wholesaler)

**Load Profile:**
- Warm-up: 10 users/sec
- Normal: 30 users/sec
- Peak: 50 users/sec

### 3. Orders Flow (`orders-flow.yml`)
Tests order lifecycle:
- Create orders
- View orders
- Update order status
- Cancel orders

**Load Profile:**
- Warm-up: 5 users/sec
- Normal: 10 users/sec
- Peak: 20 users/sec

### 4. Payment Flow (`payment-flow.yml`)
Tests payment processing:
- Create payment
- Process webhooks (Chargily)
- Check payment status

**Load Profile:**
- Warm-up: 3 users/sec
- Normal: 8 users/sec
- Peak: 15 users/sec

### 5. Mixed Load (`mixed-load.yml`)
Simulates realistic daily traffic with:
- 40% guest browsing
- 25% supermarket shopping
- 15% order checking
- 10% wholesaler management
- 5% authentication
- 5% payment webhooks

**Load Profile:** Simulates full day traffic pattern

## 📈 Performance Thresholds

Default thresholds (can be adjusted per scenario):
- **Max Error Rate**: 1-2%
- **P95 Response Time**: 300-1000ms (depending on endpoint)
- **P99 Response Time**: 800-3000ms

## 🔧 Configuration

### Environment Variables
Edit `config/endpoints.yml` to set:
- Target URLs for different environments (local, dev, prod)
- Test phone numbers
- Default headers

### Test Data
Add test data files in `data/` directory:
- CSV files for phone numbers, products, etc.
- Used with `payload` configuration in scenarios

## 📊 Analyzing Results

### Real-time Output
During test execution, Artillery shows:
- Current phase and user count
- Request rate (req/sec)
- Response times (min, max, median, p95, p99)
- Error rates

### HTML Reports
Generated reports include:
- Summary statistics
- Response time graphs
- Request rate over time
- Error distribution
- Scenario breakdown

View reports: Open `reports/*.html` in browser

### JSON Reports
Raw data in `reports/*.json` for:
- Custom analysis
- CI/CD integration
- Comparison between runs

## 🎯 Best Practices

### Before Testing
1. ✅ Use test/staging environment (NOT production)
2. ✅ Ensure database has test data
3. ✅ Check server resources (CPU, RAM)
4. ✅ Disable rate limiting for load tests
5. ✅ Configure test mode for SMS (avoid costs)

### During Testing
1. 📊 Monitor server metrics (CPU, memory, DB connections)
2. 📊 Watch database query performance
3. 📊 Check queue processing (BullMQ)
4. 📊 Monitor Redis memory usage

### After Testing
1. 📈 Compare results against baselines
2. 🔍 Identify bottlenecks
3. 🐛 Fix performance issues
4. 🧪 Re-test to verify improvements

## 🚨 Troubleshooting

### High Error Rates
- Check server logs for errors
- Verify test accounts exist
- Check database connections
- Ensure services are running (Redis, PostgreSQL)

### Slow Response Times
- Check database query performance
- Monitor CPU/memory usage
- Review N+1 query issues
- Check external service calls (SMS, payment gateway)

### Connection Errors
- Verify backend is running
- Check firewall settings
- Ensure correct target URL
- Test with lower load first

## 📝 Adding New Tests

1. Create new YAML file in `scenarios/`
2. Define config (phases, thresholds)
3. Add scenarios with flows
4. Test with low load first
5. Gradually increase load

Example:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "My Test"
    flow:
      - get:
          url: "/my-endpoint"
          expect:
            - statusCode: 200
```

## 🔗 Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Artillery Examples](https://github.com/artilleryio/artillery-examples)
- [Load Testing Best Practices](https://www.artillery.io/blog/load-testing-best-practices)

## 📧 Support

For issues or questions:
1. Check Artillery docs
2. Review test logs
3. Check server logs
4. Contact development team
