import 'dotenv/config';
import { createApp } from './app/createApp.js';
import { connectDatabase } from './config/database.js'; 
// Nota: Se o seu grupo não for usar o script de seed para a entrega, você pode comentar a linha abaixo
// import { runSeed } from './database/seed.js';

const PORT = process.env.PORT || 3001;

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  console.log("MONGODB_URI =", process.env.MONGODB_URI);
  
  // Conecta ao MongoDB Singleton criado pelo Luiz Miguel
  if (mongoUri) {
    await connectDatabase(mongoUri);
  } else {
    console.log('Aviso: MONGODB_URI não encontrada. Rodando sem conexão direta.');
  }

  // Inicializa o servidor Express
  const app = createApp();
  
  app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
  });
}

main().catch(console.error);