const http = require('https');
const start = Date.now();
const req = http.request('https://booking-app-one-kappa.vercel.app/api/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'TIME:', Date.now() - start, 'DATA:', data));
});
req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: 'test.jpg', callbackUrl: 'https://booking-app-one-kappa.vercel.app/api/upload', clientPayload: null, multipart: true } }));
req.end();
