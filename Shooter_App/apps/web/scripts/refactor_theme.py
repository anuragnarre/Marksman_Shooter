import re

def strip_inline_theme_styles():
    page_path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/app/page.tsx"
    
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace inline styles for card backgrounds with semantic classes
    # e.g., style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
    # We want these to just use the CSS variables or Tailwind classes like bg-[#161B26] dark/light mode
    # Wait, the tailwind config isn't aware of bg-bg-elevated unless it's configured in tailwind.config.ts.
    # Let's check tailwind.config.ts or just use style={{ backgroundColor: 'var(--bg-elevated)' }} instead of replacing classes if tailwind is not set up.
    
    content = re.sub(
        r'style=\{\{\s*background:\s*(?:isDark\s*\?\s*)?[\'"]rgba\([^)]+\)[\'"]\s*(?::\s*[\'"]rgba\([^)]+\)[\'"]\s*)?\}\}',
        r'style={{ backgroundColor: "var(--bg-elevated)" }}',
        content
    )
    
    content = re.sub(
        r'style=\{\{\s*background:\s*[\'"]rgba\([^)]+\)[\'"]\s*\}\}',
        r'style={{ backgroundColor: "var(--bg-elevated)" }}',
        content
    )
    
    content = re.sub(
        r'style=\{\{\s*background:\s*[\'"]var\(--bg-elevated\)[\'"]\s*\}\}',
        r'style={{ backgroundColor: "var(--bg-elevated)" }}',
        content
    )

    # 2. Border colors
    # border-white/5 -> border-[var(--border-subtle)] or similar. But since we added CSS vars, 
    # it's best to write a generic style or replace with CSS vars inline if tailwind classes aren't mapped.
    # Let's replace 'border-white/5' with 'border-[var(--border-subtle)]'
    # Wait, Tailwind bracket notation might not work perfectly with alpha vars, but var(--border-subtle) is just a color.
    content = content.replace('border-white/5', 'border-[var(--border-subtle)]')
    content = content.replace('border-white/10', 'border-[var(--border-default)]')
    content = content.replace('bg-white/5', 'bg-[var(--bg-elevated)]')
    
    # text colors
    content = content.replace('text-gray-400', 'text-[var(--text-secondary)]')
    content = content.replace('text-white', 'text-[var(--text-primary)]')
    content = content.replace('text-black', 'text-[var(--text-primary)]') # wait, text-black is for dark text, replace with generic text primary so it flips

    with open(page_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    strip_inline_theme_styles()
