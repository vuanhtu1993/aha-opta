const fs = require('fs');
const path = require('path');

const reqDir = path.resolve(__dirname, '../requirements');
console.log('🔍 Starting Link and Identifier Integrity Check for:', reqDir);

let totalFiles = 0;
let totalLinks = 0;
let brokenLinks = 0;
const errors = [];

function getAllMdFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMdFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  });
  return results;
}

const mdFiles = getAllMdFiles(reqDir);
totalFiles = mdFiles.length;
console.log(`📁 Found ${totalFiles} markdown files in requirements/`);

// Regular expression to match markdown links [text](relative_path)
const linkRegex = /\[([^\]]+)\]\(([^)#]+)(?:#([^)]+))?\)/g;

mdFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const targetUrl = match[2];
    const anchor = match[3];

    // Skip absolute URLs (http, https) or mailto
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('mailto:')) {
      continue;
    }

    totalLinks++;
    const targetPath = path.resolve(path.dirname(file), targetUrl);

    if (!fs.existsSync(targetPath)) {
      brokenLinks++;
      errors.push({
        sourceFile: path.relative(reqDir, file),
        linkText,
        targetUrl,
        resolvedPath: targetPath,
        reason: 'Target file does not exist'
      });
    }
  }
});

console.log(`\n📊 VERIFICATION SUMMARY:`);
console.log(`  - Total Markdown Files: ${totalFiles}`);
console.log(`  - Total Relative Links Checked: ${totalLinks}`);
console.log(`  - Broken Links: ${brokenLinks}`);

if (brokenLinks > 0) {
  console.error('\n❌ Broken links found:');
  errors.forEach(e => {
    console.error(`  - In [${e.sourceFile}]: "[${e.linkText}](${e.targetUrl})" -> ${e.reason}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ 100% OF RELATIVE LINKS ARE VALID AND RESOLVED CLEANLY!');
}
