import { log } from '../../shared/utils';

import { Experience, audioContext } from 'soundworks/client';
// import Synth from './Synth';
import BeatsView from './BeatsView';
import MetroEngine from './MetroEngine';

const model = {
  state: 'syncDetails',

  mute: false,
  invertPhase: false,
  userAgent: navigator.userAgent,

  syncDetails: {
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
  },

  delay: 0,
  gain: 0,
};

class BeatsPerformance extends Experience {
  constructor() {
    super();

    this.model = model;

    this.platform = this.require('platform', { features: 'web-audio' });

    this.sync = this.require('sync');
    this.syncScheduler = this.require('sync-scheduler');

    this.sharedParams = this.require('shared-params');

    this.sync.addListener(report => {
      Object.assign(this.model.syncDetails, report);

      if (this.view && this.model.state === 'syncDetails') {
        this.view.render();
      }
    });
  }

  start() {
    super.start();

    this.syncScheduler.lookahead = 1;

    this.view = new BeatsView(this.model, this);

    this.metro = new MetroEngine(this.sync);
    this.metro.connect(audioContext.destination);

    log('experience started');

    this.show().then(() => {
      // console.log('[test]')
      this.send('init-request');

      this.receive('init', values => {
        // if (values !== null) {
          // this.model.gain = values.gain;
          // this.model.delay = values.delay;
          // this.view.render();

          // this.update('gain', values.gain);
          // this.update('delay', values.delay);
        // }

        // const nextTime = Math.ceil(this.sync.getSyncTime());
        // this.syncScheduler.add(this.metro, nextTime);
        // log('scheduler added');

      });

      const nextTime = Math.ceil(this.sync.getSyncTime());
      this.syncScheduler.add(this.metro, nextTime);
      log('scheduler added');


    });
  }

  update(target, value) {
    log('update', target, value);

    switch (target) {
      case 'invertPhase':
        this.metro.invertPhase = value;
        break;
      case 'delay':
        this.metro.delay = value * 0.001;
        break;
      case 'gain':
        this.metro.gain = value;
        break;
    }
  }
}

export default BeatsPerformance;
