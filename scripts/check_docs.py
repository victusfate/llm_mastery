#!/usr/bin/env python3
"""Check local Markdown links and code fences without network access."""
import re
from pathlib import Path
from urllib.parse import unquote
ROOT = Path(__file__).resolve().parents[1]
errors = []
files = [p for p in ROOT.rglob('*.md') if not any(x.startswith('.') or x in {'node_modules', 'private', 'dist'} for x in p.relative_to(ROOT).parts)]
for path in files:
    content = path.read_text()
    if sum(line.startswith('```') for line in content.splitlines()) % 2:
        errors.append(f'{path.relative_to(ROOT)}: unclosed code fence')
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', content):
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target) or target.startswith('#'):
            continue
        local = unquote(target.split('#')[0].split('?')[0]).strip('<>')
        if local and not (path.parent / local).exists():
            errors.append(f'{path.relative_to(ROOT)}: missing {target}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'Checked local links and code fences in {len(files)} Markdown files.')
