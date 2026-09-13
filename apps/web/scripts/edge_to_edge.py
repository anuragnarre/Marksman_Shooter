import re

def edge_to_edge_overhaul():
    page_path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/app/page.tsx"
    nav_path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/components/MarketingNav.tsx"
    
    # Update page.tsx
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We want edge to edge spread, so we replace max-w-7xl mx-auto and max-w-6xl mx-auto 
    # with a wide padding container w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24
    content = re.sub(r'max-w-[a-zA-Z0-9]+ mx-auto px-[0-9a-zA-Z:-]+', 'w-full px-6 md:px-12 lg:px-24 2xl:px-32', content)
    content = re.sub(r'max-w-[a-zA-Z0-9]+ mx-auto', 'w-full px-6 md:px-12 lg:px-24 2xl:px-32', content)
    
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(content)

    # Update MarketingNav.tsx
    with open(nav_path, "r", encoding="utf-8") as f:
        nav_content = f.read()
    
    nav_content = re.sub(r'max-w-[a-zA-Z0-9]+ mx-auto px-[0-9]+', 'w-full px-6 md:px-12 lg:px-24 2xl:px-32', nav_content)

    with open(nav_path, "w", encoding="utf-8") as f:
        f.write(nav_content)

if __name__ == "__main__":
    edge_to_edge_overhaul()
