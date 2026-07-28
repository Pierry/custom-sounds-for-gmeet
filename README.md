# Custom Sounds for GMeet

Replace Google Meet's join, leave, and raise-hand sounds with your own, in 3D spatial audio. A small browser extension runs on Meet and swaps the sounds automatically.

![license](https://img.shields.io/badge/license-MIT-blue) ![runtime](https://img.shields.io/badge/runtime-extension-7c5cff)

![demo](media/explainer.gif)

## Features

- Pick a sound per action: join, leave, raise hand.
- 3D binaural playback (HRTF) with selectable motion (orbit, fly by, approach, overhead, static) and adjustable reverb.
- Runs automatically on `meet.google.com` after you load the extension.
- Automatic detection of join, leave, and raise-hand events.
- On/off switch in the in-call panel to mute the custom sounds without removing the extension.
- Reset to factory in the config dialog to clear all saved choices and return to defaults.
- Configure everything from a panel inside the call. Preview any sound on the hosted page.

## Why an extension and not a bookmarklet

Google Meet ships a strict Content Security Policy (`script-src` with a nonce and `strict-dynamic`). In that mode browsers ignore `unsafe-inline`, so `javascript:` bookmarklets are blocked and never execute on Meet. A browser extension content script is exempt from the page CSP, so it is the only way to run this on Meet.

## Install

The extension is unpacked (developer mode). It takes about a minute.

1. Download the packaged extension: [custom-sounds-for-gmeet-extension.zip](https://pierry.github.io/custom-sounds-for-gmeet/custom-sounds-for-gmeet-extension.zip) (or clone this repo and use the `extension/` folder). Unzip it.
2. Open `chrome://extensions` in Chrome (paste it in the address bar).
3. Turn on Developer mode (top-right toggle).
4. Click Load unpacked and select the unzipped `custom-sounds-for-gmeet` folder.
5. Open a Google Meet call. A panel appears in the bottom-right corner.
6. Click Configure sounds, choose a sound and 3D motion for each action, and Save. For raise hand, click Learn and raise your hand once.
7. Use the On/off switch at the bottom of the panel to mute or unmute. If a stale sound persists after updating, open Configure sounds and click Reset to factory (click twice to confirm).

Headphones are recommended for the 3D effect. Rebuild the zip after changing the extension with `bash scripts/pack-extension.sh`.

## How it works

Google Meet plays its interface sounds through the Web Audio API. The extension has two content scripts:

- `detect.js` runs in the page's main world so it can patch `AudioBufferSourceNode.start`. It identifies join, leave, and raise-hand events, suppresses Meet's own sound, and dispatches an event.
- `ui.js` runs in the isolated world (with `chrome.runtime`). It plays the chosen sound through an HRTF panner and a convolution reverb, and provides the panel and configuration dialog.

Event detection:

- Join is matched by the duration of Meet's own join sound (learned cross origin from the gstatic asset via an audio element, no CORS required) or by an increase in the participant tile count.
- Leave is matched by a decrease in the participant tile count, so chat and notification sounds are not affected.
- Raise hand does not change the participant count, so its duration is learned once with the Learn button and reused afterwards.

## Preview page

The hosted page at https://pierry.github.io/custom-sounds-for-gmeet/ lets you audition every sound with the 3D motions and reverb before you decide. It is a design and preview tool; the actual sound swapping is done by the extension.

## Sounds and licensing

- Source code is licensed under MIT. See [LICENSE](LICENSE).
- The bundled sounds come from [Mixkit](https://mixkit.co) and are subject to the [Mixkit Free License](https://mixkit.co/license/). Credit to Mixkit and its creators.
- Replace any file in `extension/sounds/` (and `sounds/` for the preview page) with your own audio to use a different set.

## Project layout

```
extension/              The browser extension
  manifest.json
  detect.js             Main-world content script: detection and suppression
  ui.js                 Isolated-world content script: 3D playback, panel, config
  sounds/               Bundled audio
index.html              Hosted preview and sound designer
sounds/                 Audio for the preview page
video/                  Remotion project for the explainer and install videos
media/                  Rendered videos
LICENSE
README.md
```

## Limitations

- The extension is loaded unpacked, so Chrome may ask you to confirm it periodically.
- Detection depends on Meet's current assets and DOM. If Meet changes them, update `KNOWN_JOIN` or the participant selector in `extension/detect.js`.
- Tested on Chrome.

## Contributing

Issues and pull requests are welcome.

## License

MIT for the code. Audio is under its own license, described in Sounds and licensing.
