import { Experience, View, audioContext } from 'soundworks/client';
import Synth from './Synth';

const template = `
  <ul class="small">
    <li><span>status: </span><%= status %></li>
    <li><span>status for: </span><%= statusDuration.toFixed(0) %></li>
    <li><span>time offset: </span><%= timeOffset.toString().replace('.', '"') %></li>
    <li><span>frequency ratio: </span><%= frequencyRatio %></li>
    <li><span>connection: </span><%= connection %></li>
    <li><span>connection for: </span><%= connectionDuration.toFixed(0) %></li>
    <li><span>connection time out: </span><%= connectionTimeOut.toFixed(1).replace('.', '"') %></li>
    <li><span>travel duration: </span><%= travelDuration.toFixed(3).replace('.', '"') %></li>
    <li><span>travel duration min: </span><%= travelDurationMin.toFixed(3).replace('.', '"') %></li>
    <li><span>travel duration max: </span><%= travelDurationMax.toFixed(3).replace('.', '"') %></li>
  </ul>
`;

export default class BeatsClientPerformance extends Experience {
  constructor() {
    super();

    this.sync = this.require('sync');
    this.platform = this.require('platform', { features: 'web-audio' });
    this.sharedParams = this.require('shared-params');

    // we hope that some report will be done before experience starts
    this.model = {
      status: '',
      statusDuration: 0,
      timeOffset: 0,
      frequencyRatio: 0,
      connection: '',
      connectionDuration: 0,
      connectionTimeOut: 0,
      travelDuration: 0,
      travelDurationMin: 0,
      travelDurationMax: 0,
    }

    this.sync.addListener((report) => {
      Object.assign(this.model, report);

      if (this.view)
        this.view.render();
    });
  }

  start() {
    super.start();

    this.mute = audioContext.createGain();
    this.mute.connect(audioContext.destination);
    this.mute.gain.value = 0;

    this.synth = new Synth(this.sync); // a Web Audio synth that makes sound
    this.synth.connect(this.mute);

    this.view = new View(template, this.model);
    this.view.options.id = this.id;

    this.show();
    // when the server sends the beat loop start time
    this.receive('start:beat', (startTime, beatPeriod) => {
      this.synth.play(startTime, beatPeriod);
    });

    this.sharedParams.addParamListener('play', (value) => {
      if (value)
        this.mute.gain.value = 1;
      else
        this.mute.gain.value = 0;
    });
  }
}
