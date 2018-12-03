import { Experience } from 'soundworks/server';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'db.json');
let db = {};

if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath));
  } catch(err) {
    // ...
  }
}

console.log(db);

class BeatsExperience extends Experience {
  constructor(clientTypes) {
    super(clientTypes);

    this.sync = this.require('sync');
    this.sharedParams = this.require('shared-params');
    this.syncScheduler = this.require('sync-scheduler');
  }

  start() {
    this.startTime = this.sync.getSyncTime();
    this.beatPeriod = 1; // in seconds
  }

  enter(client) {
    super.enter(client);

    this.receive(client, 'init-request', userAgent => {
      if (db[userAgent] !== undefined) {
        this.send(client, 'set-calibration', db[userAgent]);
      }

      this.send(client, 'init');
    });

    this.receive(client, 'store', (userAgent, values) => {
      db[userAgent] = values;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    });

    this.receive(client, 'retrieve', userAgent => {
      if (db[userAgent] !== undefined) {
        this.send(client, 'set-calibration', db[userAgent]);
      }
    });
  }
}

export default BeatsExperience;
