import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 }); // Run WebSocket server on port 8080

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
});

// Export `notifyDashboard` as a named export
export const notifyDashboard = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};
