type MockBufferOptions = {
  sampleId: string;
  duration: number;
};

export function createMockSampleBuffer(
  context: BaseAudioContext,
  { sampleId, duration }: MockBufferOptions,
) {
  const channels = 2;
  const safeDuration = Math.max(0.2, duration);
  const frameCount = Math.ceil(context.sampleRate * safeDuration);
  const buffer = context.createBuffer(channels, frameCount, context.sampleRate);

  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);

    switch (sampleId) {
      case "mock-kick-fill":
        fillKick(data, context.sampleRate);
        break;
      case "mock-clap-hit":
        fillClap(data, context.sampleRate);
        break;
      case "mock-brass-stab":
        fillTone(data, context.sampleRate, 196, 0.75, "brass");
        break;
      case "mock-crowd-shout":
        fillCrowd(data, context.sampleRate, channel);
        break;
      case "mock-sweep-up":
        fillSweep(data, context.sampleRate);
        break;
      case "mock-impact":
        fillImpact(data, context.sampleRate);
        break;
      case "mock-synth-hit":
        fillTone(data, context.sampleRate, 392, 0.68, "synth");
        break;
      default:
        fillTone(data, context.sampleRate, 330, 0.5, "synth");
        break;
    }
  }

  return buffer;
}

function fillKick(data: Float32Array, sampleRate: number) {
  for (let index = 0; index < data.length; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.exp(-time * 7);
    const pitch = 48 + 90 * Math.exp(-time * 12);
    const click = time < 0.018 ? (Math.random() * 2 - 1) * 0.22 : 0;
    data[index] =
      (Math.sin(2 * Math.PI * pitch * time) * envelope + click) * 0.75;
  }
}

function fillClap(data: Float32Array, sampleRate: number) {
  const hits = [0, 0.022, 0.045];

  for (let index = 0; index < data.length; index += 1) {
    const time = index / sampleRate;
    let sample = 0;

    for (const hit of hits) {
      const local = time - hit;
      if (local >= 0) {
        sample += (Math.random() * 2 - 1) * Math.exp(-local * 48);
      }
    }

    data[index] = bandLimit(sample) * 0.55;
  }
}

function fillTone(
  data: Float32Array,
  sampleRate: number,
  frequency: number,
  gain: number,
  character: "brass" | "synth",
) {
  for (let index = 0; index < data.length; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(1, time / 0.025);
    const envelope =
      attack * Math.exp(-time * (character === "brass" ? 2.8 : 4));
    const vibrato = Math.sin(2 * Math.PI * 5.5 * time) * 2.5;
    const fundamental = frequency + vibrato;
    const harmonicA = Math.sin(2 * Math.PI * fundamental * time);
    const harmonicB = Math.sin(2 * Math.PI * fundamental * 2 * time) * 0.35;
    const harmonicC = Math.sin(2 * Math.PI * fundamental * 3 * time) * 0.16;

    data[index] = (harmonicA + harmonicB + harmonicC) * envelope * gain;
  }
}

function fillCrowd(data: Float32Array, sampleRate: number, channel: number) {
  for (let index = 0; index < data.length; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.min(1, time / 0.08) * Math.exp(-time * 1.4);
    const voiceA = Math.sin(2 * Math.PI * (220 + channel * 18) * time);
    const voiceB = Math.sin(2 * Math.PI * (330 + channel * 24) * time) * 0.35;
    const noise = (Math.random() * 2 - 1) * 0.18;

    data[index] = (voiceA + voiceB + noise) * envelope * 0.42;
  }
}

function fillSweep(data: Float32Array, sampleRate: number) {
  const duration = data.length / sampleRate;

  for (let index = 0; index < data.length; index += 1) {
    const time = index / sampleRate;
    const progress = time / duration;
    const frequency = 180 + 2600 * progress * progress;
    const envelope = Math.sin(Math.PI * progress);
    const noise = (Math.random() * 2 - 1) * progress * 0.12;

    data[index] =
      (Math.sin(2 * Math.PI * frequency * time) * 0.38 + noise) * envelope;
  }
}

function fillImpact(data: Float32Array, sampleRate: number) {
  for (let index = 0; index < data.length; index += 1) {
    const time = index / sampleRate;
    const low = Math.sin(2 * Math.PI * 42 * time) * Math.exp(-time * 4);
    const crack = (Math.random() * 2 - 1) * Math.exp(-time * 18);

    data[index] = bandLimit(low * 0.9 + crack * 0.28);
  }
}

function bandLimit(value: number) {
  return Math.max(-1, Math.min(1, value));
}
