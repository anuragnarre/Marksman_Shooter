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

let patched = 0;

for (const file of dtoFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Add Transform import if IsString is used and Transform is not imported
  if (content.includes('@IsString(') && !content.includes('Transform')) {
    if (content.includes("from 'class-transformer'")) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+'class-transformer';/, (match, p1) => {
        return `import { ${p1}, Transform } from 'class-transformer';`;
      });
    } else {
      content = `import { Transform } from 'class-transformer';\n` + content;
    }
    changed = true;
  }

  // Regex to find @IsString() properties
  // It looks for @IsString() followed by optional decorators, and then the property name
  const propertyRegex = /@IsString\(\)[\s\S]*?(?=\w+\??\s*:)/g;
  
  content = content.replace(propertyRegex, (match) => {
    let newMatch = match;
    let localChanged = false;
    if (!match.includes('@Transform(')) {
      newMatch = newMatch + `  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)\n`;
      localChanged = true;
    }
    if (!match.includes('@MaxLength(')) {
      newMatch = newMatch + `  @MaxLength(255)\n`;
      localChanged = true;
      // ensure MaxLength is imported
      if (!content.includes('MaxLength')) {
        if (content.includes("from 'class-validator'")) {
          content = content.replace(/import\s+{([^}]*)}\s+from\s+'class-validator';/, (m, p1) => {
            return `import { ${p1}, MaxLength } from 'class-validator';`;
          });
        }
      }
    }
    if (localChanged) changed = true;
    return newMatch;
  });

  if (changed) {
    fs.writeFileSync(file, content);
    patched++;
    console.log(`Patched: ${file}`);
  }
}

console.log(`Finished patching ${patched} DTOs.`);
