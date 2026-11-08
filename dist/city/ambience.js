"use strict";

// Original game audio. Short recordings of the synthesizers are made once in
// memory. Only a few looping sources are needed regardless of the crowd size.
window.C72Ambience = (() => {
  const rate = 16000;
  const tau = 2 * Math.PI;
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const motors = ["cng", "bus", "van", "motorcycle"];
  const socialActivities = new Set(["talk","argue","tea","work","pay","phone","hail"]);
  let context = null, tapes = null, mix = null, playing = false, volume = .35;
  let nextMix = 0, nextBell = 0, nextHorn = 0;
  let composition = null, wake = null;

  function seeded(seed) {
    return () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  // Scale by measured peaks. Crossfade the end of loops onto their beginning
  // so a held vowel or an irregular engine pulse never clicks at a seam.
  function* tape(samples, loop = false) {
    const join = loop ? Math.round(rate * .075) : 0;
    const length = samples.length - join;
    for (let i = 0; i < join; i++) {
      const fade = i / join;
      samples[i] = samples[length + i] * (1 - fade) + samples[i] * fade;
    }
    let peak = .0001;
    for (let offset = 0; offset < length; offset += 8192) {
      const end = Math.min(length, offset + 8192);
      for (let i = offset; i < end; i++) peak = Math.max(peak, Math.abs(samples[i]));
      yield;
    }
    const buffer = context.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let offset = 0; offset < length; offset += 8192) {
      const end = Math.min(length, offset + 8192);
      for (let i = offset; i < end; i++) data[i] = samples[i] / peak;
      yield;
    }
    return buffer;
  }

  function* crowdTape(seconds, seed) {
    const rng = seeded(seed);
    const data = new Float32Array(Math.ceil((seconds + .075) * rate));
    const vowels = [[490, 930], [600, 1380], [370, 1890], [690, 1170], [350, 820], [440, 1560]];
    // Each resident speaks in little groups of syllables, then listens. Two
    // resonances filter the voice pulses, with breath at the consonants.
    for (let voice = 0; voice < 9; voice++) {
      const pitch = 97 + rng() * 105, tract = .83 + rng() * .33;
      let at = -Math.floor(rng() * rate * 2.5), phase = rng();
      while (at < data.length) {
        const count = 3 + Math.floor(rng() * 7), emphasis = .48 + rng() * .52;
        const inquisitive = rng() < .24;
        for (let syllable = 0; syllable < count; syllable++) {
          const len = Math.round((.09 + rng() * .17) * rate);
          const [f1, f2] = vowels[Math.floor(rng() * vowels.length)];
          const pitchStart = pitch * (.97 + .11 * Math.sin(syllable * 1.7 + voice));
          const pitchEnd = pitchStart * (syllable === count - 1 ? (inquisitive ? 1.12 : .78) : .96);
          const level = emphasis * (.45 + rng() * .55);
          const r1 = .976, r2 = .957;
          const a1 = 2 * r1 * Math.cos(tau * tract * f1 / rate);
          const a2 = 2 * r2 * Math.cos(tau * tract * f2 / rate);
          let y1 = 0, prev1 = 0, y2 = 0, prev2 = 0, breath = 0;
          for (let n = 0; n < len; n++) {
            const u = n / len, index = at + n, noise = rng() * 2 - 1;
            phase += (pitchStart + (pitchEnd - pitchStart) * u) / rate;
            const pulse = phase >= 1 ? 1 : 0;
            if (pulse) phase -= 1;
            const airy = noise - breath; breath += .35 * airy;
            const source = pulse + .018 * airy;
            const low = source + a1 * y1 - r1 * r1 * prev1;
            const high = source + a2 * y2 - r2 * r2 * prev2;
            prev1 = y1; y1 = low; prev2 = y2; y2 = high;
            if (index >= 0 && index < data.length) {
              const envelope = Math.min(1, u * 8, (1 - u) * 6);
              const fade = 1-u, consonant = fade*fade*fade;
              data[index] += level * envelope * (.19 * low + .13 * high + .13 * airy * consonant * consonant);
            }
          }
          at += len + Math.round(rng() * .065 * rate);
          yield;
        }
        at += Math.round((.28 + rng() * 1.05) * rate);
      }
    }
    return yield* tape(data, true);
  }

  function* motorTape(kind, seed) {
    const rng = seeded(seed), samples = new Float32Array(Math.round(rate * 2.76));
    const pitch = {cng: 54, bus: 34, van: 46, motorcycle: 89}[kind];
    let phase = 0, cycle = 0, air = 0, rumble = 0, body = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / rate, noise = rng() * 2 - 1;
      phase += pitch * (1 + .014 * Math.sin(t * 7) + .008 * Math.sin(t * 19)) / rate;
      if (phase >= 1) { phase--; cycle++; }
      const beat = (.45 + .55 * Math.exp(-phase * 6)) * (cycle % 3 === 0 ? 1 : .82);
      const exhaust = Math.sin(tau * phase) + .38 * Math.sin(2 * tau * phase + .4);
      air += .19 * (noise - air); rumble += .022 * (noise - rumble);
      body += .08 * (beat * (.44 * exhaust + .80 * air) - body);
      samples[i] = body * (kind === "van" ? .55 : .86) + 2.2 * rumble + .25 * air;
      if (i % 4096 === 0) yield;
    }
    return yield* tape(samples, true);
  }

  function* signalTape(bell) {
    const samples = new Float32Array(Math.ceil(rate * (bell ? .92 : .30)));
    if (bell) {
      // A cycle bell's striker rattles against its dome several times.
      for (const [strike, strength] of [[0,1],[.027,.65],[.058,.40],[.173,.76],[.20,.40]]) {
        const start = Math.round(strike * rate);
        for (let i = start; i < samples.length; i++) {
          const t = (i - start) / rate;
          samples[i] += strength * Math.min(1,t * 1100) * (
            Math.sin(tau * 1393 * t) * Math.exp(-8.6*t) +
            .45 * Math.sin(tau * 2234 * t) * Math.exp(-12*t) +
            .19 * Math.sin(tau * 3455 * t) * Math.exp(-19*t));
          if (i % 4096 === 0) yield;
        }
      }
    } else {
      let phase = 0;
      for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        phase += tau * (304 - 28 * Math.exp(-t * 48) - 4 * t) / rate;
        const brass = Math.sin(phase) + .50 * Math.sin(2 * phase + .3) + .24 * Math.sin(3 * phase);
        const secondReed = .54 * Math.sin(phase * 1.232) + .21 * Math.sin(phase * 2.464);
        const envelope = Math.min(1,t/.033) * clamp((.274-t)/.082,0,1);
        samples[i] = envelope * (brass + secondReed) * (1 + .042 * Math.sin(t * 55));
      }
    }
    return yield* tape(samples);
  }

  function* createTapes() {
    const chatter = [yield* crowdTape(9.79, 72), yield* crowdTape(12.41, 189)];
    const engines = [];
    for (let i = 0; i < motors.length; i++) engines.push(yield* motorTape(motors[i], i + 312));
    return {chatter, motors:engines, bell:yield* signalTape(true), horn:yield* signalTape(false)};
  }

  // The optional stereo panner is bypassed on older mobile audio engines.
  function playTape(buffer, loop, cutoff, gain, pan, speed = 1) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter();
    const level = context.createGain();
    const stereo = context.createStereoPanner ? context.createStereoPanner() : null;
    source.buffer = buffer; source.loop = loop; source.playbackRate.value = speed;
    filter.type = "lowpass"; filter.Q.value = .63; filter.frequency.value = cutoff;
    level.gain.value = gain;
    source.connect(filter); filter.connect(level);
    if (stereo) { stereo.pan.value = pan; level.connect(stereo); stereo.connect(mix.master); }
    else level.connect(mix.master);
    const tracks = mix.tracks;
    const track = {source, filter, level, stereo};
    tracks.add(track);
    const release = () => {
      if (!tracks.delete(track)) return;
      source.onended = null;
      source.disconnect(); filter.disconnect(); level.disconnect(); stereo?.disconnect();
    };
    source.onended = release;
    track.stop = () => { source.stop(); release(); };
    source.start(0, loop ? Math.random() * buffer.duration : 0);
    return track;
  }

  function stopMix() {
    if (wake !== null) { clearTimeout(wake); wake = null; }
    if (!mix) return;
    mix.master.disconnect();
    for (const track of mix.tracks) track.stop();
    mix = null;
  }

  // Yield between batches of syllables while creating the first soundscape.
  // Pausing freezes the generator. Returning resumes its existing work.
  function makeSlice() {
    wake = null;
    if (!playing || !volume || document.hidden || context?.state !== "running") return;
    const until = performance.now() + 6;
    let step;
    do { step = composition.next(); } while (!step.done && performance.now() < until);
    if (step.done) {
      tapes = step.value; composition = null;
      sync();
    } else wake = setTimeout(makeSlice, 6);
  }

  function sync() {
    if (!playing || !volume || document.hidden || !context || context.state !== "running") {
      stopMix();
      return;
    }
    if (mix) return;
    if (!tapes) {
      composition ||= createTapes();
      if (wake === null) wake = setTimeout(makeSlice, 0);
      return;
    }
    const master = context.createGain();
    master.gain.value = 0; master.connect(context.destination);
    mix = {master, tracks:new Set()};
    mix.chatter = tapes.chatter.map((buf, i) => playTape(buf,true,1250,.12,(i-.5)*.95));
    mix.engines = tapes.motors.map(buf => playTape(buf,true,640,0,0));
    const now = context.currentTime;
    master.gain.setTargetAtTime(volume * .72, now, .18);
    nextMix = 0; nextBell = now + 2.5; nextHorn = now + 7;
  }

  function setVolume(percent) {
    const level = Number(percent);
    if (!Number.isFinite(level)) return;
    volume = clamp(level / 100,0,1);
    if (mix) mix.master.gain.setTargetAtTime(volume * .72, context.currentTime, .055);
    sync();
  }

  function setPlaying(value) { playing = Boolean(value); sync(); }

  function unlock(event) {
    if (!event.isTrusted || document.hidden || !volume) return;
    const starts = event.target?.closest?.("#start-game");
    const enterTitle = event.type === "keydown" && event.key === "Enter" &&
      (!location.hash || location.hash === "#menu");
    if (!playing && !starts && !enterTitle && location.hash !== "#city" && location.hash !== "#city-settings") return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      if (!context || context.state === "closed") {
        context = new Context(); context.onstatechange = sync;
      }
      if (context.state !== "running") context.resume().then(sync).catch(() => {});
      else sync();
    } catch { /* Audio can be unavailable while a device's output is in use. */ }
  }

  function update(player, yaw, life, branches) {
    if (!mix || !life) return;
    const now = context.currentTime;
    if (now < nextMix) return;
    nextMix = now + .22;
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    const panAt = (dx,dz,distance) => clamp((dx*rightX+dz*rightZ)/Math.max(2,distance),-1,1);
    let voices = 0, balance = 0, shops = 0;
    for (const person of life.people) {
      const dx = person.x-player.x, dz = person.z-player.z, d2 = dx*dx+dz*dz;
      if (d2 > 1024) continue;
      const social = socialActivities.has(person.currentAction) ? 1.4 : .72;
      const nearby = social * (1-d2/1024)/(1+d2/54);
      voices += nearby; balance += nearby*panAt(dx,dz,Math.sqrt(d2));
    }
    for (const branch of branches || []) {
      const dx = (branch.doorX ?? branch.x)-player.x, dz = (branch.doorZ ?? branch.z)-player.z;
      shops += Math.max(0,1-(dx*dx+dz*dz)/256);
    }
    const crowd = 1-Math.exp(-voices*.17-shops*.2);
    for (let i=0; i<mix.chatter.length; i++) {
      const track = mix.chatter[i], pan = balance/Math.max(.01,voices);
      track.level.gain.setTargetAtTime(.045+.31*crowd,now,.38);
      track.filter.frequency.setTargetAtTime(850+940*crowd,now,.38);
      track.stereo?.pan.setTargetAtTime(clamp((i-.5)*.92+.48*pan,-.9,.9),now,.33);
    }
    const beds = motors.map(() => ({weight:0, speed:0, side:0, nearest:0}));
    let bellWeight = 0, hornWeight = 0, bellPan = 0, hornPan = 0, hornPitch = 1;
    for (const driver of life.drivers) {
      const dx = driver.x-player.x, dz = driver.z-player.z, d2 = dx*dx+dz*dz;
      if (d2 > 3136) continue;
      const distance = Math.sqrt(d2), pan = panAt(dx,dz,distance);
      const weight = (1-d2/3136)/(1+d2/64);
      if (driver.kind === "rickshaw" || driver.kind === "cyclevan") {
        if (distance < 21 && driver.speed > .5 && weight > bellWeight) { bellWeight=weight; bellPan=pan; }
        continue;
      }
      const index = motors.indexOf(driver.kind);
      const bed = beds[index < 0 ? 2 : index];
      bed.weight += weight; bed.speed += weight*driver.speed; bed.side += weight*pan;
      bed.nearest = Math.max(bed.nearest,weight);
      if (distance < 32 && weight > hornWeight) {
        hornWeight = weight; hornPan = pan;
        hornPitch = driver.kind === "bus" ? .76 : driver.kind === "cng" ? 1.23 : .94;
      }
    }
    beds.forEach((bed, i) => {
      const track = mix.engines[i], total = Math.max(bed.weight,.001);
      track.level.gain.setTargetAtTime(.48*(1-Math.exp(-bed.weight)),now,.26);
      track.filter.frequency.setTargetAtTime(340+bed.nearest*1070,now,.3);
      track.source.playbackRate.setTargetAtTime(.78+.08*clamp(bed.speed/total,0,9),now,.4);
      track.stereo?.pan.setTargetAtTime(.88*bed.side/total,now,.25);
    });
    if (now >= nextBell) {
      if (bellWeight) playTape(tapes.bell,false,2200+2300*bellWeight,.025+.16*bellWeight,bellPan*.85,.93+Math.random()*.13);
      nextBell = now + (bellWeight ? 5+Math.random()*6 : 1.7);
    }
    if (now >= nextHorn) {
      if (hornWeight) playTape(tapes.horn,false,930+1750*hornWeight,.03+.18*hornWeight,hornPan*.84,hornPitch);
      nextHorn = now + (hornWeight ? 9+Math.random()*11 : 2.7);
    }
  }

  for (const name of ["click","pointerup","keydown"]) document.addEventListener(name,unlock,true);
  document.addEventListener("visibilitychange",sync);
  window.addEventListener("pagehide",() => {
    stopMix();
    if (context) {
      context.onstatechange = null;
      context.close().catch(() => {});
      context = null;
    }
    tapes = null; composition = null;
  });
  return Object.freeze({setVolume,setPlaying,update});
})();
