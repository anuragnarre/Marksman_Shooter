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

let reverted = 0;

for (const file of dtoFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Remove the injected Transform lines
  content = content.replace(/  @Transform\(\(\{ value \}\) => typeof value === 'string' \? value\.trim\(\) : value\)\n/g, '');
  
  // Remove the injected MaxLength(255) lines
  content = content.replace(/  @MaxLength\(255\)\n/g, '');

  // Remove the injected import { Transform } from 'class-transformer';
  content = content.replace(/import { Transform } from 'class-transformer';\n/g, '');

  // Revert the injected Transform in the import block
  content = content.replace(/import\s+{([^}]*),\s*Transform\s*}\s+from\s+'class-transformer';/g, "import { $1 } from 'class-transformer';");
  
  // Revert the injected MaxLength in the import block
  content = content.replace(/import\s+{([^}]*),\s*MaxLength\s*}\s+from\s+'class-validator';/g, "import { $1 } from 'class-validator';");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    reverted++;
    console.log(`Reverted: ${file}`);
  }
}

console.log(`Finished reverting ${reverted} DTOs.`);
