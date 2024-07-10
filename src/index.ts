import dotenv from 'dotenv';
dotenv.config();
import { startServer } from './infraestructure/ws/webSocket'
startServer();