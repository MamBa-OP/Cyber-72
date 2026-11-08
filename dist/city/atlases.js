"use strict";

// Both editions decode the same in-memory images. WebGL never needs
// permission to read pixels from a neighbouring file on the player's disk.
window.C72Atlases = (() => {
  const T = window.THREE;
  const maps = new Map();

  async function decode(encoded) {
    if (typeof createImageBitmap === "function") {
      const binary = atob(encoded), bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      try {
        return await createImageBitmap(new Blob([bytes], {type:"image/webp"}));
      } catch {
        // Some browsers support WebP through Image but not their bitmap decoder.
      }
    }
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Unable to decode the bundled WebP artwork"));
      image.src = "data:image/webp;base64," + encoded;
    });
    return image;
  }

  async function prepare(renderer, progress) {
    const entries = Object.entries(window.C72AtlasData);
    const completed = new Map(), cap = renderer.capabilities;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", {willReadFrequently:true});
    try {
      for (const [name, encoded] of entries) {
        const image = await decode(encoded);
        let pixels;
        try {
          const scale = Math.min(1, cap.maxTextureSize / Math.max(image.width, image.height));
          const size = n => {
            const value = Math.max(1, Math.round(n * scale));
            return cap.isWebGL2 ? value : Math.min(cap.maxTextureSize, T.MathUtils.ceilPowerOfTwo(value));
          };
          canvas.width = size(image.width);
          canvas.height = size(image.height);
          // UV (0,0) is the bottom left. Typed-pixel uploads use row order as provided.
          ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        } finally {
          image.close?.();
        }
        const bytes = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
        const texture = new T.DataTexture(bytes, canvas.width, canvas.height, T.RGBAFormat);
        texture.name = name + " atlas";
        texture.colorSpace = T.SRGBColorSpace;
        texture.minFilter = T.LinearMipmapLinearFilter;
        texture.magFilter = T.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = Math.max(1, Math.min(8, cap.getMaxAnisotropy()));
        texture.needsUpdate = true;
        completed.set(name, texture);
        renderer.initTexture(texture);
        progress(completed.size / entries.length);
      }
    } catch (error) {
      for (const texture of completed.values()) texture.dispose();
      throw error;
    } finally {
      canvas.width = canvas.height = 1;
    }
    for (const [name, texture] of completed) maps.set(name, texture);
  }
  function get(name) {
    const texture = maps.get(name);
    if (!texture) throw new Error("City artwork is not ready: " + name);
    return texture;
  }
  return {prepare, get};
})();
