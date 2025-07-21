// Importamos los módulos necesarios de Firebase y SendGrid
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Inicializamos la conexión con la base de datos de Firebase
admin.initializeApp();

// --- CONFIGURACIÓN DE SENDGRID ---
// ¡IMPORTANTE! Nunca escribas tu clave secreta directamente en el código.
// La guardaremos en las variables de entorno de Firebase.
const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Esta es nuestra "Función Cloud".
 * Se activa automáticamente cada vez que un documento de producto es ACTUALIZADO.
 */
exports.checkStockLevel = functions.firestore
  .document("artifacts/{appId}/users/{userId}/products/{productId}")
  .onUpdate(async (change, context) => {
    // Obtenemos los datos del producto ANTES y DESPUÉS de la actualización
    const productDataAfter = change.after.data();
    const productDataBefore = change.before.data();

    const stockAfter = productDataAfter.stock;
    const stockBefore = productDataBefore.stock;
    const minStock = productDataAfter.minStockThreshold;

    // --- Lógica de la Alerta ---
    // Solo enviamos la alerta si el stock HA CRUZADO el umbral,
    // no cada vez que esté por debajo (para evitar spam).
    const hasCrossedThreshold =
      stockBefore > minStock && stockAfter <= minStock;

    if (hasCrossedThreshold) {
      console.log(
        `¡Alerta de stock bajo para ${productDataAfter.name}! Stock actual: ${stockAfter}`
      );

      // Obtenemos el email del usuario dueño de este producto
      const userId = context.params.userId;
      const userRecord = await admin.auth().getUser(userId);
      const userEmail = userRecord.email;

      if (!userEmail) {
        console.error("El usuario no tiene un email registrado.");
        return null;
      }

      // Preparamos el correo electrónico
      const msg = {
        to: userEmail,
        from: "alertas-inventario@tu-dominio.com", // Debes verificar este email en SendGrid
        subject: `Alerta de Stock Bajo: ${productDataAfter.name}`,
        html: `
            <h1>Alerta de Inventario</h1>
            <p>Hola,</p>
            <p>Tu producto <strong>${productDataAfter.name}</strong> ha alcanzado su nivel de stock mínimo.</p>
            <ul>
              <li><strong>Stock Actual:</strong> ${stockAfter}</li>
              <li><strong>Umbral Mínimo:</strong> ${minStock}</li>
            </ul>
            <p>Te recomendamos hacer un nuevo pedido a tu proveedor para evitar un quiebre de stock.</p>
            <br>
            <p>Atentamente,</p>
            <p>Tu Sistema de Inventario Apialan</p>
          `,
      };

      // Enviamos el correo usando SendGrid
      try {
        await sgMail.send(msg);
        console.log("Correo de alerta enviado exitosamente a", userEmail);
        return null;
      } catch (error) {
        console.error("Error al enviar el correo con SendGrid:", error);
        if (error.response) {
          console.error(error.response.body);
        }
        return null;
      }
    } else {
      // Si no se cruzó el umbral, no hacemos nada.
      console.log(
        `Stock para ${productDataAfter.name} actualizado, sin alerta. Stock: ${stockAfter}`
      );
      return null;
    }
  });
