'use strict';

// Libraries
let debug = require('debug')('soundworks-beats');

// Soundworks library
let serverSide = require('soundworks/server');
let server = serverSide.server;

// Express application
let express = require('express');
let app = express();
let path = require('path');
let port = process.env.PORT || 8000;
let dir = path.join(__dirname, '../../public');

let sync = new serverSide.Sync();

class BeatsServerPerformance extends serverSide.Module {
  constructor() {
    this.startTime = sync.getMasterTime();
    this.beatPeriod = 1; // in seconds
  }

  connect(client) {
    let socket = client.socket;

    socket.on('perf_start', () => {
      socket.emit('beat_start', this.startTime, this.beatPeriod);
    });
  }

  disconnect(client) {}
}

let performance = new BeatsServerPerformance();

debug('launch server');

// Launch server
server.start(app, dir, 8000);
server.map('/player', 'Beats', sync,  performance);
