import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const secureFolderPath = './src/infraestructure/auth/secure';

let currentSecretKey = ''
interface ClaveSecretaData {
    claveSecreta: string;
}
export async function chargeClave() {
    const filePath = path.join(secureFolderPath, 'clave_secreta.json');
    if (fs.existsSync(filePath)) {
        const contenidoArchivo = fs.readFileSync(filePath, 'utf8');
        const claveSecretaData: ClaveSecretaData = JSON.parse(contenidoArchivo);
        console.log('Clave secreta cargada desde el archivo.');
        currentSecretKey = claveSecretaData.claveSecreta;
    } else {
        console.warn('El archivo de clave secreta no existe.');
    }
}

export async function verifyToken(token: string): Promise<any|Boolean> {
    try {
        if (!currentSecretKey) {
            await chargeClave();
        }
        const decoded: any = jwt.verify(token, currentSecretKey);

        if (decoded.permission && decoded.permission.includes('server')) {
            return true;
        } else {
            return decoded;
        }


    } catch (error) {
        throw new Error('Token inválido');
    }
}