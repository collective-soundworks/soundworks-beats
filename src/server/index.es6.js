'use strict';

// Soundworks library
var serverSide = require('soundworks/server');
var server = serverSide.server;

// Express application
var express = require('express');
var app = express();
var path = require('path');
var dir = path.join(__dirname, '../../public');

var sync = new serverSide.Sync();

class BeatsServerPerformance extends serverSide.Performance {
  constructor() {
    super();
    
    this.startTime = sync.getSyncTime();
    this.beatPeriod = 1; // in seconds
  }

  connect(client) {
    super.connect(client);

    client.receive('performance:start', () => {
      // debug('perf_start', this.startTime, this.beatPeriod);
      client.send('performance:startBeat', this.startTime, this.beatPeriod);
    });
  }

  disconnect(client) {
    super.disconnect(client);
  }
}

var performance = new BeatsServerPerformance();

// debug('launch server'
server.start(app, dir, 8000);
server.map('/player', 'Beats', sync, performance);
