import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

const ROOT_DIR = process.cwd();
const CLOUDFLARED_BIN = path.join(ROOT_DIR, 'cloudflared.exe');

async function isServerRunning(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'win32') {
      execSync('clip', { input: text });
      return true;
    }
  } catch {
    // Clipboard fallback
  }
  return false;
}

function printBanner(publicUrl, providerName, copied) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log(`║   🎉 YOUR GAME IS LIVE ON THE INTERNET! (${providerName.padEnd(10)})   ║`);
  console.log('║                                                              ║');
  console.log(`║   👉  ${publicUrl.padEnd(52, ' ')}  ║`);
  console.log('║                                                              ║');
  console.log(`║   ${(copied ? '✓ Copied link directly to your clipboard!' : 'Copy the URL above and share with your friends!').padEnd(56, ' ')} ║`);
  console.log('║   Works across all Wi-Fi, 4G/5G mobile, and remote devices.  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('Press Ctrl + C anytime to stop hosting.\n');
}

async function main() {
  const providerArg = process.argv[2]?.toLowerCase(); // e.g. --cf, --lt

  console.log('===============================================================');
  console.log('      STARTING PUBLIC HOSTING FOR WORD RUSH (BOGGLE)           ');
  console.log('===============================================================\n');

  // 1. Ensure local game server is running on port 3000
  const running = await isServerRunning(3000);
  let serverProcess = null;

  if (!running) {
    console.log('[1/2] Starting local game server on port 3000...');
    serverProcess = spawn('npx', ['tsx', 'backend/src/server.ts'], {
      cwd: ROOT_DIR,
      shell: true,
      stdio: 'inherit',
    });

    let attempts = 0;
    while (attempts < 20) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await isServerRunning(3000)) break;
      attempts++;
    }
  } else {
    console.log('[1/2] Local game server is already running on port 3000.');
  }

  let activeTunnelProcess = null;
  let publicUrlFound = false;
  let cfFallbackTriggered = false;

  const cleanup = () => {
    console.log('\nShutting down public tunnel and local server...');
    if (activeTunnelProcess) {
      try { activeTunnelProcess.kill(); } catch {}
    }
    if (serverProcess) {
      try { serverProcess.kill(); } catch {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Helper: Localtunnel provider (instant connection, highly reliable)
  const startLocaltunnel = () => {
    if (cfFallbackTriggered && activeTunnelProcess && activeTunnelProcess.connected) return;
    cfFallbackTriggered = true;

    console.log('[Tunnel] Connecting to high-speed public tunnel via localtunnel...');
    const lt = spawn('npx', ['localtunnel', '--port', '3000'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    activeTunnelProcess = lt;

    const onLtData = (data) => {
      const output = data.toString();
      const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
      if (match && !publicUrlFound) {
        publicUrlFound = true;
        const publicUrl = match[0];
        const copied = copyToClipboard(publicUrl);
        printBanner(publicUrl, 'localtunnel', copied);
      }
    };

    lt.stdout.on('data', onLtData);
    lt.stderr.on('data', onLtData);

    lt.on('exit', () => {
      if (!publicUrlFound) {
        console.error('Localtunnel exited without acquiring a domain.');
      }
    });
  };

  // Helper: Cloudflare Tunnel provider
  const startCloudflare = () => {
    if (!fs.existsSync(CLOUDFLARED_BIN)) {
      console.log('[Notice] cloudflared.exe not found, using localtunnel...');
      startLocaltunnel();
      return;
    }

    console.log('[2/2] Requesting secure public tunnel from Cloudflare...');
    const cf = spawn(CLOUDFLARED_BIN, ['tunnel', '--url', 'http://localhost:3000'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    activeTunnelProcess = cf;

    const triggerFallback = () => {
      if (cfFallbackTriggered || publicUrlFound) return;
      cfFallbackTriggered = true;
      clearTimeout(cfTimeout);
      console.log('[Notice] Cloudflare quick-tunnel API is congested/timing out.');
      console.log('[Notice] Seamlessly switching to localtunnel for instant public hosting...');
      try { cf.kill(); } catch {}
      startLocaltunnel();
    };

    // Timeout: If Cloudflare's API is congested / down, fall back to localtunnel after 8s
    const cfTimeout = setTimeout(() => {
      triggerFallback();
    }, 8000);

    const onCfData = (data) => {
      const output = data.toString();

      // Check for Cloudflare API error / deadline timeout
      if (output.includes('failed to request quick Tunnel') || output.includes('context deadline exceeded')) {
        triggerFallback();
        return;
      }

      // CRITICAL FIX: Ignore internal endpoints like 'api.trycloudflare.com'
      const matches = output.matchAll(/https:\/\/([a-zA-Z0-9-]+)\.trycloudflare\.com/gi);
      for (const match of matches) {
        const subdomain = match[1].toLowerCase();
        // Skip Cloudflare's internal API domain
        if (subdomain !== 'api' && subdomain !== 'admin' && subdomain !== 'www' && !publicUrlFound) {
          clearTimeout(cfTimeout);
          publicUrlFound = true;
          const publicUrl = match[0];
          const copied = copyToClipboard(publicUrl);
          printBanner(publicUrl, 'Cloudflare', copied);
          return;
        }
      }
    };

    cf.stdout.on('data', onCfData);
    cf.stderr.on('data', onCfData);

    cf.on('exit', () => {
      clearTimeout(cfTimeout);
      if (!publicUrlFound && !cfFallbackTriggered) {
        triggerFallback();
      }
    });
  };

  // Launch requested provider
  if (providerArg === '--lt') {
    startLocaltunnel();
  } else {
    startCloudflare();
  }
}

main().catch((err) => {
  console.error('Hosting failed:', err);
});
