const fs = require('fs');

const darkHtml = fs.readFileSync('C:/Users/Anurag/Downloads/Markman UI/stitch_compact_desktop_dashboard_ui dark mode/command_center_precision_operations_dark_mode/code.html', 'utf8');
const lightHtml = fs.readFileSync('C:/Users/Anurag/Downloads/Markman UI/stitch_compact_desktop_dashboard_ui light mode/command_center_operational_terminal_light_mode/code.html', 'utf8');

function extractColors(html) {
  const match = html.match(/colors:({[^}]*})/);
  if (match) {
    // Add quotes to keys and parse
    let jsonStr = match[1].replace(/([{,]\s*)([a-zA-Z0-9-]+)\s*:/g, '$1"$2":');
    try {
      return JSON.parse(jsonStr);
    } catch(e) {
      console.error(e);
      return {};
    }
  }
  return {};
}

const darkColors = extractColors(darkHtml);
const lightColors = extractColors(lightHtml);

function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
  } else if (hex.length === 7) {
    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  }
  return `${+r} ${+g} ${+b}`;
}

const allKeys = [...new Set([...Object.keys(darkColors), ...Object.keys(lightColors)])];

let css = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root, .light {
`;

for (const key of allKeys) {
  if (lightColors[key]) {
    css += `    --${key}: ${hexToRgb(lightColors[key])};\n`;
  }
}

css += `  }\n\n  .dark {\n`;

for (const key of allKeys) {
  if (darkColors[key]) {
    css += `    --${key}: ${hexToRgb(darkColors[key])};\n`;
  } else if (lightColors[key]) {
    css += `    --${key}: ${hexToRgb(lightColors[key])};\n`;
  }
}

css += `  }\n}\n`;

let twConfigColors = {};
for (const key of allKeys) {
  twConfigColors[key] = `rgb(var(--${key}) / <alpha-value>)`;
}

console.log("=== CSS ===");
console.log(css);
console.log("=== Tailwind Colors ===");
console.log(JSON.stringify(twConfigColors, null, 2));

