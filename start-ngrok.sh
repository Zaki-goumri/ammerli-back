#!/bin/bash

# Start ngrok in the background
echo "Starting ngrok tunnel..."
ngrok http app.localhost > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ Ngrok URL: $NGROK_URL"

# Update .env file
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Backup .env
cp "$ENV_FILE" "$ENV_FILE.backup"

# Update the URLs in .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=${NGROK_URL}/|g" "$ENV_FILE"
sed -i "s|BACKEND_API_URL=.*|BACKEND_API_URL=${NGROK_URL}/api/v1|g" "$ENV_FILE"

echo "✅ .env file updated:"
echo "   BACKEND_URL=${NGROK_URL}/"
echo "   BACKEND_API_URL=${NGROK_URL}/api/v1"

echo ""
echo "🚀 Ngrok is running (PID: $NGROK_PID)"
echo "📊 Dashboard: http://localhost:4040"
echo "⚠️  Press Ctrl+C to stop ngrok"

# Wait for user to stop
wait $NGROK_PID
