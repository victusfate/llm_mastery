# Course narration

These MP3 files narrate original course text with Microsoft's `en-NZ-MitchellNeural` voice, generated using edge-tts 7.2.8 at rate -3%. It is a stock synthetic New Zealand voice, not a recording or imitation of a named person.

Reproduce the audio from the repository root:

```bash
python3 -m pip install edge-tts==7.2.8
python3 scripts/generate_narration.py
```

The foundation scripts are in `docs/13-foundations-lecture.md`; other short clips use each submodule's Spoken transcript section. Full-module recordings read prose with code and tables omitted. Read the accompanying text for exact equations and implementation details.

Voice generation requires network access. Existing audio playback requires only the static site. See [edge-tts](https://github.com/rany2/edge-tts) and [Microsoft's voice list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts).
