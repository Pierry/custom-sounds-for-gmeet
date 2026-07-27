# Custom Sounds for GMeet

Replace Google Meet's join, leave, and raise-hand sounds with your own, in 3D spatial audio. Configure everything in a web UI, export a single self-contained bookmarklet, and run it on any Meet call. No extension, no server at runtime.

![license](https://img.shields.io/badge/license-MIT-blue) ![runtime](https://img.shields.io/badge/runtime-bookmarklet-7c5cff)

## Features

- Pick a sound per action: join, leave, raise hand.
- 3D binaural playback (HRTF) with selectable motion (orbit, fly by, approach, overhead, static) and adjustable reverb.
- Exports one self-contained bookmarklet. Sounds are embedded, so there are no network calls at runtime and it works under Meet's content security policy.
- Automatic detection of join, leave, and raise-hand events.
- Bring your own sound: paste a URL per action instead of a preset.
- Material Design 3 configurator UI (Lexend, dark theme, animated background).

## How it works

Google Meet plays its interface sounds through the Web Audio API. The bookmarklet patches `AudioBufferSourceNode.start`, identifies join, leave, and raise-hand events, suppresses Meet's own sound, and plays your sound instead through an HRTF panner and a convolution reverb. Because the audio is embedded as base64 and decoded locally, there are no external requests while a call is running.

Event detection:

- Join is matched by the duration of Meet's own join sound (learned cross origin from the gstatic asset via an audio element, no CORS required) or by an increase in the participant tile count.
- Leave is matched by a decrease in the participant tile count, so chat and notification sounds are not affected.
- Raise hand does not change the participant count, so its duration is learned once through the Learn hand button and reused afterwards.

## Setup

Requirements: a modern browser (tested on Chrome), a static file server such as `python3 -m http.server`, and `bash` plus `curl` for the sound download. Headphones are needed to hear the 3D effect.

1. Clone the repository:

   ```
   git clone https://github.com/Pierry/custom-sounds-for-gmeet
   cd custom-sounds-for-gmeet
   ```

2. Download the default sound set into `sounds/`:

   ```
   bash scripts/fetch-sounds.sh
   ```

3. Serve the app:

   ```
   python3 -m http.server 8137
   ```

4. Open `http://localhost:8137/` and configure a sound and motion for each action.
5. Click Copy bookmarklet. Create a new bookmark and paste the value as its URL, or drag the generated link to your bookmarks bar.
6. Open a Google Meet call and click the bookmark. A panel appears in the corner. Use it to test each sound. For raise hand, click Learn hand and raise your hand once so the tool can learn the sound.

Whenever you change a sound in the configurator, generate the bookmarklet again.

## Sounds and licensing

- Source code is licensed under MIT. See [LICENSE](LICENSE).
- The default sounds are downloaded from [Mixkit](https://mixkit.co) and are subject to the [Mixkit Free License](https://mixkit.co/license/). They are not redistributed in this repository. `scripts/fetch-sounds.sh` fetches them into `sounds/` for local use only.
- You can replace any file in `sounds/` with your own audio, or paste a URL per action in the configurator.

## Project layout

```
index.html              Configurator UI and bookmarklet generator
scripts/fetch-sounds.sh Downloads the default sound set into sounds/
sounds/                 Local audio (not committed)
LICENSE
README.md
```

## Limitations

- The generated bookmarklet is large (roughly 100 to 300 KB) because the sounds are embedded.
- The in-call panel uses system fonts because Meet's content security policy blocks external fonts. The configurator UI uses Material Design 3.
- Detection depends on Meet's current assets and DOM. If Meet changes them, update `KNOWN_JOIN` or the participant selector in `index.html`.

## Contributing

Issues and pull requests are welcome. Keep the runtime free of external dependencies and safe under Meet's content security policy: no network fetches while a call is running.

## License

MIT for the code. Audio is under its own license, described in Sounds and licensing.
