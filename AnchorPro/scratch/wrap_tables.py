import os
import re
import glob

dashboard_dir = r"c:\Users\simwi\Desktop\Anchor Pro\AnchorPro\anchor-pro-web\src\app\dashboard"

# Files to process (recursively find all page.tsx)
page_files = glob.glob(os.path.join(dashboard_dir, "**", "page.tsx"), recursive=True)

import_statement = "import ResponsiveTable from '@/components/ResponsiveTable';\n"

for file_path in page_files:
    # Skip assets/page.tsx because we already manually updated it
    if "assets\\page.tsx" in file_path or "assets/page.tsx" in file_path:
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if file has a data-table that is NOT already wrapped
    # Since we might run this multiple times, we need to avoid double-wrapping
    if "data-table" not in content or "ResponsiveTable" in content:
        continue

    # Regex to find <table className="data-table">...</table>
    # We use a non-greedy match for everything inside
    table_pattern = re.compile(r'(<table[^>]*className=["\'][^"\']*data-table[^"\']*["\'][^>]*>.*?</table\s*>)', re.DOTALL)
    
    def wrap_table(match):
        table_html = match.group(1)
        # Find the indentation of the <table tag by looking at the lines before it
        # Actually easier to just wrap and let standard formatting do its best, 
        # or capture the preceding whitespace
        return f"<ResponsiveTable>\n{table_html}\n</ResponsiveTable>"

    new_content, count = table_pattern.subn(wrap_table, content)

    if count > 0:
        # Add import statement after the first block of imports or at the top
        if import_statement not in new_content:
            # Insert after the last import statement
            last_import_idx = new_content.rfind("import ")
            if last_import_idx != -1:
                end_of_line = new_content.find("\n", last_import_idx)
                new_content = new_content[:end_of_line+1] + import_statement + new_content[end_of_line+1:]
            else:
                # No imports? Just add at top
                new_content = import_statement + new_content

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path} (wrapped {count} tables)")
