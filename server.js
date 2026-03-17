const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── YOUR STRIPE SECRET TEST KEY ───
const STRIPE_SECRET_KEY = 'sk_test_51TBr3q1YBEEPGNt50gJ7gtlvU4ZhS33s13iGBTUIfQSdkpZCh8eBxT8ziTojZ4N5G9QW0G2Du5BUEcfg31gXfvbl00YjwCIxJt';
// Go to dashboard.stripe.com/test/apikeys
// Copy the SECRET key (sk_test_...) and paste above

const PORT = 8080;

// ─── PACKAGES ───
const packages = {
  1:  { diamonds: 11,   price: 22,   name: '11 Diamonds' },
  2:  { diamonds: 22,   price: 43,   name: '22 Diamonds' },
  3:  { diamonds: 56,   price: 99,   name: '56 Diamonds (+5 bonus)' },
  4:  { diamonds: 112,  price: 199,  name: '112 Diamonds (+11)' },
  5:  { diamonds: 240,  price: 399,  name: '240 Diamonds (+24)' },
  6:  { diamonds: 355,  price: 599,  name: '355 Diamonds (+36)' },
  7:  { diamonds: 570,  price: 999,  name: '570 Diamonds (+57)' },
  8:  { diamonds: 1160, price: 1999, name: '1160 Diamonds (+116)' },
  9:  { diamonds: 2398, price: 3999, name: '2398 Diamonds (+240)' },
  10: { diamonds: 4830, price: 7999, name: '4830 Diamonds (+483)' },
};

// ─── STRIPE API CALL ───
function stripeRequest(method, endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      hostname: 'api.stripe.com',
      path: '/v1/' + endpoint,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ─── HTTP SERVER ───
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  // ── Serve index.html ──
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // ── Success page ──
  if (req.method === 'GET' && url.pathname === '/success') {
    const session_id = url.searchParams.get('session_id') || '';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Success</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet">
<style>
  body { background:#050810; color:#e8f0ff; font-family:'Rajdhani',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .box { text-align:center; padding:40px 30px; max-width:420px; }
  .icon { font-size:4rem; animation:pop 0.5s cubic-bezier(0.34,1.56,0.64,1); display:block; margin-bottom:16px; }
  @keyframes pop { 0%{transform:scale(0)} 100%{transform:scale(1)} }
  h1 { font-family:'Orbitron',monospace; color:#FFD700; font-size:1.6rem; margin-bottom:10px; }
  p { color:rgba(232,240,255,0.6); line-height:1.7; margin-bottom:20px; }
  .detail { background:rgba(0,207,255,0.06); border:1px solid rgba(0,207,255,0.15); border-radius:12px; padding:16px; font-family:'Orbitron',monospace; font-size:0.72rem; color:#00e5ff; letter-spacing:1px; margin-bottom:24px; }
  a { display:inline-block; background:linear-gradient(135deg,#0070f3,#00b4ff); color:white; text-decoration:none; padding:13px 30px; border-radius:10px; font-family:'Orbitron',monospace; font-size:0.8rem; letter-spacing:2px; }
</style>
</head>
<body>
<div class="box">
  <span class="icon">✅</span>
  <h1>PAYMENT SUCCESS!</h1>
  <p>Your diamonds are being credited to your MLBB account. Thank you for your purchase!</p>
  <div class="detail">💎 DIAMONDS INCOMING<br>🧾 ${session_id.substring(0,30)}...</div>
  <a href="/">⟵ BUY MORE DIAMONDS</a>
</div>
</body>
</html>`);
    return;
  }

  // ── Cancel page ──
  if (req.method === 'GET' && url.pathname === '/cancel') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Cancelled</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@400&display=swap" rel="stylesheet">
<style>
  body { background:#050810; color:#e8f0ff; font-family:'Rajdhani',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .box { text-align:center; padding:40px 30px; }
  .icon { font-size:3.5rem; display:block; margin-bottom:16px; }
  h1 { font-family:'Orbitron',monospace; color:#ff6b6b; margin-bottom:10px; }
  p { color:rgba(232,240,255,0.5); margin-bottom:24px; }
  a { display:inline-block; background:rgba(0,207,255,0.1); border:1px solid rgba(0,207,255,0.3); color:#00e5ff; text-decoration:none; padding:12px 28px; border-radius:10px; font-family:'Orbitron',monospace; font-size:0.8rem; letter-spacing:2px; }
</style>
</head>
<body>
<div class="box">
  <span class="icon">❌</span>
  <h1>PAYMENT CANCELLED</h1>
  <p>No worries! You were not charged. Go back and try again.</p>
  <a href="/">⟵ GO BACK TO SHOP</a>
</div>
</body>
</html>`);
    return;
  }

  // ── Create Checkout Session ──
  if (req.method === 'POST' && url.pathname === '/create-checkout') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const pkg = packages[data.pkgId];
        if (!pkg) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid package' }));
          return;
        }

        const host = req.headers.host || `localhost:${PORT}`;
        const baseUrl = `http://${host}`;

        const session = await stripeRequest('POST', 'checkout/sessions', {
          'payment_method_types[0]': 'card',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `MLBB ${pkg.name}`,
          'line_items[0][price_data][product_data][description]': `Mobile Legends Bang Bang - ${pkg.name} | UID: ${data.userId} | Server: ${data.serverId}`,
          'line_items[0][price_data][product_data][images][0]': 'https://i.imgur.com/7bMqysJ.png',
          'line_items[0][price_data][unit_amount]': pkg.price,
          'line_items[0][quantity]': '1',
          'mode': 'payment',
          'customer_email': data.email || '',
          'metadata[userId]': data.userId,
          'metadata[serverId]': data.serverId,
          'metadata[diamonds]': pkg.diamonds,
          'success_url': `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${baseUrl}/cancel`,
        });

        if (session.error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: session.error.message }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: session.url }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   💎 MLBB DIAMOND SHOP RUNNING 💎    ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Local:  http://localhost:${PORT}        ║`);
  console.log('║  Test card: 4242 4242 4242 4242      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
});
