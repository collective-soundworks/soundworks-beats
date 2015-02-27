// Loading the libraries
let clientSide = require('soundworks/client');
let client = clientSide.client;
let audioContext = require('audio-context');

// Initiliazing the socket.io namespace
client.init('/player');

window.addEventListener('load', () => {
  // Scenario definitions

  const welcome = new clientSide.Dialog({
    id: 'welcome',
    text: "<p>Welcome to <b>Beats</b>.</p> <p>Touch the screen to join!</p>",
    activateAudio: true
  });


  let sync = new clientSide.Sync();

  // Instantiate the performance module (defined before)
  let performance = new BeatsClientPerformance(sync);

  // Start the scenario and link the modules
  client.start(
    client.serial(
      client.parallel(
        welcome,
        sync // init the sync process (do not wait for that)
      ),
      performance // when all of them are done, we launch the performance
    )
  );

});

class BeatsClientPerformance extends clientSide.Module {
  constructor(sync) {
    this.sync = sync; // the sync module
    this.synth = new Synth(sync); // a Web Audio synth that makes sound

    // When the server sends the beat loop start time
    client.socket.on('beat_start', (startTime, beatPeriod) => {
      this.synth.play(startTime, beatPeriod);
    });
  }

  // Must have
  start() {
    super.start(); // mandatory: call parent before the party

    // Send a message to the server indicating that the user entered the performance
    client.socket.emit('perf_start'); // 
  }

  // Must have
  done() {
    // nothing special here
    super.done(); // mandatory: call parent after the cleanup
  }
}

class Synth {
  constructor(sync) {
    this.sync = sync;
    
    this.scheduleID = 0; // to cancel setTimeout
    this.schedulePeriod = 0.05;
    this.scheduleLookahead = 0.5;
    
    this.buffer = this.generateClickBuffer();
  }

  generateClickBuffer() {
    const channels = 1;

    const length = 2;
    let buffer = audioContext.createBuffer(channels, length,
                                           audioContext.sampleRate);
    let data = buffer.getChannelData(0);

    // first 2 samples are actual click, the rest is fixed noise
    data[0] = 1;
    data[1] = -1;

    return buffer;
  }

  /** 
   * Initiate a running process, starting at nextTime, or now if
   * nextTime is in past.
   * 
   * @param {Number} nextTime in master time
   * @param {Number} period 
   */
  play(nextTime, period) {
    clearTimeout(this.scheduleID);
    const now = this.sync.getServerTime();
    
    if(nextTime < now + this.scheduleLookahead) {
      this.triggerSound(nextTime);

      if(nextTime < now) {
        // good restart from now
        nextTime = now + (now - nextTime) % period;
        
        // it might be soon: fast forward
        if(nextTime < now + this.scheduleLookahead) {
          this.triggerSound(nextTime);
          nextTime += period;
        }
      }
      else {
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
  triggerSound(startTime) {
    let bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = this.buffer;
    bufferSource.connect(audioContext.destination);

    // compensate client delay
    const localTime = Math.max(0, this.sync.getLocalTime(startTime));
    bufferSource.start(localTime);

    console.log('click');
    // plays a sound when the Web Audio clock reaches startTime
  }
}
