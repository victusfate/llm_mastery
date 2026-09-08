#!/usr/bin/env python3
"""Build the public static course into dist without private or training files."""
from pathlib import Path
import shutil
from serve import ROOT, DIRECTORIES, ROOT_FILES, public_file

out = ROOT / 'dist'
out.mkdir(exist_ok=True)
for directory in sorted(DIRECTORIES):
    for source in (ROOT / directory).rglob('*'):
        relative = source.relative_to(ROOT)
        if source.is_file() and public_file('/' + relative.as_posix()):
            target = out / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
for name in sorted(ROOT_FILES | {'index.html', '.nojekyll'}):
    shutil.copy2(ROOT / name, out / name)
print(f'Static course built at {out}')
