#!/usr/bin/env node

/**
 * Start Page Setup Script
 * Automates KV creation, wrangler.toml config, and deployment.
 *
 * Usage: npm run setup
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  } catch (e) {
    if (opts.silent) return e.stdout || '';
    throw e;
  }
}

function runCapture(cmd) {
  return run(cmd, { silent: true }).trim();
}

async function main() {
  console.log('\n🏠 Start Page Setup\n');

  // Step 1: Check wrangler is available
  try {
    runCapture('npx wrangler --version');
  } catch {
    console.log('❌ Wrangler not found. Run: npm install');
    process.exit(1);
  }

  // Step 2: Check if logged into Cloudflare
  console.log('Checking Cloudflare login...');
  try {
    runCapture('npx wrangler whoami');
    console.log('✅ Logged into Cloudflare\n');
  } catch {
    console.log('You need to log into Cloudflare first.\n');
    run('npx wrangler login');
    console.log('');
  }

  // Step 3: Create KV namespace if needed
  const tomlPath = 'wrangler.toml';
  let toml = readFileSync(tomlPath, 'utf-8');
  const kvMatch = toml.match(/id\s*=\s*"([^"]+)"/);

  if (!kvMatch || kvMatch[1] === 'paste-your-id-here') {
    console.log('Creating KV namespace...');
    const output = runCapture('npx wrangler kv namespace create START_PAGE_DATA');
    const idMatch = output.match(/id\s*=\s*"([^"]+)"/);
    if (idMatch) {
      const kvId = idMatch[1];
      if (kvMatch) {
        toml = toml.replace(kvMatch[1], kvId);
      } else {
        toml += `\n[[kv_namespaces]]\nbinding = "START_PAGE_DATA"\nid = "${kvId}"\n`;
      }
      writeFileSync(tomlPath, toml);
      console.log(`✅ KV namespace created: ${kvId}\n`);
    } else {
      console.log('⚠️  Could not parse KV namespace ID. Create it manually:');
      console.log('   npx wrangler kv namespace create START_PAGE_DATA\n');
    }
  } else {
    console.log(`✅ KV namespace already configured: ${kvMatch[1]}\n`);
  }

  // Step 4: Ask about auth
  console.log('How do you want to sign in?\n');
  console.log('  1. Password (simplest — no external setup needed)');
  console.log('  2. Google Sign-In (requires Google Cloud project)');
  console.log('  3. Skip for now (configure later via the setup wizard)\n');

  const authChoice = await ask('Choice [1/2/3]: ');

  if (authChoice === '2') {
    console.log('\nYou need a Google Cloud OAuth 2.0 Client.');
    console.log('Create one at: https://console.cloud.google.com/\n');
    console.log('After deploying, your redirect URI will be:');
    console.log('  https://<your-worker>.workers.dev/api/auth/callback\n');
    console.log('(The exact URL will be shown after deployment)\n');

    const clientId = await ask('Google Client ID (or Enter to skip): ');
    if (clientId.trim()) {
      console.log('Setting GOOGLE_CLIENT_ID...');
      run(`echo "${clientId.trim()}" | npx wrangler secret put GOOGLE_CLIENT_ID`, { silent: true });

      const clientSecret = await ask('Google Client Secret: ');
      if (clientSecret.trim()) {
        console.log('Setting GOOGLE_CLIENT_SECRET...');
        run(`echo "${clientSecret.trim()}" | npx wrangler secret put GOOGLE_CLIENT_SECRET`, { silent: true });
      }
      console.log('✅ Google OAuth secrets configured\n');
    }
  }

  if (authChoice === '1') {
    console.log('\n✅ Password auth requires no setup — you\'ll set your password on first visit.\n');
  }

  // Note: JWT_SECRET and GOOGLE_REDIRECT_URI are auto-generated — no need to ask

  // Step 5: Deploy
  const doDeploy = await ask('Deploy now? [Y/n]: ');
  if (doDeploy.toLowerCase() !== 'n') {
    console.log('\nDeploying...\n');
    run('npm run deploy');
    console.log('\n🎉 Done! Visit your Start Page and complete setup in the browser.');
  } else {
    console.log('\nRun `npm run deploy` when ready.');
  }

  rl.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
