const fs = require('fs');
const path = require('path');

const srcDir = 'D:/App and Hardware Project/App/Marksman/Range_App/apps/api/src';

function findDtoFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findDtoFiles(filePath, fileList);
    } else if (filePath.endsWith('.dto.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const dtoFiles = findDtoFiles(srcDir);
let patchedCount = 0;

for (const file of dtoFiles) {
  let lines = fs.readFileSync(file, 'utf-8').split('\n');
  let newLines = [];
  let i = 0;
  
  let isStringFound = false;
  let transformFound = false;
  let maxLengthFound = false;
  let decoratorsToInject = [];
  let fileChanged = false;
  
  let needsTransformImport = false;
  let needsMaxLengthImport = false;

  while (i < lines.length) {
    let line = lines[i];
    
    // Check if line contains @IsString()
    if (line.match(/^\s*@IsString\(\)/)) {
      isStringFound = true;
    }
    
    if (isStringFound) {
      if (line.match(/^\s*@Transform/)) transformFound = true;
      if (line.match(/^\s*@MaxLength/)) maxLengthFound = true;
      
      // Look for the property declaration: e.g. "name: string;", "name?: string;"
      const propMatch = line.match(/^(\s*)([a-zA-Z0-9_]+)([!?]?\s*:\s*string.*)$/);
      if (propMatch) {
        const indent = propMatch[1];
        if (!transformFound) {
          decoratorsToInject.push(`${indent}@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)`);
          needsTransformImport = true;
          fileChanged = true;
        }
        if (!maxLengthFound) {
          decoratorsToInject.push(`${indent}@MaxLength(255)`);
          needsMaxLengthImport = true;
          fileChanged = true;
        }
        
        // Insert the decorators
        newLines.push(...decoratorsToInject);
        newLines.push(line);
        
        // Reset state
        isStringFound = false;
        transformFound = false;
        maxLengthFound = false;
        decoratorsToInject = [];
        i++;
        continue;
      }
    }
    
    newLines.push(line);
    i++;
  }
  
  if (fileChanged) {
    let content = newLines.join('\n');
    
    // Add imports if needed
    if (needsTransformImport && !content.includes('Transform')) {
      if (content.includes("from 'class-transformer'")) {
        content = content.replace(/import\s+{([^}]*)}\s+from\s+'class-transformer';/, (match, p1) => {
          return `import { ${p1}, Transform } from 'class-transformer';`;
        });
      } else {
        content = `import { Transform } from 'class-transformer';\n` + content;
      }
    }
    
    if (needsMaxLengthImport && !content.includes('MaxLength')) {
      if (content.includes("from 'class-validator'")) {
        content = content.replace(/import\s+{([^}]*)}\s+from\s+'class-validator';/, (match, p1) => {
          return `import { ${p1}, MaxLength } from 'class-validator';`;
        });
      } else {
        content = `import { MaxLength } from 'class-validator';\n` + content;
      }
    }
    
    fs.writeFileSync(file, content);
    patchedCount++;
    console.log(`Patched safely: ${file}`);
  }
}

console.log(`Finished patching ${patchedCount} DTOs safely.`);
