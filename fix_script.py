import os
import re

def main():
    directory = "."
    found = False
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".ts"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'console.warn' in content or 'GROQ_API_KEY' in content:
                        print(f"Match found in: {path}")
                        found = True

    if not found:
        print("No matches found.")

if __name__ == "__main__":
    main()
