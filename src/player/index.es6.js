'use strict';

// Loading the libraries
let debug = require('debug')('soundworks:player:beats');

let clientSide = require('soundworks/client');
let client = clientSide.client;
let audioContext = clientSide.audioContext;

// Initiliazing the client with its type
client.init('player');

class Synth {
  constructor(sync) {
    this.sync = sync;

    this.scheduleID = 0; // to cancel setTimeout
    this.schedulePeriod = 0.05;
    this.scheduleLookahead = 0.5;

    this.clickBuffer = this.generateClickBuffer();
    this.clackBuffer = this.generateClackBuffer();
    this.noiseBuffer = this.generateNoiseBuffer();
  }

  generateClickBuffer() {
    const length = 2;
    const channels = 1;
    const gain = -10; // dB

    let buffer = audioContext.createBuffer(channels, length,
                                           audioContext.sampleRate);
    let data = buffer.getChannelData(0);

    const amplitude = this.dBToLin(gain);
    data[0] = amplitude;
    data[1] = -amplitude;

    return buffer;
  }

  generateClackBuffer() {
    const length = 5;
    const channels = 1;
    const gain = -10; // dB

    let buffer = audioContext.createBuffer(channels, length,
                                           audioContext.sampleRate);
    const amplitude = this.dBToLin(gain);
    let data = buffer.getChannelData(0);

    for(let i = 0; i < length; ++i) {
      data[i] = amplitude; // sic
    }

    return buffer;
  }

  generateNoiseBuffer() {
    const duration = 0.2; // second
    const gain = -30; // dB

    const length = duration * audioContext.sampleRate;
    const amplitude = this.dBToLin(gain);
    const channelCount = audioContext.destination.channelCount;
    let buffer = audioContext.createBuffer(channelCount, length,
                                           audioContext.sampleRate);
    for(let c = 0; c < channelCount; ++c) {
      let data = buffer.getChannelData(c);
      for(let i = 0; i < length; ++i) {
        data[i] = amplitude * (Math.random() * 2 + 1);
      }
    }

    return buffer;
  }

  /**
   * Initiate a running process, starting at nextTime, or now if
   * nextTime is in past.
   *
   * @param {Number} nextTime in sync time
   * @param {Number} period
   */
  play(nextTime, period) {
    clearTimeout(this.scheduleID);
    const now = this.sync.getSyncTime();

    if(nextTime < now + this.scheduleLookahead) {
      // too late
      if(nextTime < now) {
        debug('too late by', nextTime - now);
        this.triggerSound(nextTime, this.noiseBuffer);

        // good restart from now
        nextTime += Math.ceil((now - nextTime) / period) * period;

        // next it might be soon: fast forward
        if(nextTime < now + this.scheduleLookahead) {
          debug('soon', nextTime - now);
          this.triggerSound(nextTime, this.clackBuffer);
          nextTime += period;
        }
      } else {
        debug('triggered', nextTime - now);
        this.triggerSound(nextTime, this.clickBuffer);
        nextTime += period;
      }

    } // within look-ahead

    this.scheduleID = setTimeout( () => {
      this.play(nextTime, period);
    }, 1000 * this.schedulePeriod);
  }

  /**
   * Actually output the sound.
   *
   * @param {Number} startTime in master time
   *
   */
  triggerSound(startTime, buffer) {
    let bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(audioContext.destination);

    // compensate client delay
    const localTime = Math.max(0, this.sync.getLocalTime(startTime));
    // debug("trigger startTime = ", startTime);
    // debug("trigger localTime = ", localTime);
    bufferSource.start(localTime);
  }

  /**
   * Convert dB to linear gain value (1e-3 for -60dB)
   *
   * @param {number} dBValue
   *
   * @return {number} gain value
   */
  dBToLin(dBValue) {
    return Math.pow(10, dBValue / 20);
  }

}

class BeatsClientPerformance extends clientSide.Performance {
  constructor(sync, options = {}) {
    super(options);

    this.sync = sync; // the sync module
    this.synth = new Synth(sync); // a Web Audio synth that makes sound

    // When the server sends the beat loop start time
    client.receive('performance:startBeat', (startTime, beatPeriod) => {
      this.synth.play(startTime, beatPeriod);
    });

    this.sync.on('sync:status', (report) => {
      this.view.innerHTML = '';
      for(let k in report) {
        if(report.hasOwnProperty(k) ) {
          switch(k) {
          case 'status':
            this.view.innerHTML += 'status: ' + report[k] + '<br>';
            break;
          case 'statusDuration':
            this.view.innerHTML += 'status for: ' +
              report[k].toFixed(0) + '"<br>';
            break;
          case 'timeOffset':
            this.view.innerHTML += 'time offset: ' +
              report[k].toString().replace('.', '"') + '<br>';
            break;
          case 'frequencyRatio':
            this.view.innerHTML += 'frequency ratio: ' + report[k] +
              '"<br>';
            break;
          case 'connection':
            this.view.innerHTML += 'connection: ';
            if(report[k] === 'offline') {
              this.view.innerHTML += '<b>OFFLINE</b>';
            } else {
              this.view.innerHTML += report[k];
            }
            this.view.innerHTML += '<br>';
            break;
          case 'connectionDuration':
            this.view.innerHTML += 'connection for: ' +
              report[k].toFixed(0) + '" <br>';
            break;
          case 'connectionTimeOut':
            this.view.innerHTML += 'connection time out: ' +
              report[k].toFixed(1).replace('.', '"') + '<br>';
            break;
          case 'travelDuration':
            this.view.innerHTML += 'travel duration: ' +
              report[k].toFixed(3).replace('.', '"') + '<br>';
            break;
          case 'travelDurationMin':
            this.view.innerHTML += 'travel duration min: ' +
              report[k].toFixed(3).replace('.', '"') + '<br>';
            break;
          case 'travelDurationMax':
            this.view.innerHTML += 'travel duration max: ' +
              report[k].toFixed(3).replace('.', '"') + '<br>';
            break;
          }
        }
      }
    });
  }
}

window.addEventListener('load', () => {
  // Scenario definitions

  const welcome = new clientSide.Dialog({
    id: 'welcome',
    text: '<p>Welcome to <b>Beats</b>.</p> <p>Touch the screen to start.</p>',
    activateAudio: true
  });


  let sync = new clientSide.Sync();

  // Instantiate the performance module (defined before)
  let performance = new BeatsClientPerformance(sync);

  // Start the scenario and link the modules
  client.start(
    client.serial(
      welcome,
      sync, // init the sync process
      performance // when all of them are done, we launch the performance
    )
  );

});
