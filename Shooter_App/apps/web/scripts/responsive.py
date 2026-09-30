import re

def responsive_overhaul():
    path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/app/page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Hero Section Grid & Typography
    # Find grid-cols-2 in hero and make it responsive
    content = content.replace('className="grid grid-cols-2 gap-12 items-center"', 'className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"')
    content = content.replace('text-6xl font-bold', 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold')
    
    # Hero max width
    content = content.replace('max-w-6xl mx-auto px-6', 'max-w-7xl mx-auto px-4 md:px-8')
    content = content.replace('max-w-6xl mx-auto px-8', 'max-w-7xl mx-auto px-4 md:px-8')

    # 2. Bento Grid
    # Replace grid-cols-2 and grid-cols-3 with dynamic scales
    # Wait, the bento grid is often set as a hard grid-cols-3 or 2.
    content = content.replace('grid-cols-2 lg:grid-cols-3', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
    content = content.replace('grid-cols-3 gap-6', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6')
    
    # 3. Features Sections
    content = content.replace('text-4xl font-bold', 'text-3xl md:text-4xl lg:text-5xl font-bold')
    
    # 4. How it Works (Steps)
    # They are likely flex or grid. Let's make sure flex-col on mobile, flex-row on md
    content = content.replace('flex gap-12', 'flex flex-col md:flex-row gap-8 md:gap-12')
    content = content.replace('grid grid-cols-3', 'grid grid-cols-1 md:grid-cols-3')

    # 5. Pricing
    content = content.replace('grid md:grid-cols-3', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
    
    # 6. Adjusting static paddings to be responsive
    content = content.replace('py-32 lg:py-44', 'py-20 md:py-32 lg:py-44')
    content = content.replace('py-40 lg:py-52', 'py-24 md:py-40 lg:py-52')
    
    # Feature card padding
    content = content.replace('p-8 md:pl-10 md:pr-16', 'p-6 sm:p-8 md:pl-10 md:pr-16')
    content = content.replace('p-6 md:pl-8 md:pr-12', 'p-5 sm:p-6 md:pl-8 md:pr-12')

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    responsive_overhaul()
