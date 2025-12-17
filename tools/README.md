# FlipHTML5 Offline Downloader Tools

This folder contains tools to download FlipHTML5 digital books for offline use in WebView or React Native applications.

## Files

- **fliphtml5-downloader.js** - Main downloader script
- **serve-offline-book.js** - Local server for testing offline books

## Requirements

- Node.js 14+ (no additional dependencies needed)

## Quick Start

### 1. Download a FlipHTML5 Book

```bash
# Basic usage
node tools/fliphtml5-downloader.js https://fliphtml5.com/xxxxx/yyyyy

# With custom output folder
node tools/fliphtml5-downloader.js https://fliphtml5.com/xxxxx/yyyyy my-offline-book
```

### 2. Test the Offline Book

```bash
# Start local server
node tools/serve-offline-book.js ./my-offline-book 8080

# Open http://localhost:8080 in your browser
```

### 3. Verify the Download

Open `verify.html` in the output folder to:
- Check download statistics
- Test the flipbook
- View the list of downloaded files

## Output Structure

```
my-offline-book/
├── index.html          # Main entry point
├── mobile.html         # Mobile version (if available)
├── verify.html         # Verification page
├── css/                # Stylesheets
├── js/                 # JavaScript files
├── files/              # Page images
│   ├── mobile/         # Mobile-optimized images
│   ├── large/          # Full-size images
│   └── thumb/          # Thumbnails
├── images/             # UI assets
└── external/           # External CDN assets
```

## Using in React Native WebView

### Basic Integration

```jsx
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';

function OfflineBookViewer({ bookPath }) {
  return (
    <WebView
      source={{ uri: `file://${bookPath}/index.html` }}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      originWhitelist={['*']}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      style={{ flex: 1 }}
    />
  );
}
```

### Copying to App Bundle

1. Copy the offline book folder to your assets directory
2. On Android: Place in `android/app/src/main/assets/`
3. On iOS: Add the folder to your Xcode project

### Dynamic Loading (Download to Device)

```javascript
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';

async function loadOfflineBook(zipUrl, bookId) {
  const localPath = `${RNFS.DocumentDirectoryPath}/books/${bookId}`;
  const zipPath = `${localPath}.zip`;
  
  // Download zip
  await RNFS.downloadFile({
    fromUrl: zipUrl,
    toFile: zipPath,
  }).promise;
  
  // Extract
  await unzip(zipPath, localPath);
  
  // Delete zip
  await RNFS.unlink(zipPath);
  
  return localPath;
}
```

## Using in Android APK (Native WebView)

### AndroidManifest.xml

```xml
<application
    android:usesCleartextTraffic="true"
    android:hardwareAccelerated="true">
    <!-- ... -->
</application>
```

### Activity Code

```java
WebView webView = findViewById(R.id.webview);
WebSettings settings = webView.getSettings();

settings.setJavaScriptEnabled(true);
settings.setDomStorageEnabled(true);
settings.setAllowFileAccess(true);
settings.setAllowFileAccessFromFileURLs(true);
settings.setAllowUniversalAccessFromFileURLs(true);

// Load from assets
webView.loadUrl("file:///android_asset/offline-book/index.html");

// Or from external storage
String path = Environment.getExternalStorageDirectory() + "/books/my-book/index.html";
webView.loadUrl("file://" + path);
```

## Troubleshooting

### Missing Assets

Some FlipHTML5 books load assets dynamically via JavaScript. If assets are missing:

1. Open the book in Chrome
2. Open DevTools (F12) > Network tab
3. Refresh and note all loaded resources
4. Manually add those URLs to the download

### CORS Issues

If running locally, use the included server instead of file:// protocol:

```bash
node tools/serve-offline-book.js ./my-offline-book
```

### SVG/Hotspot Not Working

SVG images and interactive hotspots in FlipHTML5 require a web server (even locally). They won't work with `file://` protocol directly.

### Book Structure Variations

FlipHTML5 has different versions. If the default patterns don't work:

1. Check the book's page source for image URL patterns
2. Look for `bookConfig` or similar JavaScript objects
3. Modify the downloader's `downloadBookPages` patterns

## Known Limitations

FlipHTML5 books use various structures. The downloader handles:

**What Works Well:**
- Static HTML, CSS, JavaScript assets
- Page images (mobile/large/thumb)
- Config files (JSON, bookConfig.js)
- Font files (WOFF, TTF, etc.)
- Audio/video embedded in pages

**Potential Issues:**
- Some books load assets dynamically via AJAX - these may need manual addition
- Interactive hotspots may not work offline (FlipHTML5 restriction)
- SVG features require a local web server (won't work with file:// protocol)
- CDN-hosted third-party scripts may need internet access

**Workarounds:**
1. Use the included `serve-offline-book.js` for testing
2. For WebView apps, use a local HTTP server or bundle assets properly
3. If pages don't load, check browser console for 404 errors and manually download missing files

## Security Notice

- Only download books you have the rights to use offline
- Respect copyright and licensing terms
- This tool is for personal/educational use

## API Reference

### fliphtml5-downloader.js

```bash
node fliphtml5-downloader.js <book-url> [output-folder]

Options:
  --help, -h    Show help
  
Arguments:
  book-url      FlipHTML5 book URL (required)
  output-folder Custom output folder name (optional)
```

### serve-offline-book.js

```bash
node serve-offline-book.js [folder-path] [port]

Options:
  --help, -h    Show help
  
Arguments:
  folder-path   Path to offline book (default: current dir)
  port          Server port (default: 8080)
```
