const cron = require('node-cron');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Ejecutar cada día a medianoche
cron.schedule('0 0 * * *', async () => {
  try {
    await pool.query(
      `UPDATE appointments 
       SET status = 'completada' 
       WHERE date < CURRENT_DATE 
       AND status = 'activa'`
    );
    console.log("✅ Estados de citas actualizados automáticamente");
  } catch (err) {
    console.error("❌ Error actualizando estados:", err);
  }
});

// Mantener el proceso vivo
console.log("⏰ Servicio de cron iniciado. Esperando ejecución diaria...");
