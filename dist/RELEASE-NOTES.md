# Cyber 72 — v1.2.0

Prepared 23 November 2026. Offline bilingual university project set in a fictionalized Old Dhaka district.

## Changes

- Pause → Restart game now starts a completely new run: level 1, 100 Health, no previous choices or mistakes, initial player position, reset city and camera. Name, language and settings remain saved. New game and death restart use the same initial campaign rules.
- Guidebook replaces Case journal and the learning-summary export. It explains movement, NPC conversations, health and progression, and provides task descriptions, warning signs and safety hints for all ten levels. Every page is available immediately, in English and Bangla. The current level opens by default.
- The guidebook opens automatically for a first play, New game, Pause → Restart game and death restart. Continue retains progress; help is always available from Pause → Guidebook. Reading help does not change health or level.
- The original twenty story recordings and sixty answer reactions are restored from the cached first versions, with the original Bangla subtitles. The files were not regenerated, re-pitched or sped up. No paid service was used.

## Verification

Automated checks cover a damaged, progressed campaign restarting at level 1 with 100 Health; fresh-run help; all ten unlocked guide pages in both languages; unchanged progress when opening help; all ten missions, death reset and completion; all 60 answer/gender selections, replay and cancellation. All 80 original MP3 files were decoded. The offline build is checked against its source scripts, textures, motion and audio; the editable ZIP is compared file by file.

Browser checks cover fresh-game guidebook, pause/restart, scrolling and responsive help layout. Existing movement, wardrobe and scene geometry are unchanged; earlier release geometry checks are not claims of new physical-device testing. Viewport checks do not establish Android/iOS performance.

## Demonstration

1. Start a fresh game and read the guidebook. Open a later level to show that help is already available.
2. Choose Ready. Let’s play, follow the amber marker and press E near the neighbour.
3. Listen to the original Bangla voice and choose a response. A wrong answer costs 40 Health.
4. Open Pause → Guidebook to read the current level’s advice.
5. Use Pause → Restart game. The guidebook returns and the campaign starts again at level 1 with 100 Health.

## Limits and credits

The project is not claimed to be government approved or accessibility certified. Test a complete session on the intended presentation laptop and a chosen phone; review Bangla voices/signs with a native reviewer and learning content with an educator. The characters remain stylized and facial animation is approximate. Voice preference is subjective; restored audio is synthetic.

Save storage belongs to the browser and origin/path. Moving files or changing browsers may create a separate save. Audio may require the first click because browsers limit autoplay.

- [Three.js license](city/vendor/THREE-LICENSE.txt)
- [Character sources](city/people/CREDITS.txt)
- [Motion credits](city/people/MOTION-CREDITS.txt)
- [Artwork credits](assets/ART-CREDITS.md)
- [Voice credits](city/VOICE-CREDITS.md)
- [Teaching notes and sources](city/SCAM-REFERENCES.md)

Shop names help represent the setting; they do not imply brand, university or government endorsement.
