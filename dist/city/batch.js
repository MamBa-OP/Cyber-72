"use strict";

// Bake rigid scenery into a small set of meshes. Moving parts use their own roots.
window.C72Batch = (() => {
  const T = window.THREE;
  const solidMaterials = new Map();

  function surface(material) {
    if (!material.isMeshStandardMaterial || material.transparent || material.normalMap || material.bumpMap ||
        material.roughnessMap || material.alphaMap || material.emissiveMap || material.emissive?.getHex() ||
        material.polygonOffset || material.wireframe || material.isMeshPhysicalMaterial) return material;
    const roughness = Math.round(material.roughness * 4) / 4;
    const metalness = Math.round(material.metalness * 4) / 4;
    const key = [roughness, metalness, material.side, material.flatShading, material.map?.uuid ?? ""].join("/");
    if (!solidMaterials.has(key)) solidMaterials.set(key, new T.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness, metalness, map:material.map, side: material.side, flatShading: material.flatShading
    }));
    return solidMaterials.get(key);
  }

  function staticGroup(root) {
    root.updateWorldMatrix(true, true);
    const toLocal = root.matrixWorld.clone().invert();
    const matrix = new T.Matrix4(), normalMatrix = new T.Matrix3(), vector = new T.Vector3();
    const buckets = new Map(), consumed = [];
    root.traverse(mesh => {
      if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh || !mesh.visible) return;
      const geometry = mesh.geometry, a = geometry?.attributes;
      if (!a?.position || !mesh.material) return;
      matrix.multiplyMatrices(toLocal, mesh.matrixWorld);
      normalMatrix.getNormalMatrix(matrix);
      if (!a.normal) geometry.computeVertexNormals();
      const count = geometry.index?.count ?? a.position.count;
      const groups = Array.isArray(mesh.material) ? geometry.groups : [{ start: 0, count, materialIndex: 0 }];
      for (const group of groups) {
        const original = Array.isArray(mesh.material) ? mesh.material[group.materialIndex] : mesh.material;
        if (!original || !original.visible) continue;
        const material = surface(original), tint = original !== material ? original.color : null;
        let bucket = buckets.get(material);
        if (!bucket) {
          bucket = { positions: [], normals: [], uvs: [], colors: [], indices: [], cast: false };
          buckets.set(material, bucket);
        }
        bucket.cast ||= mesh.castShadow || (!material.transparent && !material.isMeshBasicMaterial);
        const offset = bucket.positions.length / 3;
        for (let i = 0; i < a.position.count; i++) {
          vector.fromBufferAttribute(a.position, i).applyMatrix4(matrix);
          bucket.positions.push(vector.x, vector.y, vector.z);
          vector.fromBufferAttribute(a.normal, i).applyNormalMatrix(normalMatrix);
          bucket.normals.push(vector.x, vector.y, vector.z);
          bucket.uvs.push(a.uv?.getX(i) ?? 0, a.uv?.getY(i) ?? 0);
          if (material.vertexColors) bucket.colors.push(
            (tint?.r ?? 1) * (a.color?.getX(i) ?? 1),
            (tint?.g ?? 1) * (a.color?.getY(i) ?? 1),
            (tint?.b ?? 1) * (a.color?.getZ(i) ?? 1)
          );
        }
        const end = Math.min(group.start + group.count, count);
        for (let i = group.start; i < end; i++) bucket.indices.push(offset + (geometry.index?.getX(i) ?? i));
      }
      consumed.push(mesh);
    });
    for (const mesh of consumed.reverse()) {
      for (const child of mesh.children.slice()) mesh.parent.attach(child);
      mesh.removeFromParent();
    }
    function prune(group) {
      for (const child of group.children.slice()) {
        if (child.isGroup) { prune(child); if (!child.children.length) child.removeFromParent(); }
      }
    }
    prune(root);
    for (const [material, b] of buckets) {
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(b.positions, 3));
      geo.setAttribute("normal", new T.Float32BufferAttribute(b.normals, 3));
      geo.setAttribute("uv", new T.Float32BufferAttribute(b.uvs, 2));
      if (b.colors.length) geo.setAttribute("color", new T.Float32BufferAttribute(b.colors, 3));
      geo.setIndex(b.indices);
      geo.computeBoundingSphere();
      const mesh = new T.Mesh(geo, material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = !material.transparent;
      root.add(mesh);
    }
    return root;
  }
  return { staticGroup };
})();
