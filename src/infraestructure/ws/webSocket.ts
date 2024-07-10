import http from 'http';
import { app } from '../../app'
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../auth/tokenManager';

const startServer = () => {
  const server = http.createServer(app);
  const port = process.env.PORT;
  const setupWebSocket = new WebSocketServer({ server });
  let api = ''

  setupWebSocket.on('connection', async (ws: WebSocket, req) =>{
    const authHeader = req.headers['authorization'];

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if(token){
        try {
          const decoded = await verifyToken(token);
          if(decoded === true){
            console.log("\nApi MechaBull connected.\n")
            api = 'apiMechaBull';
          }
          const checkTokenInterval = setInterval(() => {
              const currentTime = Date.now() / 1000;
              if (decoded.exp && currentTime > decoded.exp) {
                  setTimeout(() => {
                      console.log("el token caduco")
                      const message = {
                          event: 'token-expired',
                          message: 'El token de autenticación expiró.'
                      };
                      ws.send(JSON.stringify(message));
                      ws.close(1008, 'Token expired');
                  }, 5000);
                  
                  clearInterval(checkTokenInterval);
              }
          }, 1000);
        } catch (error) {
          ws.close(1008, 'Invalid token');
        }
      } else {
        ws.close(1008, 'Token required');
      }
    }

    ws.on('message', async (data: string) =>{
        console.log(data)
        ws.send(JSON.stringify({type:'connect', message:'Conectado al servidor WS'}))
    })
    ws.on('close', async () =>{
      if(api === 'apiMechaBull'){
        console.log("\nApi MechanBull disconnected\n")
      } else {
        console.log("clientes desconectados")
      }
      api = ''
    })
  })

  server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });
};
export { startServer };