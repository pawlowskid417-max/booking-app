const http = require('https');
const req = http.request('https://booking-app-one-kappa.vercel.app/api/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
req.write(JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: 'test.png', callbackUrl: 'https://booking-app-one-kappa.vercel.app/api/upload', clientPayload: null } }));
req.end();
