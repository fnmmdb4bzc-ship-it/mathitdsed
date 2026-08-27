const http = require('http');
const fs = require('fs');

const html = fs.readFileSync('/MathIT.html');

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length });
  res.end(html);
}).listen(8080, '0.0.0.0', () => {
  console.log('MathIT serving on :8080');
});
