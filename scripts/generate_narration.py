#!/usr/bin/env python3
"""Optional narration authoring; requires edge-tts.
Only public course text is sent to the online TTS service. Playback is static.
"""
import argparse
import asyncio
from pathlib import Path
import re
import edge_tts

ROOT = Path(__file__).resolve().parents[1]


def narration_jobs():
    jobs = []
    source = (ROOT / 'docs/13-foundations-lecture.md').read_text()
    for section in source.split('\n## ')[1:]:
        title, text = section.split('\n', 1)
        number = int(title.split('.')[0])
        jobs.append((f'foundations-{number:02d}.mp3', text.strip()))
    for path in sorted((ROOT / 'modules').glob('*.md')):
        if path.name.startswith(('00-', '01-')):
            continue
        source = path.read_text().split('## Dedicated lab pages')[0]
        source = re.sub(r'```.*?```', '', source, flags=re.S)
        source = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', source)
        lines = [re.sub(r'^#+\s*', '', line).replace('`', '') for line in source.splitlines() if not line.startswith('|')]
        jobs.append((f'{path.stem}.mp3', '\n'.join(lines)))
    for path in sorted((ROOT / 'docs/submodules').glob('*.md')):
        if not path.name.startswith('01-'):
            jobs.append((f'submodule-{path.stem}.mp3', path.read_text().split('## Spoken transcript\n', 1)[1].strip()))
    return jobs


async def main(voice):
    output = ROOT / 'site/audio'
    output.mkdir(exist_ok=True)
    async def generate(name, text):
        temporary = output / (name + '.partial')
        try:
            await edge_tts.Communicate(text, voice, rate='-3%').save(str(temporary))
            temporary.replace(output / name)
            print(f'Generated {name} with {voice}', flush=True)
        finally:
            temporary.unlink(missing_ok=True)
    jobs = narration_jobs()
    for i in range(0, len(jobs), 2):
        await asyncio.gather(*(generate(*job) for job in jobs[i:i+2]))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--voice', default='en-NZ-MitchellNeural')
    args = parser.parse_args()
    asyncio.run(main(args.voice))
