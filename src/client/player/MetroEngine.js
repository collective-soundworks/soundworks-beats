import { audioContext, audio } from 'soundworks/client';

/**
 * Convert dB to linear gain value (1e-3 for -60dB)
 *
 * @param {number} dBValue
 * @return {number} gain value
 */
function dBToLin(dBValue) {
  return Math.pow(10, dBValue / 20);
}

function generateClickBuffer() {
  const length = 2;
  const channels = 1;
  const gain = -10; // dB
  const sampleRate = audioContext.sampleRate;

  const buffer = audioContext.createBuffer(channels, length, sampleRate);
  const data = buffer.getChannelData(0);

  const amplitude = dBToLin(gain);
  data[0] = amplitude;
  data[1] = -amplitude;

  return buffer;
}

function generateClackBuffer() {
  const length = 5;
  const channels = 1;
  const gain = -10; // dB
  const sampleRate = audioContext.sampleRate;

  const buffer = audioContext.createBuffer(channels, length, sampleRate);
  const data = buffer.getChannelData(0);
  const amplitude = dBToLin(gain);

  for (let i = 0; i < length; i += 1) {
    data[i] = amplitude; // sic
  }

  return buffer;
}

function generateNoiseBuffer() {
  const duration = 0.2; // second
  const gain = -30; // dB
  const sampleRate = audioContext.sampleRate;

  const length = duration * audioContext.sampleRate;
  const amplitude = dBToLin(gain);
  const channelCount = audioContext.destination.channelCount;
  const buffer = audioContext.createBuffer(channelCount, length, sampleRate);

  for (let c = 0; c < channelCount; c += 1) {
    const data = buffer.getChannelData(c);

    for (let i = 0; i < length; i += 1) {
      data[i] = amplitude * (Math.random() * 2 + 1);
    }
  }

  return buffer;
}

class MetroEngine extends audio.TimeEngine {
  constructor(sync, model) {
    super();

    this.model = model;
    this.sync = sync;
    this.period = 1;

    this.clickBuffer = generateClickBuffer();
    this.clackBuffer = generateClackBuffer();
    this.noiseBuffer = generateNoiseBuffer();

    this.output = audioContext.createGain();
  }

  set gain(value) {
    this.output.gain.value = dBToLin(value);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  advanceTime(syncTime) {
    const now = this.sync.getSyncTime();
    const audioTime = this.master.audioTime;
    let normalBuffer;
    let lateBuffer;

    if (this.model.forceBuffer === 'auto') {
      switch (this.model.state) {
        case 'syncDetails':
          normalBuffer = this.clackBuffer;
          lateBuffer = this.noiseBuffer;
          break
        case 'calibrateDelay':
          normalBuffer = this.clickBuffer;
          lateBuffer = this.noiseBuffer;
          break
        case 'calibrateGain':
          normalBuffer = this.noiseBuffer;
          lateBuffer = this.noiseBuffer;
          break
      }
    } else {
      normalBuffer = this[`${this.model.forceBuffer}Buffer`];
      lateBuffer = this[`${this.model.forceBuffer}Buffer`];
    }

    if (syncTime < now) {
      this.triggerSound(audioTime, lateBuffer);
    } else {
      this.triggerSound(audioTime, normalBuffer);
    }

    return syncTime + this.period;
  }

  triggerSound(audioTime, buffer) {
    const phase = this.model.invertPhase ? this.period / 2 : 0;
    const delay = this.model.delay * 0.001;
    const startTime = Math.max(0, audioTime + phase + delay);

    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(this.output);
    bufferSource.start(startTime);
  }
}

export default MetroEngine;
