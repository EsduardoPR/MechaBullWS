import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { app } from '../../app'
import { verifyToken } from '../auth/tokenManager';
import { ConnectedUser } from '../../domain/users';

const startServer = () => {
  const server = http.createServer(app);
  const port = process.env.PORT;
  const setupWebSocket = new WebSocketServer({ server });

  const connectedUsers: { [key: string]: ConnectedUser } = {};

  setupWebSocket.on('connection', async (ws: WebSocket, req) =>{
    console.log("un usuario se ah conectado")
    
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if(token){
        try {
          const decoded: any = await verifyToken(token);
          const userId = decoded.idServer;
          const username = decoded.name;

          // Aquí estamos asumiendo que ws tiene las propiedades y métodos necesarios.
          connectedUsers[userId] = { ws, username, readyState: ws.readyState, send: ws.send.bind(ws) };

          console.log(`Usuario conectado: ${username} (ID: ${userId})`);

          // Enviar mensaje de conexión
          ws.send(JSON.stringify({ type: 'connect', message: 'Conectado al servidor WS' }));
        } catch (error) {
          ws.close(1008, 'Invalid token');
        }
      } else {
        ws.close(1008, 'Token required');
      }
    }
    ws.send(JSON.stringify({type:'connect', message:'Conectado al servidor WS'}))

    ws.on('message', async (data: string) =>{
      const parsedMessage = JSON.parse(data);
      if (parsedMessage.type === 'auth'){
        const token = parsedMessage.token;
        const decoded = await verifyToken(token);
        const userId = decoded.userId;
        const username = decoded.username;
        connectedUsers[userId] = { ws, username, readyState: ws.readyState, send: ws.send.bind(ws) };

        const checkTokenInterval = setInterval(() => {
          const currentTime = Date.now() / 1000;
          if (decoded.exp && currentTime > decoded.exp) {
              setTimeout(() => {
                  console.log(`Token-expired from ${decoded.username}`)
                  const message = {
                      event: 'token-expired',
                      message: 'El token de autenticación expiró.'
                  };
                  ws.send(JSON.stringify(message));
                  ws.close(1000, 'token-expi')
              }, 5000);
              
              clearInterval(checkTokenInterval);
          }
        }, 1000);
        if (decoded) {
          console.log(`\nCliente ${username} conectado.\n`);
        }
      }


      function getUserIdFromWebSocket(ws: WebSocket): string | null {
        for (const userId in connectedUsers) {
          if (connectedUsers[userId].ws === ws) {
            return userId;
          }
        }
        return null;
      }

      switch (parsedMessage.event) {
        //EVENTOS ENTRE SERVIDORES
        
        case "dbChange":
          const targetUserId = parsedMessage.data.userId;
          for (const [userId, userSocket] of Object.entries(connectedUsers)) {
            if (userId === targetUserId) {
              console.log('Sending message to:', userId);
              userSocket.ws.send(JSON.stringify({event: 'updateListBovinos', data:parsedMessage.data}))
            }
          }
        break;


        //EVENTOS ENTRE SERVIDOR WS Y CLIENTE
        case "getListBovinos":
          const userId = getUserIdFromWebSocket(ws);
          if (userId) {
            const userInfo = connectedUsers[userId];
            if (userInfo) {
              const { username } = userInfo;
              console.log(`Acción "getListBovinos" ejecutada por usuario: ${username} (ID: ${userId})`);
              ws.send(JSON.stringify({ event: "getListBovinos"}));
            } else {
              console.log(`Usuario con ID ${userId} no encontrado en la lista de usuarios conectados.`);
            }
          } else {
            console.log(`No se encontró el usuario asociado con el WebSocket.`);
          }
          break;
      }
      
    })
    ws.on('close', async () =>{
      for (const userId in connectedUsers) {
        if (connectedUsers[userId].ws === ws) {
          console.log(`Usuario desconectado: ${connectedUsers[userId].username} (ID: ${userId})`);
          delete connectedUsers[userId];
          break;
        }
      }
    })
  })

  server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });
};


export { startServer };
