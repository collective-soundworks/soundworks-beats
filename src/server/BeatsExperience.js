import { Experience } from 'soundworks/server';


class BeatsExperience extends Experience {
  constructor(clientTypes) {
    super(clientTypes);

    this._sync = this.require('sync');
  }

  start() {
    this.startTime = this._sync.getSyncTime();
    this.beatPeriod = 1; // in seconds
  }

  enter(client) {
    super.enter(client);

    this.send(client, 'start:beat', this.startTime, this.beatPeriod);
  }
}

export default BeatsExperience;
