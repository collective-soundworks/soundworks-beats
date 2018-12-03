import { audioContext, audio } from 'soundworks/client';
import debug from 'debug';

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
  constructor(model, sync) {
    super();

    this.model = model;
    this.sync = sync;
    this.period = 1;
    this.phase = 0;
    this._delay = 0; // compensation

    this.clickBuffer = generateClickBuffer();
    this.clackBuffer = generateClackBuffer();
    this.noiseBuffer = generateNoiseBuffer();

    this.output = audioContext.createGain();
  }

  set invertPhase(flag) {
    if (flag) {
      this.phase = this.period / 2;
    } else {
      this.phase = 0;
    }

    console.log(this.phase);
  }

  set gain(value) {
    this.output.gain.value = dBToLin(value);
  }

  set delay(value) {
    this._delay = value;
  }

  connect(destination) {
    this.output.connect(destination);
  }

  advanceTime(syncTime) {
    const now = this.sync.getSyncTime();
    const audioTime = this.master.audioTime;

    if (syncTime < now) {
      this.triggerSound(audioTime, this.noiseBuffer);
    } else {
      this.triggerSound(audioTime, this.clickBuffer);
    }

    return syncTime + this.period;
  }

  triggerSound(audioTime, buffer) {
    const startTime = Math.max(0, audioTime + this.phase + this._delay);

    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(this.output);
    bufferSource.start(startTime);
  }
}

export default MetroEngine;
