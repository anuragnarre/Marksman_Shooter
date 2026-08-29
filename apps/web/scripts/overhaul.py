import re
import sys

def overhaul_page():
    path = "d:/App and Hardware Project/App/Marksman/shooting/apps/web/app/page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace soft rounded corners with sharper tactical ones
    # For large cards
    content = content.replace("rounded-3xl", "rounded-sm")
    content = content.replace("rounded-2xl", "rounded-sm")
    content = content.replace("rounded-[24px]", "rounded-sm")
    content = content.replace("rounded-[20px]", "rounded-sm")
    content = content.replace("rounded-[14px]", "rounded-[4px]")
    content = content.replace("rounded-[10px]", "rounded-[2px]")
    content = content.replace("rounded-[8px]", "rounded-[2px]")
    content = content.replace("rounded-[6px]", "rounded-[2px]")
    content = content.replace("rounded-[5px]", "rounded-[2px]")
    
    # Typography: replace some font-display with text-left etc if needed, but the prompt says 
    # "Ensure JetBrains Mono is used for all numbers". We already have font-mono on numbers.
    # The prompt says: "Implement intentional hanging punctuation or asymmetrical alignments."
    
    # Update bento grid symmetry
    content = content.replace("p-10", "p-8 md:pl-10 md:pr-16")
    content = content.replace("p-8", "p-6 md:pl-8 md:pr-12")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        
if __name__ == "__main__":
    overhaul_page()
