const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.ini': 'text/plain',
};

function serveDirectory(res, dirPath, urlPath) {
  fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    const base = urlPath.endsWith('/') ? urlPath : urlPath + '/';
    let html = '<!DOCTYPE html><ul>';
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const name = entry.name;
      const suffix = entry.isDirectory() ? '/' : '';
      html += `<li><a href="${name}${suffix}">${name}${suffix}</a></li>`;
    }
    html += '</ul>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const start = Date.now();
  const method = req.method;
  const rawUrl = req.url;
  let url = rawUrl.split('?')[0];
  const query = rawUrl.indexOf('?') !== -1 ? rawUrl.split('?')[1] : '';

  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);

  const log = (status, extra) => {
    const elapsed = Date.now() - start;
    const size = res.getHeader('content-length') || '-';
    const type = res.getHeader('content-type') || '-';
    const icon = status >= 500 ? '[ERR]' : status >= 400 ? '[WRN]' : '[OK]';
    const line = [
      icon,
      method.padEnd(4),
      status,
      `${elapsed}ms`.padStart(7),
      (typeof size === 'number' ? (size / 1000).toFixed(1) + 'KB' : '-').padStart(8),
      rawUrl,
      extra || ''
    ].filter(Boolean).join(' | ');
    console.log(line);
  };

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = function(statusCode, ...args) {
    res.statusCode = statusCode;
    return originalWriteHead(statusCode, ...args);
  };

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    log(403);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      serveFile(res, filePath);
      res.on('finish', () => log(res.statusCode || 404));
      return;
    }
    res.on('finish', () => log(res.statusCode));
    if (stats.isDirectory()) {
      serveDirectory(res, filePath, url);
    } else {
      serveFile(res, filePath);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
