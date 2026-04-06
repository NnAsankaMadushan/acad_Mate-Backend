const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'scripts', 'populatePastPapers.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'function extractMetadataFromFilename(filename, categoryPath) {',
  "function extractMetadataFromFilename(filename, categoryPath, defaultSubject = 'General') {"
);

content = content.replace(
  'const pathParts = categoryPath.split(/[\\/]/);',
  "const pathSubject = defaultSubject || 'General';"
);

content = content.replace(
  '  if (pathParts.length > 2) {\n    const potentialSubject = pathParts[1];\n    if (potentialSubject && !potentialSubject.match(/Grade\\s*\\d+|O\\/L|A\\/L/i)) {\n      subject = potentialSubject;\n    }\n  }\n\n',
  ''
);

const helper = `\nfunction normalizeStream(streamName) {\n  const raw = String(streamName || '').trim();\n  if (!raw) return 'All';\n  const cleaned = raw.replace(/\\s*Stream$/i, '').trim();\n\n  if (/^science$/i.test(cleaned)) return 'Science';\n  if (/^commerce$/i.test(cleaned)) return 'Commerce';\n  if (/^arts$/i.test(cleaned)) return 'Arts';\n  if (/^technology$/i.test(cleaned) || /^tech$/i.test(cleaned)) return 'Technology';\n\n  return cleaned;\n}\n\nfunction extractPathMetadata(categoryPath) {\n  const parts = String(categoryPath || '').split(/[\\/]/).filter(Boolean);\n  const metadata = {\n    grade: 'All',\n    stream: 'All',\n    subject: 'General',\n  };\n\n  if (parts.length === 0) return metadata;\n\n  metadata.grade = normalizeGrade(parts[0]).grade;\n\n  if (parts.length === 2) {\n    metadata.subject = parts[1];\n    return metadata;\n  }\n\n  if (parts.length >= 3) {\n    metadata.stream = normalizeStream(parts[1]);\n    metadata.subject = parts[parts.length - 1];\n    return metadata;\n  }\n\n  return metadata;\n}\n\n`;

content = content.replace(
  'return { grade, stream };\r\n}\r\n\r\nasync function scanDirectory(dirPath, relativeCategory = "") {',
  `return { grade, stream };\r\n}\r\n${helper}async function scanDirectory(dirPath, relativeCategory = "") {`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('patch complete');
