const http = require('http');
const req = http.request('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
req.write(JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: 'test.png', callbackUrl: 'http://localhost:3000/api/upload', clientPayload: null } }));
req.end();
