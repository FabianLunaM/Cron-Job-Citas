const cron = require('node-cron');
const { Pool } = require('pg');
const { sendWhatsAppMessage } = require('./services/wasenderservice');

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
       AND status = 'pendiente'`
    );
    console.log("✅ Estados de citas actualizados automáticamente");
  } catch (err) {
    console.error("❌ Error actualizando estados:", err);
  }
});


// Cada 10 minutos
cron.schedule('*/10 * * * *', async () => {

  try {
    const now = new Date();

    const result = await pool.query(`
      SELECT a.id, a.date, a.time, a.status,
             p.phone AS patient_phone, p.name AS patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.status = 'pendiente'
    `);

    result.rows.forEach(cita => {
      const citaDateTime = new Date(`${cita.date}T${cita.time}`);
      const diffMinutes = (citaDateTime - now) / (1000 * 60);

      // Si faltan entre 89 y 90 minutos
      if (diffMinutes <= 90 && diffMinutes > 89) {
        // Mensaje al paciente
        sendWhatsAppMessage(
          cita.patient_phone,
          `Hola ${cita.patient_name}, te escribimos del consultorio dental *Ortodent*. 🦷✨
            
          Te recordamos que tienes una cita agendada para las ${cita.time}.  
          Por favor asiste puntual y no olvides cepillarte los dientes antes de tu visita.  

          ¡Te esperamos con una gran sonrisa! 😁`
        );

        // Mensaje a la doctora
        sendWhatsAppMessage(
          '+59178835733',
          `Recordatorio: tiene cita con ${cita.patient_name} a las ${cita.time}.`
        );

        console.log(`✅ Recordatorios enviados para cita ${cita.id}`);
      }
    });
  } catch (err) {
    console.error("❌ Error enviando recordatorios:", err);
  }
});

console.log("⏰ Servicio de recordatorios iniciado. Revisando citas cada minuto...");

// Mantener el proceso vivo
console.log("⏰ Servicio de cron iniciado. Esperando ejecución diaria...");
