import { audioContext } from 'soundworks/client';
import debug from 'debug';

const log = debug('soundworks:beats');


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

  for (let i = 0; i < length; ++i)
    data[i] = amplitude; // sic

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

  for (let c = 0; c < channelCount; ++c) {
    const data = buffer.getChannelData(c);

    for (let i = 0; i < length; ++i)
      data[i] = amplitude * (Math.random() * 2 + 1);
  }

  return buffer;
}

class Synth {
  constructor(sync) {
    this.sync = sync;

    this.scheduleID = 0; // to cancel setTimeout
    this.schedulePeriod = 0.05;
    this.scheduleLookahead = 0.5;

    this.clickBuffer = generateClickBuffer();
    this.clackBuffer = generateClackBuffer();
    this.noiseBuffer = generateNoiseBuffer();

    this.output = audioContext.createGain();
  }

  set gain(value) {
    this.output.gain.value = value;
  }

  connect(destination) {
    this.output.connect(destination);
  }

  /**
   * Initiate a running process, starting at nextTime, or now if
   * nextTime is in past.
   *
   * @param {Number} nextTime - in sync time
   * @param {Number} period - in seconds
   */
  play(nextTime, period) {
    clearTimeout(this.scheduleID);

    const now = this.sync.getSyncTime();

    if (nextTime < now + this.scheduleLookahead) {
      // too late
      if (nextTime < now) {
        log('too late by', nextTime - now);
        this.triggerSound(nextTime, this.noiseBuffer);

        // good restart from now
        nextTime += Math.ceil((now - nextTime) / period) * period;

        // next it might be soon: fast forward
        if (nextTime < now + this.scheduleLookahead) {
          log('soon', nextTime - now);
          this.triggerSound(nextTime, this.clackBuffer);
          nextTime += period;
        }
      } else {
        log('triggered', nextTime - now);
        this.triggerSound(nextTime, this.clickBuffer);
        nextTime += period;
      }

    } // within look-ahead

    this.scheduleID = setTimeout(() => {
      this.play(nextTime, period);
    }, 1000 * this.schedulePeriod);
  }

  /**
   * Actually output the sound.
   *
   * @param {Number} startTime - in sync time
   */
  triggerSound(startTime, buffer) {
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(this.output);

    // compensate client delay
    const localTime = Math.max(0, this.sync.getAudioTime(startTime));
    bufferSource.start(localTime);
  }
}

export default Synth;
