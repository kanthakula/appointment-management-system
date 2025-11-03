#!/bin/bash

# Manual AI Functionality Test Script
# Run with: bash tests/test-manual.sh

BASE_URL="http://localhost:3002"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 AI Functionality Manual Tests"
echo "================================"
echo ""

# Test 1: Smart Recommendations
echo "Test 1: Smart Slot Recommendations"
echo "-----------------------------------"
RESPONSE=$(curl -s "${BASE_URL}/api/slots/recommendations?email=test@example.com")
if echo "$RESPONSE" | grep -q "recommendations"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 2: Natural Language - Find
echo "Test 2: Natural Language - Find Slots"
echo "--------------------------------------"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/booking/natural-language" \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me slots for tomorrow afternoon", "email": "test@example.com"}')
if echo "$RESPONSE" | grep -q "intent"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 3: Natural Language - Book
echo "Test 3: Natural Language - Book Intent"
echo "---------------------------------------"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/booking/natural-language" \
  -H "Content-Type: application/json" \
  -d '{"message": "Book me for next Sunday afternoon for 3 people", "email": "test@example.com"}')
if echo "$RESPONSE" | grep -q "intent"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    echo "Intent extracted:"
    echo "$RESPONSE" | grep -o '"action":"[^"]*"' | head -1
    echo "$RESPONSE" | grep -o '"partySize":[0-9]*' | head -1
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 4: Email Generation
echo "Test 4: AI Email Generation - Confirmation"
echo "-------------------------------------------"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/ai/generate-email" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "confirmation",
    "bookingData": {
      "name": "John Doe",
      "date": "2025-11-10",
      "time": "14:00",
      "partySize": 2
    }
  }')
if echo "$RESPONSE" | grep -q "emailContent"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    EMAIL_LENGTH=$(echo "$RESPONSE" | grep -o '"emailContent":"[^"]*"' | wc -c)
    echo "Generated email length: $EMAIL_LENGTH characters"
    echo "Preview:"
    echo "$RESPONSE" | grep -o '"emailContent":"[^"]*"' | head -c 150
    echo "..."
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 5: Error Handling
echo "Test 5: Error Handling - Missing Email"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/slots/recommendations")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Correctly returns 400 for missing email"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

echo "================================"
echo "✅ Manual tests completed!"
echo ""
echo "For detailed testing, see: tests/TESTING_GUIDE.md"

