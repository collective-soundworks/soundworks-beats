import { Experience, View } from 'soundworks/client';
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

    this._sync = this.require('sync');
    this._platform = this.require('platform', { features: 'web-audio' });

    this.synth = new Synth(this._sync); // a Web Audio synth that makes sound

    // we hope that some report will be done before experience starts
    this.viewContent = {
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

    this._sync.addListener((report) => {
      Object.assign(this.viewContent, report);

      if (this.view)
        this.view.render();
    });
  }

  init() {
    this.viewTemplate = template;
    this.viewCtor = View;

    this.view = this.createView();
  }

  start() {
    super.start();

    if (!this.hasStarted)
      this.init();

    this.show();
    // When the server sends the beat loop start time
    this.receive('start:beat', (startTime, beatPeriod) => {
      this.synth.play(startTime, beatPeriod);
    });
  }
}
