const { Pool } = require('pg');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// ════════════════════════════════════════════════
// PASTE YOUR EXACT URLs FROM SUPABASE BELOW
// Supabase → Settings → Database
// ════════════════════════════════════════════════

const PASSWORD = 'Dm6sRBo4Q6C8S1gz'; // your current password

// From Supabase → Settings → Database → Connection string → URI
const DIRECT_URL = `postgresql://postgres:${PASSWORD}@db.ekjkutoqxuhvrizclqol.supabase.co:5432/postgres`;

// From Supabase → Settings → Database → Connection pooling → URI
// It will show you the EXACT pooler hostname - paste it below
// It looks like: aws-0-us-east-1.pooler.supabase.com OR aws-0-ap-southeast-1.pooler.supabase.com etc.
const POOLER_URL_6543 = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
const POOLER_URL_5432 = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

// Also try US regions in case your project is hosted there
const POOLER_US_EAST   = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
const POOLER_US_WEST   = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
const POOLER_EU        = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
const POOLER_AP_SE2    = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`;
const POOLER_AP_SOUTH  = `postgresql://postgres.ekjkutoqxuhvrizclqol:${PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

const CONFIGS = [
  { label: 'Direct (5432)',           url: DIRECT_URL },
  { label: 'Pooler AP-Southeast-1 (6543)', url: POOLER_URL_6543 },
  { label: 'Pooler AP-Southeast-1 (5432)', url: POOLER_URL_5432 },
  { label: 'Pooler US-East-1 (6543)',      url: POOLER_US_EAST },
  { label: 'Pooler US-West-1 (6543)',      url: POOLER_US_WEST },
  { label: 'Pooler EU-Central (6543)',     url: POOLER_EU },
  { label: 'Pooler AP-Southeast-2 (6543)',url: POOLER_AP_SE2 },
  { label: 'Pooler AP-South-1 (6543)',    url: POOLER_AP_SOUTH },
];

// First check if DNS even works
async function checkDNS() {
  return new Promise((resolve) => {
    dns.lookup('google.com', (err) => {
      if (err) {
        console.log('❌ DNS BROKEN - Cannot resolve google.com');
        console.log('   → Your network/firewall is blocking DNS lookups');
        console.log('   → Switch to MOBILE HOTSPOT and try again\n');
        resolve(false);
      } else {
        console.log('✅ DNS working (google.com resolved)\n');
        resolve(true);
      }
    });
  });
}

async function checkSupabaseDNS() {
  return new Promise((resolve) => {
    dns.lookup('db.ekjkutoqxuhvrizclqol.supabase.co', (err, addr) => {
      if (err) {
        console.log('❌ Cannot resolve Supabase hostname');
        console.log('   Error:', err.message);
        console.log('   → Port 5432 or Supabase DNS is BLOCKED on your network');
        console.log('   → SOLUTION: Switch to mobile hotspot!\n');
        resolve(false);
      } else {
        console.log('✅ Supabase DNS resolved to:', addr, '\n');
        resolve(true);
      }
    });
  });
}

async function testConnection(label, url) {
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
    max: 1,
  });
  try {
    const r = await pool.query('SELECT NOW()');
    console.log(`✅ SUCCESS → ${label}`);
    console.log(`   Time: ${r.rows[0].now}`);
    console.log('\n══════════════════════════════════════════');
    console.log('  COPY THIS TO YOUR backend/.env FILE:');
    console.log('══════════════════════════════════════════');
    console.log(`DATABASE_URL=${url}`);
    console.log('══════════════════════════════════════════\n');
    await pool.end();
    return true;
  } catch (e) {
    const short = e.message.length > 80 ? e.message.substring(0, 80) + '...' : e.message;
    console.log(`❌ ${label}: ${short}`);
    try { await pool.end(); } catch(_) {}
    return false;
  }
}

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  Supabase Connection Finder');
  console.log('══════════════════════════════════════════\n');

  console.log('Step 1: Checking network...');
  await checkDNS();

  console.log('Step 2: Checking Supabase DNS...');
  const supabaseReachable = await checkSupabaseDNS();

  console.log('Step 3: Testing all connection methods...\n');
  for (const { label, url } of CONFIGS) {
    const ok = await testConnection(label, url);
    if (ok) process.exit(0);
  }

  console.log('\n══════════════════════════════════════════');
  if (!supabaseReachable) {
    console.log('🔴 ROOT CAUSE: Your WiFi is blocking Supabase');
    console.log('');
    console.log('   IMMEDIATE FIX:');
    console.log('   → Turn on your phone hotspot');
    console.log('   → Connect your laptop to it');
    console.log('   → Run this script again');
    console.log('');
    console.log('   ALTERNATIVE: Use a local PostgreSQL instead');
    console.log('   → Install: https://www.postgresql.org/download/windows/');
    console.log('   → Then change DATABASE_URL to: postgresql://postgres:password@127.0.0.1:5432/hospitalq');
  } else {
    console.log('🔴 DNS works but connection fails.');
    console.log('   → Go to Supabase → Settings → Database → Connection pooling');
    console.log('   → Copy the exact URI shown there');
    console.log('   → Share it here so we can fix it');
  }
  console.log('══════════════════════════════════════════');
}

main();