#!/usr/bin/env node
/**
 * Simple HTTP Server for testing offline FlipHTML5 books
 * 
 * Usage:
 *   node serve-offline-book.js [folder-path] [port]
 * 
 * Example:
 *   node serve-offline-book.js ./my-offline-book 8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.swf': 'application/x-shockwave-flash',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath, stat) {
  const mimeType = getMimeType(filePath);
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', (err) => {
    res.writeHead(500);
    res.end('Server Error');
  });
}

function serve404(res) {
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>404 Not Found</title></head>
    <body>
      <h1>404 - File Not Found</h1>
      <p>The requested file was not found in the offline book directory.</p>
      <a href="/">Go to Index</a>
    </body>
    </html>
  `);
}

function serveDirectory(res, dirPath, urlPath) {
  const files = fs.readdirSync(dirPath);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Directory: ${urlPath}</title>
      <style>
        body { font-family: sans-serif; margin: 20px; }
        a { color: #0066cc; }
        ul { list-style: none; padding: 0; }
        li { padding: 5px 0; }
        .dir { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Directory: ${urlPath}</h1>
      <ul>
        ${urlPath !== '/' ? '<li><a href="..">..</a></li>' : ''}
        ${files.map(file => {
          const filePath = path.join(dirPath, file);
          const isDir = fs.statSync(filePath).isDirectory();
          return `<li class="${isDir ? 'dir' : ''}"><a href="${file}${isDir ? '/' : ''}">${file}${isDir ? '/' : ''}</a></li>`;
        }).join('')}
      </ul>
    </body>
    </html>
  `);
}

function createServer(rootDir, port) {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    
    // Normalize path
    pathname = pathname.replace(/\.\./g, '');
    let filePath = path.join(rootDir, pathname);
    
    // Log request
    console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);
    
    try {
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Try index.html
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          serveFile(res, indexPath, fs.statSync(indexPath));
        } else {
          serveDirectory(res, filePath, pathname);
        }
      } else {
        serveFile(res, filePath, stat);
      }
    } catch (err) {
      serve404(res);
    }
  });
  
  server.listen(port, '0.0.0.0', () => {
    console.log('\n='.repeat(50));
    console.log(`Offline Book Server`);
    console.log('='.repeat(50));
    console.log(`Serving: ${rootDir}`);
    console.log(`\nLocal:   http://localhost:${port}`);
    console.log(`Network: http://0.0.0.0:${port}`);
    console.log(`\nOpen in browser to test your offline book.`);
    console.log(`Press Ctrl+C to stop.\n`);
  });
  
  return server;
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Offline Book Server
Serves a local folder via HTTP for testing offline flipbooks.

Usage:
  node serve-offline-book.js [folder-path] [port]

Arguments:
  folder-path   Path to the offline book folder (default: current directory)
  port          Port to serve on (default: 8080)

Examples:
  node serve-offline-book.js
  node serve-offline-book.js ./my-offline-book
  node serve-offline-book.js ./my-offline-book 3000
`);
  process.exit(0);
}

const rootDir = path.resolve(args[0] || '.');
const port = parseInt(args[1], 10) || 8080;

if (!fs.existsSync(rootDir)) {
  console.error(`Error: Directory not found: ${rootDir}`);
  process.exit(1);
}

createServer(rootDir, port);
