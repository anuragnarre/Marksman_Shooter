import re

def refactor_canvas_and_nav():
    canvas_path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/components/MiniTargetCanvas.tsx"
    nav_path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/components/MarketingNav.tsx"
    
    # Update MiniTargetCanvas.tsx
    with open(canvas_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace hardcoded strokes like rgba(255,255,255,0.1) with var(--border-default)
    content = re.sub(
        r'stroke=[\'"]rgba\(255,\s*255,\s*255,\s*0\.1\)[\'"]',
        r'stroke="var(--border-default)"',
        content
    )
    content = re.sub(
        r'stroke=[\'"]#2A2D3A[\'"]',
        r'stroke="var(--border-default)"',
        content
    )
    # Replace white strokes with primary text
    content = re.sub(
        r'stroke=[\'"]#FFFFFF[\'"]',
        r'stroke="var(--text-primary)"',
        content
    )
    content = re.sub(
        r'fill=[\'"]#FFFFFF[\'"]',
        r'fill="var(--text-primary)"',
        content
    )
    # Remove isDark props if passed to canvas if it existed
    with open(canvas_path, "w", encoding="utf-8") as f:
        f.write(content)

    # Update MarketingNav.tsx
    with open(nav_path, "r", encoding="utf-8") as f:
        nav = f.read()
    
    # Replace bg-[#080A0F]/80 with bg-[var(--bg-void)]/80 or just rely on global classes
    # Because it's hard to combine CSS vars with Tailwind opacity via standard classes if not configured,
    # let's just write style={{ backgroundColor: 'var(--bg-void)', opacity: 0.9 }}
    # or just use tailwind's backdrop-blur since it handles the frosted glass
    # Let's replace 'bg-[#080A0F]/80' with 'bg-[var(--bg-void)] bg-opacity-80' which works in tailwind if var is just hex. 
    # But wait, --bg-void is hex. bg-[var(--bg-void)] does not support opacity modifier directly in v3 unless it's configured in RGB space.
    # So we replace bg-[#080A0F]/80 with style={{ backgroundColor: 'var(--bg-void)' }} or bg-transparent if blurred.
    # We will just replace it with bg-[var(--bg-void)] which gives a solid background, the blur will just sit behind it. Let's make it solid to respect Human-UI anti-blur rules.
    nav = nav.replace('bg-[#080A0F]/80 backdrop-blur-md', 'bg-[var(--bg-void)] border-b border-[var(--border-subtle)]')
    nav = nav.replace('bg-[#080A0F]', 'bg-[var(--bg-void)]')
    
    with open(nav_path, "w", encoding="utf-8") as f:
        f.write(nav)

if __name__ == "__main__":
    refactor_canvas_and_nav()
