import { Experience, audioContext } from 'soundworks/client';
import { debug } from '../../shared/utils';
import BeatsView from './BeatsView';
import MetroEngine from './MetroEngine';

const model = {
  state: 'syncDetails',
  forceBuffer: 'auto',

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

    this.master = audioContext.createGain();
    this.master.connect(audioContext.destination);

    this.metro = new MetroEngine(this.sync, this.model);
    this.metro.connect(this.master);

    this.sharedParams.addParamListener('forceBuffer', value => {
      this.model.forceBuffer = value;
    });

    this.sharedParams.addParamListener('mute', value => {
      this.model.mute = value;
      this.update('mute', value);
      this.view.render();
    });

    this.show().then(() => {
      this.receive('set-calibration', values => {
        console.log(values);
        this.model.gain = values.gain;
        this.model.delay = values.delay;
        this.view.render();
      });

      this.receive('init', values => {
        const nextTime = Math.ceil(this.sync.getSyncTime());
        this.syncScheduler.add(this.metro, nextTime);
      });

      this.send('init-request', this.model.userAgent);
    });
  }

  update(target, value) {
    switch (target) {
      case 'gain':
        this.metro.gain = value;
        break;
      case 'mute':
        const gain = value ? 0 : 1;
        this.master.gain.value = gain;
        break;
    }
  }

  triggerDb(type) {
    if (type === 'store') {
      const values = {
        delay: this.model.delay,
        gain: this.model.gain,
      }

      this.send('store', this.model.userAgent, values);
    } else if (type === 'retrieve') {
      this.send('retrieve', this.model.userAgent);
    }
  }
}

export default BeatsPerformance;
