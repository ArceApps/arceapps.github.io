import os
import uuid
import re

BLOG_DIR = "src/content/blog/es"

def add_reference_id():
    if not os.path.exists(BLOG_DIR):
        print(f"Directory {BLOG_DIR} not found.")
        return

    for filename in os.listdir(BLOG_DIR):
        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(BLOG_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if "reference_id:" in content:
            # print(f"Skipping {filename}: reference_id already exists")
            continue

        # Extract frontmatter
        match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        if match:
            frontmatter = match.group(1)
            new_id = str(uuid.uuid4())
            new_frontmatter = frontmatter + f"\nreference_id: \"{new_id}\""
            new_content = content.replace(frontmatter, new_frontmatter, 1)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Added reference_id to {filename}")
        else:
            print(f"Warning: Could not parse frontmatter in {filename}")

if __name__ == "__main__":
    add_reference_id()
