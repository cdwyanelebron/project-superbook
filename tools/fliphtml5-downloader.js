#!/usr/bin/env node
/**
 * FlipHTML5 Downloader - Downloads FlipHTML5 books for offline use
 * 
 * Usage:
 *   node fliphtml5-downloader.js <book-url> [output-folder]
 * 
 * Example:
 *   node fliphtml5-downloader.js https://fliphtml5.com/abcde/fghij my-book
 * 
 * The script will:
 * 1. Parse the FlipHTML5 book URL to extract book ID
 * 2. Download the main HTML page and parse all assets
 * 3. Download all CSS, JS, images, fonts
 * 4. Rewrite paths to work offline
 * 5. Create a ready-to-use offline folder with index.html
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  concurrentDownloads: 5,
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.cyan}[INFO]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    warn: `${colors.yellow}[WARN]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
  };
  console.log(`${prefix[type] || prefix.info} ${message}`);
}

/**
 * Parse FlipHTML5 URL to extract book identifiers
 */
function parseFlipHTML5Url(bookUrl) {
  const urlObj = new URL(bookUrl);
  const pathname = urlObj.pathname;
  
  // FlipHTML5 URLs are typically: https://fliphtml5.com/xxxxx/yyyyy
  // or https://online.fliphtml5.com/xxxxx/yyyyy/
  const parts = pathname.split('/').filter(p => p);
  
  if (parts.length >= 2) {
    return {
      host: urlObj.host,
      protocol: urlObj.protocol,
      bookId1: parts[0],
      bookId2: parts[1],
      baseUrl: `${urlObj.protocol}//${urlObj.host}/${parts[0]}/${parts[1]}/`,
    };
  }
  
  throw new Error(`Invalid FlipHTML5 URL format: ${bookUrl}`);
}

/**
 * Make HTTP/HTTPS request with retry logic
 */
function fetchUrl(targetUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers,
      },
      timeout: CONFIG.timeout,
    };
    
    const req = client.request(requestOptions, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, targetUrl).href;
        fetchUrl(redirectUrl, options).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${targetUrl}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          data: buffer,
          contentType: res.headers['content-type'] || '',
          url: targetUrl,
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout: ${targetUrl}`));
    });
    
    req.end();
  });
}

/**
 * Retry wrapper for fetch
 */
async function fetchWithRetry(targetUrl, options = {}, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchUrl(targetUrl, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      log(`Retry ${i + 1}/${retries} for: ${targetUrl}`, 'warn');
      await new Promise(r => setTimeout(r, CONFIG.retryDelay * (i + 1)));
    }
  }
}

/**
 * Extract all asset URLs from HTML content
 */
function extractAssets(html, baseUrl) {
  const assets = new Set();
  
  // CSS files
  const cssRegex = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi;
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // JavaScript files
  const jsRegex = /<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*>/gi;
  while ((match = jsRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // Images (various extensions)
  const imgRegex = /(?:src|href|data-src|data-original)=["']([^"']+\.(?:png|jpg|jpeg|gif|svg|webp|ico)[^"']*)["']/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // Background images in inline styles
  const bgRegex = /url\(["']?([^"')]+\.(?:png|jpg|jpeg|gif|svg|webp))["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // Fonts
  const fontRegex = /url\(["']?([^"')]+\.(?:woff2?|ttf|otf|eot))["']?\)/gi;
  while ((match = fontRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // JSON config files (common in FlipHTML5)
  const jsonRegex = /["']([^"']+\.json[^"']*)["']/gi;
  while ((match = jsonRegex.exec(html)) !== null) {
    if (match[1].includes('/') || match[1].includes('config') || match[1].includes('book')) {
      assets.add(resolveUrl(match[1], baseUrl));
    }
  }
  
  // XML files
  const xmlRegex = /["']([^"']+\.xml[^"']*)["']/gi;
  while ((match = xmlRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // SWF files (legacy)
  const swfRegex = /["']([^"']+\.swf[^"']*)["']/gi;
  while ((match = swfRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // MP3/Audio files
  const audioRegex = /["']([^"']+\.(?:mp3|wav|ogg|m4a)[^"']*)["']/gi;
  while ((match = audioRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  // Video files
  const videoRegex = /["']([^"']+\.(?:mp4|webm|ogv)[^"']*)["']/gi;
  while ((match = videoRegex.exec(html)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  return Array.from(assets);
}

/**
 * Extract assets from CSS content
 */
function extractCssAssets(css, baseUrl) {
  const assets = new Set();
  
  // url() references
  const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
  let match;
  while ((match = urlRegex.exec(css)) !== null) {
    const assetUrl = match[1];
    // Skip data URIs
    if (!assetUrl.startsWith('data:')) {
      assets.add(resolveUrl(assetUrl, baseUrl));
    }
  }
  
  // @import statements
  const importRegex = /@import\s+["']([^"']+)["']/gi;
  while ((match = importRegex.exec(css)) !== null) {
    assets.add(resolveUrl(match[1], baseUrl));
  }
  
  return Array.from(assets);
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(assetUrl, baseUrl) {
  if (assetUrl.startsWith('data:') || assetUrl.startsWith('#')) {
    return null;
  }
  
  try {
    return new URL(assetUrl, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Get local path for an asset URL
 */
function getLocalPath(assetUrl, baseUrl) {
  try {
    const urlObj = new URL(assetUrl);
    const baseUrlObj = new URL(baseUrl);
    
    // If same host, use the path
    if (urlObj.host === baseUrlObj.host) {
      let localPath = urlObj.pathname;
      // Remove leading slash and normalize
      localPath = localPath.replace(/^\/+/, '');
      // Handle query strings by creating unique filename
      if (urlObj.search) {
        const ext = path.extname(localPath);
        const base = path.basename(localPath, ext);
        const dir = path.dirname(localPath);
        const hash = Buffer.from(urlObj.search).toString('base64').slice(0, 8).replace(/[/+=]/g, '_');
        localPath = path.join(dir, `${base}_${hash}${ext}`);
      }
      return localPath;
    }
    
    // External assets go to external folder
    let localPath = `external/${urlObj.host}${urlObj.pathname}`;
    localPath = localPath.replace(/^\/+/, '');
    return localPath;
  } catch {
    return null;
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Rewrite URLs in content for offline use
 */
function rewriteUrls(content, baseUrl, isHtml = true) {
  const urlPattern = isHtml 
    ? /((?:src|href|data-src|data-original)\s*=\s*["'])([^"']+)(["'])/gi
    : /url\(["']?([^"')]+)["']?\)/gi;
  
  if (isHtml) {
    return content.replace(urlPattern, (match, prefix, urlValue, suffix) => {
      const absoluteUrl = resolveUrl(urlValue, baseUrl);
      if (!absoluteUrl) return match;
      
      const localPath = getLocalPath(absoluteUrl, baseUrl);
      if (!localPath) return match;
      
      return `${prefix}${localPath}${suffix}`;
    });
  } else {
    return content.replace(urlPattern, (match, urlValue) => {
      if (urlValue.startsWith('data:')) return match;
      
      const absoluteUrl = resolveUrl(urlValue, baseUrl);
      if (!absoluteUrl) return match;
      
      const localPath = getLocalPath(absoluteUrl, baseUrl);
      if (!localPath) return match;
      
      // Make relative path from CSS location
      return `url("${localPath}")`;
    });
  }
}

/**
 * Download a single asset with progress
 */
async function downloadAsset(assetUrl, outputDir, baseUrl, downloaded) {
  try {
    const localPath = getLocalPath(assetUrl, baseUrl);
    if (!localPath) return null;
    
    const fullPath = path.join(outputDir, localPath);
    
    // Skip if already downloaded
    if (fs.existsSync(fullPath)) {
      return { url: assetUrl, localPath, status: 'cached' };
    }
    
    const response = await fetchWithRetry(assetUrl);
    
    ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, response.data);
    
    // If CSS, extract and queue more assets
    if (localPath.endsWith('.css')) {
      const cssContent = response.data.toString('utf-8');
      const cssAssets = extractCssAssets(cssContent, assetUrl);
      return { url: assetUrl, localPath, status: 'downloaded', additionalAssets: cssAssets };
    }
    
    return { url: assetUrl, localPath, status: 'downloaded' };
  } catch (error) {
    return { url: assetUrl, status: 'failed', error: error.message };
  }
}

/**
 * Download assets with concurrency control
 */
async function downloadAssetsWithConcurrency(assets, outputDir, baseUrl) {
  const results = [];
  const queue = [...assets];
  const inProgress = new Set();
  const downloaded = new Set();
  const additionalQueue = [];
  
  while (queue.length > 0 || inProgress.size > 0) {
    // Fill up to concurrent limit
    while (queue.length > 0 && inProgress.size < CONFIG.concurrentDownloads) {
      const asset = queue.shift();
      if (downloaded.has(asset)) continue;
      
      downloaded.add(asset);
      const promise = downloadAsset(asset, outputDir, baseUrl, downloaded)
        .then(result => {
          inProgress.delete(promise);
          if (result) {
            results.push(result);
            if (result.additionalAssets) {
              for (const additionalAsset of result.additionalAssets) {
                if (additionalAsset && !downloaded.has(additionalAsset)) {
                  queue.push(additionalAsset);
                }
              }
            }
          }
          return result;
        });
      inProgress.add(promise);
    }
    
    // Wait for at least one to complete
    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
    
    // Progress update
    process.stdout.write(`\r${colors.cyan}[PROGRESS]${colors.reset} Downloaded: ${downloaded.size} assets, Queue: ${queue.length}, Active: ${inProgress.size}    `);
  }
  
  console.log(); // New line after progress
  return results;
}

/**
 * Try to find and download book page images
 */
async function downloadBookPages(bookInfo, outputDir) {
  const pagesDir = path.join(outputDir, 'files', 'mobile');
  ensureDir(pagesDir);
  
  let pageNum = 1;
  const maxPages = 500; // Safety limit
  const downloadedPages = [];
  
  log(`Attempting to download book page images...`);
  
  while (pageNum <= maxPages) {
    // Common FlipHTML5 page image patterns
    const patterns = [
      `${bookInfo.baseUrl}files/mobile/${pageNum}.jpg`,
      `${bookInfo.baseUrl}files/mobile/${pageNum}.png`,
      `${bookInfo.baseUrl}files/large/${pageNum}.jpg`,
      `${bookInfo.baseUrl}files/thumb/${pageNum}.jpg`,
      `${bookInfo.baseUrl}mobile/${pageNum}.jpg`,
      `${bookInfo.baseUrl}${pageNum}.jpg`,
    ];
    
    let found = false;
    for (const pattern of patterns) {
      try {
        const response = await fetchWithRetry(pattern, {}, 1);
        const localPath = getLocalPath(pattern, bookInfo.baseUrl);
        const fullPath = path.join(outputDir, localPath);
        ensureDir(path.dirname(fullPath));
        fs.writeFileSync(fullPath, response.data);
        downloadedPages.push(pattern);
        found = true;
        process.stdout.write(`\r${colors.cyan}[PAGES]${colors.reset} Downloaded page ${pageNum}...    `);
        break;
      } catch {
        // Try next pattern
      }
    }
    
    if (!found) {
      // No more pages found
      if (pageNum > 1) {
        console.log(`\n${colors.green}[SUCCESS]${colors.reset} Downloaded ${pageNum - 1} page images`);
      }
      break;
    }
    
    pageNum++;
  }
  
  return downloadedPages;
}

/**
 * Parse FlipHTML5 bookConfig and extract additional assets
 */
function extractBookConfigAssets(content, baseUrl) {
  const assets = new Set();
  
  // Look for bookConfig object patterns
  const configPatterns = [
    /bookConfig\s*=\s*(\{[\s\S]*?\});/gi,
    /var\s+config\s*=\s*(\{[\s\S]*?\});/gi,
    /"pages"\s*:\s*\[([\s\S]*?)\]/gi,
    /"thumbs"\s*:\s*\[([\s\S]*?)\]/gi,
    /"pageFiles"\s*:\s*\[([\s\S]*?)\]/gi,
  ];
  
  // Extract JSON-like paths from config
  const pathPatterns = [
    /"([^"]+\.(?:jpg|jpeg|png|gif|svg|webp))"/gi,
    /"([^"]+\.(?:mp3|mp4|webm|ogg))"/gi,
    /"([^"]+\.(?:json|xml))"/gi,
    /"([^"]+\/files\/[^"]+)"/gi,
    /"([^"]+\/mobile\/[^"]+)"/gi,
    /"([^"]+\/large\/[^"]+)"/gi,
  ];
  
  for (const pattern of pathPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const assetPath = match[1];
      if (!assetPath.startsWith('data:') && !assetPath.startsWith('http')) {
        const resolved = resolveUrl(assetPath, baseUrl);
        if (resolved) assets.add(resolved);
      } else if (assetPath.startsWith('http')) {
        assets.add(assetPath);
      }
    }
  }
  
  // Extract base paths for page sequences
  const basePathPatterns = [
    /"basePath"\s*:\s*"([^"]+)"/gi,
    /"thumbPath"\s*:\s*"([^"]+)"/gi,
    /"pagePath"\s*:\s*"([^"]+)"/gi,
  ];
  
  return Array.from(assets);
}

/**
 * Download and parse FlipHTML5 config files
 */
async function downloadFlipbookConfigs(bookInfo, outputDir) {
  const configAssets = new Set();
  
  // Common FlipHTML5 config file locations
  const configPaths = [
    'bookConfig.js',
    'config.js',
    'book.json',
    'config.json',
    'setting.json',
    'pages.json',
    'spine.json',
    'manifest.json',
    'files/config.json',
    'files/setting.json',
    'mobile/config.json',
  ];
  
  for (const configPath of configPaths) {
    try {
      const configUrl = new URL(configPath, bookInfo.baseUrl).href;
      const response = await fetchWithRetry(configUrl, {}, 1);
      
      const localPath = getLocalPath(configUrl, bookInfo.baseUrl);
      const fullPath = path.join(outputDir, localPath);
      ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, response.data);
      
      // Extract assets from config
      const content = response.data.toString('utf-8');
      const assets = extractBookConfigAssets(content, configUrl);
      assets.forEach(a => configAssets.add(a));
      
      log(`Found config: ${configPath}`, 'success');
    } catch {
      // Config doesn't exist, skip
    }
  }
  
  return Array.from(configAssets);
}

/**
 * Rewrite URLs in JavaScript files
 */
function rewriteJsUrls(content, baseUrl, bookInfo) {
  // Rewrite string literals that look like URLs
  let rewritten = content;
  
  // Replace absolute URLs to the fliphtml5 domain
  const domainPatterns = [
    new RegExp(`https?://${bookInfo.host}/[^"'\\s]+`, 'gi'),
    /https?:\/\/(?:online\.)?fliphtml5\.com\/[^"'\s]+/gi,
    /https?:\/\/cdn\.fliphtml5\.com\/[^"'\s]+/gi,
  ];
  
  for (const pattern of domainPatterns) {
    rewritten = rewritten.replace(pattern, (match) => {
      const localPath = getLocalPath(match, bookInfo.baseUrl);
      return localPath || match;
    });
  }
  
  return rewritten;
}

/**
 * Rewrite URLs in JSON files
 */
function rewriteJsonUrls(content, baseUrl, bookInfo) {
  try {
    const json = JSON.parse(content);
    const rewriteValue = (value) => {
      if (typeof value === 'string') {
        // Check if it's a URL
        if (value.startsWith('http://') || value.startsWith('https://')) {
          const localPath = getLocalPath(value, bookInfo.baseUrl);
          return localPath || value;
        }
        // Check if it's a relative path to an asset
        if (value.match(/\.(jpg|jpeg|png|gif|svg|mp3|mp4|js|css)$/i)) {
          return value; // Keep relative paths as-is
        }
      }
      return value;
    };
    
    const rewriteObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => rewriteObject(item));
      } else if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = rewriteObject(value);
        }
        return result;
      }
      return rewriteValue(obj);
    };
    
    return JSON.stringify(rewriteObject(json), null, 2);
  } catch {
    // Not valid JSON, return as-is
    return content;
  }
}

/**
 * Create verification HTML file
 */
function createVerificationPage(outputDir, stats) {
  const verifyHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Book Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
    .stats { background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .stat-item { display: flex; justify-content: space-between; padding: 5px 0; }
    .success { color: #4CAF50; }
    .warning { color: #ff9800; }
    .error { color: #f44336; }
    .btn { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px 10px 0; }
    .btn:hover { background: #45a049; }
    .file-list { max-height: 300px; overflow-y: auto; background: #f9f9f9; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Offline Book - Verification Report</h1>
    
    <div class="stats">
      <div class="stat-item">
        <span>Total Assets Downloaded:</span>
        <span class="success">${stats.downloaded}</span>
      </div>
      <div class="stat-item">
        <span>Cached (Already Existed):</span>
        <span>${stats.cached}</span>
      </div>
      <div class="stat-item">
        <span>Failed Downloads:</span>
        <span class="${stats.failed > 0 ? 'error' : 'success'}">${stats.failed}</span>
      </div>
      <div class="stat-item">
        <span>Page Images:</span>
        <span>${stats.pages}</span>
      </div>
    </div>
    
    <h2>Quick Actions</h2>
    <a href="index.html" class="btn">Open Flipbook</a>
    <a href="mobile.html" class="btn">Mobile Version</a>
    
    <h2>Verification Steps</h2>
    <ol>
      <li>Click "Open Flipbook" above to test the main book</li>
      <li>Check that pages flip correctly</li>
      <li>Verify images load without errors</li>
      <li>Test any interactive elements</li>
      <li>Check browser console for errors (F12 > Console)</li>
    </ol>
    
    <h2>WebView Integration</h2>
    <p>To use this in a WebView or React Native app:</p>
    <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto;">
// React Native WebView
import { WebView } from 'react-native-webview';

// Load from local asset
&lt;WebView
  source={{ uri: 'file:///path/to/offline-book/index.html' }}
  allowFileAccess={true}
  allowFileAccessFromFileURLs={true}
  originWhitelist={['*']}
/&gt;
    </pre>
    
    <h2>Downloaded Files</h2>
    <div class="file-list">
      ${stats.files.slice(0, 100).map(f => `${f}<br>`).join('')}
      ${stats.files.length > 100 ? `<br>... and ${stats.files.length - 100} more files` : ''}
    </div>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'verify.html'), verifyHtml);
}

/**
 * Main download function
 */
async function downloadFlipHTML5Book(bookUrl, outputFolder) {
  log(`Starting FlipHTML5 book download...`);
  log(`URL: ${bookUrl}`);
  
  // Parse URL
  const bookInfo = parseFlipHTML5Url(bookUrl);
  log(`Book ID: ${bookInfo.bookId1}/${bookInfo.bookId2}`);
  
  // Create output directory
  const outputDir = path.resolve(outputFolder || `flipbook_${bookInfo.bookId1}_${bookInfo.bookId2}`);
  ensureDir(outputDir);
  log(`Output directory: ${outputDir}`);
  
  // Download main HTML
  log(`Downloading main HTML page...`);
  const mainHtml = await fetchWithRetry(bookInfo.baseUrl);
  let htmlContent = mainHtml.data.toString('utf-8');
  
  // Also try to get mobile.html if it exists
  try {
    const mobileHtml = await fetchWithRetry(bookInfo.baseUrl + 'mobile.html');
    fs.writeFileSync(path.join(outputDir, 'mobile.html'), mobileHtml.data);
    log(`Downloaded mobile.html`, 'success');
  } catch {
    log(`No mobile.html found (optional)`, 'warn');
  }
  
  // Extract all assets
  log(`Extracting asset URLs...`);
  const assets = extractAssets(htmlContent, bookInfo.baseUrl);
  log(`Found ${assets.length} assets in main HTML`);
  
  // Download FlipHTML5 config files and extract additional assets
  log(`Scanning for FlipHTML5 configuration files...`);
  const configAssets = await downloadFlipbookConfigs(bookInfo, outputDir);
  log(`Found ${configAssets.length} assets from config files`);
  
  // Also extract assets from inline scripts in HTML
  const inlineConfigAssets = extractBookConfigAssets(htmlContent, bookInfo.baseUrl);
  
  // Merge all assets
  const allAssets = [...new Set([...assets, ...configAssets, ...inlineConfigAssets])];
  log(`Total unique assets to download: ${allAssets.length}`);
  
  // Download all assets
  log(`Downloading assets with concurrency: ${CONFIG.concurrentDownloads}...`);
  const results = await downloadAssetsWithConcurrency(allAssets, outputDir, bookInfo.baseUrl);
  
  // Try to download page images
  const pageImages = await downloadBookPages(bookInfo, outputDir);
  
  // Rewrite HTML with local paths
  log(`Rewriting HTML for offline use...`);
  const offlineHtml = rewriteUrls(htmlContent, bookInfo.baseUrl, true);
  fs.writeFileSync(path.join(outputDir, 'index.html'), offlineHtml);
  
  // Rewrite CSS files
  log(`Rewriting CSS files for offline use...`);
  const cssFiles = fs.readdirSync(outputDir, { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.css'));
  
  for (const cssFile of cssFiles) {
    const cssPath = path.join(outputDir, cssFile);
    try {
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      const rewrittenCss = rewriteUrls(cssContent, new URL(cssFile, bookInfo.baseUrl).href, false);
      fs.writeFileSync(cssPath, rewrittenCss);
    } catch (error) {
      log(`Failed to rewrite CSS: ${cssFile}`, 'warn');
    }
  }
  
  // Rewrite JavaScript files
  log(`Rewriting JavaScript files for offline use...`);
  const jsFiles = fs.readdirSync(outputDir, { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.js'));
  
  for (const jsFile of jsFiles) {
    const jsPath = path.join(outputDir, jsFile);
    try {
      const jsContent = fs.readFileSync(jsPath, 'utf-8');
      const rewrittenJs = rewriteJsUrls(jsContent, new URL(jsFile, bookInfo.baseUrl).href, bookInfo);
      fs.writeFileSync(jsPath, rewrittenJs);
    } catch (error) {
      log(`Failed to rewrite JS: ${jsFile}`, 'warn');
    }
  }
  
  // Rewrite JSON config files
  log(`Rewriting JSON config files for offline use...`);
  const jsonFiles = fs.readdirSync(outputDir, { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.json'));
  
  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(outputDir, jsonFile);
    try {
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const rewrittenJson = rewriteJsonUrls(jsonContent, new URL(jsonFile, bookInfo.baseUrl).href, bookInfo);
      fs.writeFileSync(jsonPath, rewrittenJson);
    } catch (error) {
      log(`Failed to rewrite JSON: ${jsonFile}`, 'warn');
    }
  }
  
  // Calculate stats
  const stats = {
    downloaded: results.filter(r => r.status === 'downloaded').length,
    cached: results.filter(r => r.status === 'cached').length,
    failed: results.filter(r => r.status === 'failed').length,
    pages: pageImages.length,
    files: results.filter(r => r.localPath).map(r => r.localPath),
  };
  
  // Create verification page
  createVerificationPage(outputDir, stats);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  log(`Download Complete!`, 'success');
  console.log('='.repeat(50));
  console.log(`${colors.green}Downloaded:${colors.reset} ${stats.downloaded} assets`);
  console.log(`${colors.yellow}Cached:${colors.reset} ${stats.cached} assets`);
  console.log(`${colors.red}Failed:${colors.reset} ${stats.failed} assets`);
  console.log(`${colors.cyan}Pages:${colors.reset} ${stats.pages} page images`);
  console.log(`${colors.dim}Output:${colors.reset} ${outputDir}`);
  console.log('\nFiles created:');
  console.log(`  - index.html (main entry point)`);
  console.log(`  - mobile.html (if available)`);
  console.log(`  - verify.html (verification page)`);
  console.log('\nTo verify: Open verify.html in a browser');
  
  // Log failed downloads
  if (stats.failed > 0) {
    console.log(`\n${colors.yellow}Failed downloads:${colors.reset}`);
    results.filter(r => r.status === 'failed').slice(0, 10).forEach(r => {
      console.log(`  - ${r.url}: ${r.error}`);
    });
  }
  
  return { outputDir, stats };
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}FlipHTML5 Downloader${colors.reset}
Downloads FlipHTML5 books for offline use in WebView/mobile apps.

${colors.yellow}Usage:${colors.reset}
  node fliphtml5-downloader.js <book-url> [output-folder]

${colors.yellow}Examples:${colors.reset}
  node fliphtml5-downloader.js https://fliphtml5.com/abcde/fghij
  node fliphtml5-downloader.js https://fliphtml5.com/abcde/fghij my-offline-book

${colors.yellow}Options:${colors.reset}
  --help, -h    Show this help message

${colors.yellow}Output:${colors.reset}
  Creates a folder with:
  - index.html      Main entry point
  - mobile.html     Mobile version (if available)
  - verify.html     Verification/testing page
  - css/            Stylesheets
  - js/             JavaScript files
  - files/          Page images and assets
  - images/         UI images
`);
    process.exit(0);
  }
  
  const bookUrl = args[0];
  const outputFolder = args[1];
  
  try {
    await downloadFlipHTML5Book(bookUrl, outputFolder);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

main();
