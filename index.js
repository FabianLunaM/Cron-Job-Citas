const cron = require('node-cron');
const { Pool } = require('pg');
const { sendWhatsAppMessage } = require('./services/wasenderservice');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


sendWhatsAppMessage(
  '+59178835733', // número de prueba
  'Mensaje de prueba desde Railway 🚀'
);

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


cron.schedule('* * * * *', async () => {
  try {
    console.log("⏰ Ejecutando búsqueda de citas...");

    const result = await pool.query(`
      SELECT a.id, a.date, a.time, a.status,
            p.phone AS patient_phone, p.name AS patient_name,
            (a.date::timestamp + a.time) AT TIME ZONE 'America/La_Paz' AS cita_datetime
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.status = 'pendiente'
        AND (a.date::timestamp + a.time) AT TIME ZONE 'America/La_Paz'
            BETWEEN NOW() AT TIME ZONE 'America/La_Paz'
                AND (NOW() AT TIME ZONE 'America/La_Paz') + INTERVAL '1 hour';

    `);

    console.log(`🔎 Se encontraron ${result.rows.length} citas pendientes`);

    result.rows.forEach(cita => {
      const citaDateTime = new Date(cita.cita_datetime); // ajusta zona horaria Bolivia
      const now = new Date();
      const diffMinutes = (citaDateTime - now) / (1000 * 60);

      console.log(`➡️ Cita ${cita.id}: ${cita.date} ${cita.time} - faltan ${Math.round(diffMinutes)} minutos`);

      // Para pruebas: enviamos si faltan menos de 60 minutos
      if (diffMinutes <= 60 && diffMinutes >= 0) {
        sendWhatsAppMessage(
          cita.patient_phone,
          `Hola ${cita.patient_name}, te escribimos del consultorio dental *Ortodent* 🦷✨
          
          Te recordamos que tienes una cita agendada para las ${cita.time}.  
          Por favor asiste puntual y no olvides cepillarte los dientes antes de tu visita.  

          ¡Te esperamos con una gran sonrisa! 😁`
        );

        sendWhatsAppMessage(
          '+59178835733',
          `Recordatorio: Cita agendada con ${cita.patient_name} a las ${cita.time}.
        
          Este es un mensaje automatico. No olvides asistir. 😁`
        );

        console.log(`✅ Recordatorios enviados para cita ${cita.id}`);
      }
    });
  } catch (err) {
    console.error("❌ Error enviando recordatorios:", err);
  }
});


console.log("⏰ Servicio de recordatorios iniciado. Revisando citas cada 30 minutos...");

// Mantener el proceso vivo
console.log("⏰ Servicio de actualizacion de citas iniciado. Esperando ejecución diaria...");
