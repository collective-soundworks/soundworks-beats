// Loading the libraries
var clientSide = require('soundworks/client');
var client = clientSide.client;
var audioContext = require('audio-context');

// Initiliazing the socket.io namespace
client.init('/player');

window.addEventListener('load', () => {
  // Scenario definitions

  var welcome = new clientSide.Dialog({
    id: 'welcome',
    text: "<p>Welcome to <b>Beats</b>.</p> <p>Touch the screen to join!</p>",
    activateAudio: true
  });


  var sync = new clientSide.Sync();

  // Instantiate the performance module (defined before)
  var performance = new BeatsClientPerformance(sync);

  // Start the scenario and link the modules
  client.start(
    client.serial(
      welcome,
      sync, // init the sync process
      performance
    )
  );

});

class BeatsClientPerformance extends clientSide.Module {
  constructor(sync) {
    this.sync = sync; // the sync module
    this.synth = new Synth(); // a Web Audio synth that makes sound

    // When the server sends the beat loop start time
    client.socket.on('beat_start', (startTime, beatPeriod) => {
      // Calculate the next beat trigger time in local time
      var startTimeLocal = this.sync.getLocalTime(startTime);
      var now = this.sync.getLocalTime();
      var elapsedBeats = Math.floor((now - startTimeLocal) / beatPeriod);
      var nextBeatTime = startTimeLocal + beatPeriod * (elapsedBeats + 1);

      // Launch the synth at that time
      this.synth.play(nextBeatTime, beatPeriod);
    })
  }

  // Must have
  start() {
    super.start(); // mandatory

    // Send a message to the server indicating that the user entered the performance
    client.socket.emit('perf_start'); // 
  }

  // Must have
  done() {
    super.done(); // mandatory
  }
}

class Synth {
  constructor() {
    this.lookahead = 0.3;
    this.buffer = this.generateClickBuffer();
  }

  generateClickBuffer() {
    const channels = 1;

    const length = 2;
    var buffer = audioContext.createBuffer(channels, length,
      audioContext.sampleRate);
    // buffer.copyToChannel(array, 0); // error on Chrome?
    var data = buffer.getChannelData(0);

    // first 2 samples are actual click, the rest is fixed noise
    data[0] = 1;
    data[1] = -1;

    return buffer;
  }


  play(startTime, period) {
    this.triggerSound(startTime);
    setTimeout(() => {
      this.play(startTime + period, period)
    }, 1000 * (period - this.lookahead));
  }

  triggerSound(startTime) {
    var bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = this.buffer;
    bufferSource.connect(audioContext.destination);

    // duration parameter ignored? on Safari (7.1.2), Firefox (34)

    // compensate client delay
    bufferSource.start(startTime);

    console.log('click');
    // plays a sound when the Web Audio clock reaches startTime
  }
}