const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ENV_FILE = path.join(__dirname, '.env');
const PORT = 3000;

// Function to get ngrok URL
function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tunnel = json.tunnels.find(t => t.proto === 'https');
          if (tunnel) {
            resolve(tunnel.public_url);
          } else {
            reject(new Error('No HTTPS tunnel found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Function to update .env file
function updateEnvFile(ngrokUrl) {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error('.env file not found');
  }

  // Backup .env
  fs.copyFileSync(ENV_FILE, `${ENV_FILE}.backup`);

  // Read .env file
  let envContent = fs.readFileSync(ENV_FILE, 'utf8');

  // Update URLs
  envContent = envContent.replace(
    /BACKEND_URL=.*/,
    `BACKEND_URL=${ngrokUrl}/`
  );
  envContent = envContent.replace(
    /BACKEND_API_URL=.*/,
    `BACKEND_API_URL=${ngrokUrl}/api/v1`
  );

  // Write back to .env
  fs.writeFileSync(ENV_FILE, envContent, 'utf8');

  console.log('✅ .env file updated:');
  console.log(`   BACKEND_URL=${ngrokUrl}/`);
  console.log(`   BACKEND_API_URL=${ngrokUrl}/api/v1`);
}

// Main function
async function main() {
  console.log('🚀 Starting ngrok tunnel...');

  // Start ngrok
  const ngrok = spawn('ngrok', ['http', PORT.toString()], {
    detached: false,
  });

  // Wait for ngrok to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Get ngrok URL with retries
    let ngrokUrl = null;
    for (let i = 0; i < 5; i++) {
      try {
        ngrokUrl = await getNgrokUrl();
        break;
      } catch (error) {
        if (i === 4) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!ngrokUrl) {
      throw new Error('Failed to get ngrok URL');
    }

    console.log(`✅ Ngrok URL: ${ngrokUrl}`);

    // Update .env file
    updateEnvFile(ngrokUrl);

    console.log('');
    console.log(`📊 Dashboard: http://localhost:4040`);
    console.log('⚠️  Press Ctrl+C to stop ngrok');

  } catch (error) {
    console.error('❌ Error:', error.message);
    ngrok.kill();
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping ngrok...');
    ngrok.kill();
    process.exit(0);
  });

  // Keep the process alive
  ngrok.on('close', (code) => {
    console.log(`\n🛑 Ngrok exited with code ${code}`);
    process.exit(code);
  });
}

main();
