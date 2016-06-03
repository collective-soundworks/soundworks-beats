import * as soundworks from 'soundworks/server';
import BeatsExperience from './BeatsExperience';

const config = {
  appName: 'Beats',
  // name of the environement, (use NODE_ENV=production to configure express at the same time.)
  env: (process.env.NODE_ENV || 'development'),
};

soundworks.server.init(config);

// define the configuration object to be passed to the `.ejs` template
soundworks.server.setClientConfigDefinition((clientType, config, httpRequest) => {
  return {
    clientType: clientType,
    env: config.env,
    socketIO: config.socketIO,
    appName: config.appName,
    version: config.version,
    defaultType: config.defaultClient,
    assetsDomain: config.assetsDomain,
  };
});

const performance = new BeatsExperience('player');

soundworks.server.start();
