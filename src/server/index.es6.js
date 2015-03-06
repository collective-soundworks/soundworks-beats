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

class BeatsServerPerformance extends serverSide.Module {
  constructor() {
    var now = process.hrtime();
    this.startTime = now[0] + now[1] * 1e-9; // in seconds
    this.beatPeriod = 0.5 // in seconds
  }

  connect(client) {
    var socket = client.socket;

    socket.on('perf_start', () => {
      socket.emit('beat_start', this.startTime, this.beatPeriod);
    });
  }

  disconnect(client) {}
}

var performance = new BeatsServerPerformance()

server.start(app, dir, 3000);
server.map('/player', 'Beats', sync, performance);