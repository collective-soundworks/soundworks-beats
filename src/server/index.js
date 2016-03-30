import * as soundworks from 'soundworks/server';
import BeatsExperience from './BeatsExperience';

soundworks.server.init({ appName: 'Beats' });

var performance = new BeatsExperience('player');

soundworks.server.start();
