import * as soundworks from 'soundworks/server';
import BeatsExperience from './BeatsExperience';

soundworks.server.init({ appName: 'Beats' });

// define the configuration object to be passed to the `.ejs` template
soundworks.server.setClientConfigDefinition((clientType, config, httpRequest) => {
  return {
    clientType: clientType,
    socketIO: config.socketIO,
    appName: config.appName,
    version: config.version,
    defaultType: config.defaultClient,
    assetsDomain: config.assetsDomain,
  };
});

const performance = new BeatsExperience('player');

soundworks.server.start();
