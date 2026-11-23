# Cyber 72

A bilingual cyber safety game for Bangladeshi teens. Start on Islampur Road as Rakib and explore a compact, fictionalized version of Old Dhaka on foot.

## Run the project

Open **Cyber-72.html** in a browser with WebGL support to play offline. The editable ZIP also plays offline. Extract the entire ZIP first, then open **dist/index.html**. Both versions include the city textures and prepare them before Rakib appears.

For a local development preview you can also run `python -m http.server 8000 --bind 127.0.0.1 --directory dist` from the project folder and open [the game](http://127.0.0.1:8000/). The shipped game needs no installation or server to play offline.

The editable archive includes [reproducible checks](tests/README.md). Running those checks needs Node.js; playing the game does not.

## This version · v1.2.0

- **Original voices restored:** the original 20 Bangla story recordings and 60 answer reactions are restored byte for byte from the first voice versions. Original timing and matching subtitles are restored too. No voice generation or paid service was used.

- **Simpler conversations:** listen to the neighbour and choose one of three numbered replies immediately. Evidence inspection and its answer gate are removed, together with extra instruction headings. A compact story bubble, animated speaker and responsive answer cards keep the conversation focused. Answers are balanced so the safe answer is not consistently the longest choice.
- **Guidebook and new runs:** Pause → Guidebook opens controls and help for all ten levels, including each task, warning signs and a practical safety hint. All guides are available immediately. It opens automatically on a fresh game, New game, Pause → Restart game and a restart after death. Pause → Restart game now clears progress and mistakes, returns to level 1 with 100 Health, and resets the player and city. Your name, language and settings stay saved. Continue keeps existing progress.
- **Living conversations:** the actual speaker's outfit appears in an animated portrait, with restrained voice-responsive gestures, jaw motion and blinks. Portraits use the existing renderer and release their private rendering resources on close. This is approximate audio-driven animation, not phoneme-accurate lip sync. Approved city walk/idle animations are retained.
- **Camera, sound and reliability:** the camera searches for a clear shoulder or elevated angle near obstacles and pedestrians. I/J/K/L move the camera; Home centres it. Settings add sensitivity, invert-Y, WASD/ZQSD layouts, Automatic/Low/Medium/High graphics, dialogue volume and master mute. Walking/landing Foley follows Game sound effects. Death frames refresh cast shadows. Graphics interruptions show a recovery screen; incomplete game files show reload instructions.
- **Offline and accessible UI:** English/Bangla labels, visible keyboard focus, compact landscape conversations and reduced-motion handling. All code, graphics and updated voices remain bundled. See [release checks and demonstration guide](dist/RELEASE-NOTES.md) for validation and remaining device-testing limits.

- **Answer reactions:** every answer across all ten cases has its own spoken Bangla response, including distinct reactions for each wrong choice. The sixty original male/female recordings are bundled offline. The response appears as a Bangla subtitle and can be replayed or stopped; it uses the saved voice volume. Correct answers use the case just answered, even after the next level unlocks.
- **Bangla NPC speech:** all ten problem stories use their original bundled male and female Bangladeshi recordings. Talking starts the appropriate Bangla voice, including with English UI. One Listen/Stop button stays in the dialogue; voice volume stays in Settings. Speech stops when answering or leaving, and title music is lowered while speaking. No voice server or installed system voice is needed during play.
- **Death and full restart:** at zero health, Rakib buckles at the knees, braces with one arm and settles onto his side before the YOU DIED screen appears. Joint motion and ground contact follow the uneven road. A local cloth rustle, impact and brief low musical cue accompany the fall, following the sound-effects switch and volume. The final NPC reaction plays after the fall. Restart from level 1 clears the campaign and restores 100 health. Saved death states cannot bypass this restart by reloading. Reduced-motion mode skips the animated fall.

- **Conversations** now feature a portrait of the actual in-game NPC, a clear story bubble and three immediate replies, staggered answer-card entrances, hover feedback and animated outcomes. Reduced-motion preferences disable decorative movement. All player-facing life labels now say Health (স্বাস্থ্য).

- **Arcade colour theme:** charcoal, tangerine, warm cream and leaf green accents bring a consistent, colourful game style to the welcome screen, settings, loading sequence, pause menu, map and NPC conversations. Raised buttons, responsive hover feedback and the existing animated presentation keep the interface lively. Reduced-motion preferences are respected.
- **Rearranged HUD:** the location/street tag has been removed. The top level ribbon displays all ten numbered levels, highlights the current level and fills completed levels. Health sits at the bottom beside the minimap, with a pink low-life warning. On touch devices the minimap and life bar sit together above the movement controls. The HUD and numbers support English and Bangla.

- **Ten neighbourhood missions** cover fake prize SMS, Messenger impersonation, loan apps, bKash/Nagad PIN theft, unknown APKs, Marketplace advance payments, task-job scams, fake shops, phishing addresses and countdown offers. Stories, answers and explanations are available in English and Bangla. The answer positions change between encounters.
- **Find and talk:** follow the map marker, direction arrow and distance. The district map and minimap show your mint direction arrow and the active neighbour’s amber **!** marker. Overhead NPC icons and name labels are removed; a small ground ring identifies the neighbour nearby. Shop and landmark markers remain hidden. Walk within 2.8 metres with a clear view, then press **E** or tap **Talk**. Only one neighbour has an active mission; the rest of the city continues its normal routines. The city pauses during a conversation. Choose with the buttons or number keys **1–3**; **Esc** leaves the conversation.
- **Life and progression:** start with 100 health. A wrong answer deducts 40 points, explains the risk, and requires a different NPC for the same level. A correct answer completes that level and unlocks the next. Life carries between levels. At zero, Rakib collapses and the death screen offers **Restart from level 1**: it restores 100 health and resets all campaign progress, Rakib, the camera and the city. Finishing all ten earns the cyber-protector screen, with options to explore or play all ten again.
- **Saved campaign:** levels, life, mistakes, active neighbour and pending answer feedback are saved in this browser when storage is available. Reloading or returning to the menu does not erase damage or skip the feedback. If storage is unavailable, the campaign works for the current visit. **Pause → Restart game** starts a new run at level 1 with 100 Health and opens the guidebook. Fictional examples never ask for real PINs, payments or personal information. [Teaching notes and references](dist/city/SCAM-REFERENCES.md) explain the safety wording.

- **Cinematic welcome** features new 3D-style Dhaka-at-dusk artwork, dimensional title lettering, moving dust and light, pointer-driven depth, and raised game controls. The full-screen composition adapts to portrait and landscape screens. Reduced-motion preferences disable the decorative animation.
- **District arrival** has an animated 3D miniature of the neighbourhood, a glowing route and percentage tied to actual city-loading progress, and short cyber-safety tips in English or Bangla. It adds no artificial loading delay. All artwork, effects and scripts are included in both offline versions.

- **Start game** places Rakib on the pavement on Islampur Road. The 16-block district connects Bangshal Market, a merchant courtyard, a bazaar and rickshaw workshops. The southern boulevard has a bus stop and an uninterrupted row of shops. The district has 85 roadside and courtyard trees.
- **Street life** includes 848 residents spread across every street and the residential courtyards. Each side of all 40 street segments starts with at least eight residents. The 60 vehicles include 12 motorcycles with helmeted riders. Cycle rickshaws, CNGs, buses, delivery vans and pedal-powered cargo vans follow left-hand routes. Five traffic officers gesture beside the roads. People browse windows, pay at counters, carry parcels, sweep storefronts, talk over tea and wait for buses.
- **Roads** curve between junctions and have real changes in height. A finer surface with continuous shading removes the square tile edges, while a seamless 2048-pixel asphalt texture adds fine aggregate and cracks. Worn white dashed centre lines follow all 40 street segments, conform to the bumps and leave gaps at junctions and broken asphalt. A shared terrain surface keeps character feet, vehicle suspension and collision height aligned. The 142 irregular potholes, stagnant rainwater, loose gravel, paper, bottles and brick rubble preserve the dusty street appearance. Sunlight, a blue sky and soft clouds brighten the district.
- **Clothing and body shape** now use a connected trouser surface from waist through hips, seat and legs, replacing overlapping capped pieces. Kameez have open hems, side vents and cloth shapes that give raised thighs room during a stride. Orna scarves follow the garment with a short front end and longer back drape. Lungis bend with the legs, police vest trim follows the vest, and concealed shirt details are removed beneath it. The 1024-pixel fabric atlas has smaller prints and separate fine-weave relief, so printed colours no longer create dents. Distant outfits retain the hip, knee and hem geometry needed to prevent clothing breaks.
- **Movement** retains the approved idle, walking, running and jumping. The relaxed standing loop has quiet breathing and a slow weight shift with planted shoes. Walking and running use authored Quaternius clips, with smooth transitions. Rakib walks at 1.4 metres per second and runs at 4.4 metres per second. Small body-height corrections keep shoes above the road. Nearby NPCs animate every frame. Held parcels, books, bags and street activities remain available.
- **Street print** adds 16 framed roadside billboards and 352 weathered Bengali posters across building walls and poles. Tea, books, cyber safety and fictional neighbourhood election notices give the district a Dhaka street character. Candidate names and portraits are fictional; all print artwork is generated locally and works offline.
- **Map** shows roads, building outlines, your directional player arrow and the active NPC marker. The [storefront references](dist/city/SHOP-REFERENCES.md) list their real-world names and the details represented in the game. The branches occupy fictional locations. Shops remain in the city but have no map icons or legend.
- **Pause → Restart game** clears campaign progress and resets Rakib, camera, pedestrians and traffic to the start with 100 Health. Name, language and audio settings stay saved. **Pause → Settings → Done** returns to the same spot. Starting again from the title places Rakib back on Islampur Road.
- **Settings** lets you edit the character name, choose English or Bangla, and adjust three audio channels independently.
- **Background music** starts enabled at **20%**. The game tries to play “Riverlight” as soon as it loads. If the browser requires an interaction, tap the screen or choose **Tap for music**.
- **Menu sound effects** start enabled at **50%**. Adjust **Menu click volume** to hear a sample click at the chosen level. Each channel has its own on/off switch.
- **Street ambience** starts enabled at **35%**. Crowd chatter grows louder near busy shops. Engine sounds, bells and horns follow nearby traffic. The street sound pauses when you leave the street view or switch away from the game.
- The expand icon enters or exits device fullscreen in browsers that support it.

Settings are saved in this browser. Confirm a name by leaving its field or choosing **Done**. Character names can use up to 24 characters, including Bangla.

On the title screen, **Enter** starts, **S** opens Settings, and **M** toggles music.

## Street controls

| Action | Keyboard and mouse | Touch |
| --- | --- | --- |
| Walk | WASD or arrow keys | Left joystick |
| Run | Hold Shift while moving | Tap Run, then move |
| Jump | Space | Jump button |
| Look around | Drag on the street | Swipe on the street |
| Camera distance | Mouse wheel | Automatic following distance |
| District map | M or Map | Map or minimap |
| Talk to the active NPC | E when nearby | Talk button when nearby |
| Answer a mission | Click an answer or press 1–3 | Tap an answer |
| Pause and resume | Esc or Pause | Pause, then Resume walk |
| Restart | Pause, then Restart game | Pause, then Restart game |

The camera follows Rakib when he changes direction and moves closer near walls. The controller handles acceleration, turning, gravity, landing on low objects, and collisions with buildings, people, trees, poles and traffic.

## Source

- `dist/city/journey.js` and `dist/guidebook.css` provide the offline bilingual level guidebook.

- `dist/index.html` contains the welcome screen, settings, street view, and map.
- `dist/styles.css` contains the arcade interface, responsive layouts, and reduced-motion styles.
- `dist/presentation.css` and `dist/presentation.js` create the cinematic title atmosphere, responsive welcome screen and district-loading presentation. They use CSS and Canvas 2D, without an extra WebGL renderer.
- `dist/game.js` contains the translations, navigation, audio controls, and browser storage.
- `dist/arcade.css` provides the shared colour theme, raised controls and responsive HUD layout, loaded after the component styles.
- `dist/assets/` contains the game lettering, shield, portrait, Islampur artwork, and the original “Riverlight” title theme.
- `dist/city/streets.js` places roads, buildings, landmarks, overhead wiring, trees and collision bounds. `district.js` builds the architecture and street furniture.
- `dist/city/terrain.js` creates the curved height field, asphalt, potholes, water reflections and roadside debris. Traffic, the minimap and character physics use the same road curves.
- `dist/city/street-art.js` creates the Bengali billboards, fictional election posters, paper weathering and their street placements.
- `dist/city/people.js`, `people/anatomy.js`, and `vehicles.js` contain the animated 3D models. `life.js` runs street traffic, pedestrians, and particles.
- `dist/city/gait.js` plays and blends the local animation clips in `people/motion-data.js`. `people.js` applies those rotations to the character skeleton and overlays street activities and held props.
- `dist/city/play.js` handles player physics, camera, controls, map, and loading. `batch.js` combines nearby static geometry for rendering. The local Three.js distribution and its MIT license are in `dist/city/vendor/`.
- `dist/city/ambience.js` creates the positional street sound with the browser's Web Audio API.
- `dist/conversation.css` styles the simplified conversation; `city/choices.js` balances answer wording and `city/dialogue-copy.js` keeps Bangla subtitles aligned with the original recordings.
- `dist/city/missions-data.js` contains the ten bilingual cases; `campaign.js` owns health, progression and saved checkpoints; `missions.js` and `missions.css` add NPC selection, world/map markers and the dialogue interface.

## Artwork

The welcome and settings artwork in `dist/assets/dhaka-dusk.webp` is an original cinematic 3D-style illustration made with the built-in image-generation tool. Its [complete prompt and provenance](dist/assets/ART-CREDITS.md) are included. The dimensional title and animated miniature are rendered in code. The shield and player portrait use custom pixel vectors. The original illustration in `dist/assets/islampur.webp` remains included as an alternative asset. The nine interiors in `dist/city/textures/retail.webp` were created for this project and are paired with bilingual, individually drawn signs.

Walking and running use adapted clips from the [Quaternius Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html), authored by Quaternius and Gonzalo Furnier and released under CC0. The relaxed standing clip was authored for Cyber 72. All clips are embedded locally; no animation download is needed to play. See `dist/city/people/MOTION-CREDITS.txt` and `MOTION-LICENSE.txt` for source and license details.

If you edit any of the four original WebP sheets in `dist/city/textures/`, run `node pack-textures.cjs` from the project folder. It copies their exact bytes into the portable texture bank used by the renderer.

The two 4-by-2 texture sheets in `dist/city/textures/` were generated for this project. The first depicts eight Old Dhaka shopfronts with goods, counters, and shutters. The second depicts weathered residential façades with balconies, iron grilles, and peeling paint. The game layers modeled signs, awnings, balconies, roof tanks, fans, and wiring over those images. Streets, stalls, kettles, clothing, vehicle paint, and the sky use procedural geometry or textures. The heads, hands and connected trouser topology are fitted derivatives of the MakeHuman hm08 base mesh and clothing helper. See `dist/city/people/CREDITS.txt` for provenance.

<details>
<summary>Illustration prompt</summary>

A finished ultra-wide 2.35:1 pixel-art welcome background for Cyber 72, a local Bengali teen adventure game. Masterful 16-bit handheld-console environment art, meticulously clustered deliberate pixel shapes, no anti-aliased illustration and no vector outlines. An atmospheric busy inland Old Dhaka bazaar street at late golden hour seen from the kerb at walking height, dense tangible markets, not a waterfront. This is one cinematic composition, no logo, absolutely no game HUD, no English lettering or legible signage. Hero composition stays RIGHT: near x=72%, a teenage Bangladeshi boy with short black hair, sea-green overshirt, small warm ochre canvas school backpack, shown from behind watching Old Dhaka come alive. Ahead of him a painted cycle rickshaw with curved red and gold canopy and a green CNG pass, small energetic groups in panjabis, lungis, colourful salwar kameez, shoppers with parcels, a tiny steaming roadside tea stall. Tall balconies, Bengali shop sign shapes under striped awnings, enormous spreading krishnachura and rain-tree foliage, overhead wires CONNECT to poles on the pavement, terracotta and dusty teal plaster, a small green Bangladesh flag with a red disc. Golden sun shines down the street between buildings, apricot-salmon sky fading to lavender, deep ink-blue shadows, forest greens, cinematic light shafts. Reserve the leftmost 37% as dark quiet foreground shade under a shop awning so game lettering can be added separately. Keep the brightly lit active scene from center to right and the boy fully within the right side. Edge to edge authentic pixel artwork, no borders, no water, no river, no boats, no modern skyscrapers dominating the old market, no text overlay. Landscape wide.

</details>
