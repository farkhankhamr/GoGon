const http = require('http');
const data = JSON.stringify({
  type: 'DEAL',
  content: 'test',
  city: 'Jakarta',
  anon_id: 'test-id',
  deal_meta: {
    validity_preset: 'TODAY',
    place_hint: null,
    seen_directly: true
  }
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/intel',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});

req.write(data);
req.end();
