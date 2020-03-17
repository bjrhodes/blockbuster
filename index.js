const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const app = express();

app.use(express.static(__dirname + '/public'));
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

const serveStatic = port => {
  http.createServer(app).listen(port, '127.0.0.1');
  console.log('HTTP Listening on http://127.0.0.1:' + port);
};

class Game {
  constructor(wss) {
    this.state = {};
    this.wss = wss;
    this.wss.on('connection', ws => this.newConnection(ws));
    this.broadcastState = this._broadcastState.bind(this);
    this.updateState = this._updateState.bind(this);
  }

  _broadcastState() {
    let payload = JSON.stringify(this.state);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  _updateState(input) {
    // @todo
  }

  incoming(input, ws) {
    this.validateInput(input)
      .then(this.updateState)
      .then(this.broadcastState)
      .catch(err => {
        console.log(err);
        ws.send('{"error":"Invalid input"}');
      });
  }

  sendState(ws) {
    messageStore.latest().then(messages => {
      messages.forEach(message => {
        ws.send(JSON.stringify(message));
      });
    });
  }

  newConnection(ws) {
    this.sendState(ws);
    ws.on('message', input => this.incoming(input, ws));
  }

  validateInput(str) {
    return new Promise((resolve, reject) => {
      let obj = JSON.parse(str);
      if (obj.message && obj.username) {
        resolve(obj);
      } else {
        reject();
      }
    });
  }
}

serveStatic(8081);

new Game(new WebSocket.Server({ port: 8082 }));
console.log('Chat server listening on http://127.0.0.1:8082');
