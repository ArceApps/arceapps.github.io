#!/usr/bin/env python3
"""
Update internal /blog/ and /es/blog/ links in src/content/ markdown files
to match the new canonical EN slugs.

Strategy: for each (from_slug, to_slug) in the rename map (built from
git log of the two rename commits), replace every link `/blog/<from>` and
`/es/blog/<from>` with the new slug. Use a negative lookahead
`(?![a-z0-9-])` to ensure we match the COMPLETE slug and not a prefix
(prevents the bug where `clean-architecture` matched inside
`clean-architecture-android-ai`).
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path('src/content')

# Build the rename map from git log of the two recent rename commits.
result = subprocess.run(
    [
        'git',
        'log',
        '--diff-filter=R',
        '--name-status',
        '-2',
        '--',
        'src/content/blog/',
    ],
    capture_output=True,
    text=True,
    check=True,
)

rename_map: dict[str, str] = {}
for line in result.stdout.splitlines():
    if not line.startswith('R100'):
        continue
    parts = line.split('\t')
    if len(parts) != 3:
        continue
    _, from_path, to_path = parts
    from_slug = from_path.replace('src/content/blog/es/', '').replace('.md', '')
    to_slug = to_path.replace('src/content/blog/es/', '').replace('.md', '')
    if from_slug != to_slug:
        rename_map[from_slug] = to_slug

print(f'Rename map: {len(rename_map)} entries', file=sys.stderr)

# Slug character set: kebab-case ascii. After the slug, a non-slug char must follow.
SLUG_TAIL = r'(?![a-z0-9-])'

total_files = 0
total_replacements = 0
for md_file in ROOT.rglob('*.md'):
    text = original = md_file.read_text(encoding='utf-8')
    for from_slug, to_slug in rename_map.items():
        # Three patterns to handle:
        #   /blog/<from>          (clean old format)
        #   /blog/blog-<from>     (legacy 'blog-' prefix from previous SEO migrations)
        #   /es/blog/<from>       (ES clean old format)
        #   /es/blog/blog-<from>  (ES legacy 'blog-' prefix)
        # All followed by a non-slug char so we don't match prefixes.
        for prefix in ('/blog/', '/es/blog/'):
            for slug_prefix in ('', 'blog-'):
                pattern = (
                    re.escape(prefix)
                    + re.escape(slug_prefix)
                    + re.escape(from_slug)
                    + SLUG_TAIL
                )
                text, n = re.subn(pattern, prefix + to_slug, text)
                total_replacements += n
    if text != original:
        md_file.write_text(text, encoding='utf-8')
        total_files += 1

print(f'Updated {total_files} files, {total_replacements} total replacements', file=sys.stderr)
