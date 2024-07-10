import express from 'express';
import cors from 'cors';
import { chargeClave } from './infraestructure/auth/tokenManager';


const app = express();

app.use(cors());
app.use(express.json());
chargeClave()


//app.use('/api/users', userRouter);
//app.use('/api/bovinos', bovinoRouter);
 
export { app };
