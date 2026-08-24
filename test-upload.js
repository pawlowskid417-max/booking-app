fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'upload/generate-token',
    payload: { pathname: 'test.png', callbackUrl: 'http://localhost:3000/api/upload', multipart: false }
  })
}).then(r => r.json().then(j => console.log(r.status, j))).catch(e => console.error(e));
