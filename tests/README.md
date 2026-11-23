# Reproducing the checks

Use Node.js 20 or newer. No npm packages or network installation are needed: the tests load the bundled Three.js runtime. From the extracted project folder run:

```
node tests/check-campaign.cjs
node tests/check-release.cjs
node tests/check-guidebook.cjs
node tests/check-city.cjs --missions
node tests/check-city.cjs --missions --image-fallback
node tests/check-gait.cjs
node tests/check-wardrobe.cjs
node tests/check-reactions.cjs
```

The scene harness mocks browser drawing and decoders. It verifies behavior and geometry, not rendering performance. Open dist/index.html in a real browser for graphics, audio, responsive layout and complete-session checks. The bundled legacy Three.js build may print a deprecation notice; the notice is not a failed check.
