/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

const child = require('child_process');
const ping = require('minecraft-ping');
const fs = require('fs');
const pidusage = require('pidusage');

const express = require('express');

const api = express();
const apiPort = 3002;

let minecraft;

api.get('/up', function(req, res) {
  res.send(!(minecraft == undefined || minecraft.killed));
});

api.get('/usage', function(req, res) {
  if (config().pid != 0) {
    pidusage(config().pid, function(err, stats) {
      res.send(stats);
    });
  } else {
    res.send({});
  }
});

api.listen(apiPort, () => console.log(`api on port ${apiPort}`));

function config() {
  const configFile = './config.json';
  return JSON.parse(fs.readFileSync(configFile));
}

const WebSocketServer = require('ws').Server;
const port = 3001;
wss = new WebSocketServer({port});
console.log(`listening on port ${port}`);

wss.on('connection', function(ws) {
  //  listens for a new websocket
  ws.on('message', function(message) {
    // listens for a message (request) from the client
    message = JSON.parse(message);
    console.log(message.value);
    if (message.pw == config().password) {
      if (message.MC == true) {
      //  if the client sends a request that should go to the MC server
        if (!(minecraft == undefined || minecraft.killed)) {
        //  but go to check that the server didn't crash
        //  the client would be able to run commands outside the server
          ping.ping_fe01fa({host: 'localhost', port: 25565}, function(err, res) {
          //  test to see if the server is still running
            if (res) {
            //  if the ping has a response then the server is up
              minecraft.stdin.write(message.value + '\n');
            //  we can safely send the command to the minecraft server
            } else {
            //  if the server isnt up then the server has stopped
              minecraft.kill();
            //  kill the sub process so it can start again
            }
          });
        }
      } else {
      // if the request isnt for the MC server
      // then its to start or stop the server
        if (message.value == 'start') {
          if (minecraft == undefined || minecraft.killed) {
          //  if the server hasnt started or has already been killed
            sendToClient(ws, 'orange', false);
            //  tell the client, the server is changing state
            minecraft = child.spawn('/bin/sh', []);
            //  editConfig('pid', minecraft.pid.toString());
            //  spawn a sub process but do nothing with it
            mcServerToClient(ws);
            //  send the output from the subprocess to the client
            minecraft.stdin.write('cd servers/' + config().version + '\n');
            minecraft.stdin.write(config().start + '\n');
            // start the selected MC server version
            sendToClient(ws, '-----started server-----', true);
            sendToClient(ws, 'green', false);
          // tell the client its been started
          } else {
            sendToClient(ws, '-----server is already running-----', true);
          //  if the client spammed start
          //  it will just tell them its already been started
          }
        } else if (message.value == 'stop') {
          if (!(minecraft == undefined || minecraft.killed)) {
          //  if the is server started or never started
            sendToClient(ws, 'orange', false);
            //  tell the client, the server is changing state
            minecraft.stdin.write('stop\n');
            //  tell the server to shutdown so it can do it safely
            setTimeout( function() {
              minecraft.kill();
              //  editConfig('pid', 0);
            }, 5000);
            //  after 2 seconds kill the sub process
            sendToClient(ws, '-----stopped server-----', true);
            sendToClient(ws, 'red', false);
          // tell client its been stopped
          } else {
            sendToClient(ws, '-----server is already stopped-----', true);
          //  if the client tries to spam they just get spammed back
          }
        }
      }
    }
  });

  if (!(minecraft == undefined || minecraft.killed)) {
    //  MC server is running
    sendToClient(ws, 'green', false);
  } else {
    //  MC server isn't running
    sendToClient(ws, 'red', false);
  }


  //  if the MC server is already running when the client connects
  //  then this will be fine
  //  but if the server isnt running this will through an error
  //  but it doesnt matter cuz the client can just start it
  //  so its in a try and catch but with an empty catch
  try {
    mcServerToClient(ws);
  } catch (err) {
    {}
  }
});

function mcServerToClient(ws) {
  //  when a message comes from the MC server, it gets sent to the client
  minecraft.stdout.on('data', function(data) {
    sendToClient(ws, data, true);
  });

  minecraft.stderr.on('data', function(data) {
    sendToClient(ws, data, true);
  });
}

function sendToClient(ws, data, text) {
  //  sends messages to the websocket client
  data = data.toString();
  try {
    ws.send(JSON.stringify({text, data}));
  } catch (err) {
    {}
  }
}

function editConfig(variable, value) {
  file = './config.json';
  newConfig = config();
  newConfig[variable] = value;
  console.log(newConfig);
  fs.writeFile(file, JSON.stringify(newConfig), function(err) {
    if (err) {
      console.log(err);
    }
  });
}
