import { WebpayPlus } from "transbank-sdk";
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";

/**
 * ADVERTENCIA DE SEGURIDAD IMPORTANTE:
 * En una aplicación real y en producción, las claves secretas (API Keys) NUNCA deben estar en el código del navegador (cliente).
 * La forma correcta es tener un backend (como Firebase Functions) que guarde las claves de forma segura y se comunique con Transbank.
 * El cliente (nuestra app React) solo llamaría a nuestra propia función en el backend.
 */

// Configuración inicial para usar el entorno de prueba de Transbank.
const tx = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  )
);

/**
 * Función para crear una transacción de Webpay Plus.
 * @param {string} buyOrder - Orden de compra única.
 * @param {string} sessionId - ID de sesión único.
 * @param {number} amount - Monto de la transacción.
 * @param {string} returnUrl - URL a la que Transbank redirigirá al usuario.
 * @returns {Promise<string>} - La URL de pago de Transbank.
 */
export const createWebpayTransaction = async (
  buyOrder,
  sessionId,
  amount,
  returnUrl
) => {
  try {
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);

    if (response.url && response.token) {
      return `${response.url}?token_ws=${response.token}`;
    } else {
      throw new Error(
        "La respuesta de Transbank no incluyó una URL o un token."
      );
    }
  } catch (error) {
    console.error("Error al crear la transacción en Transbank:", error);
    throw new Error("No se pudo iniciar el pago con Transbank.");
  }
};

/**
 * NUEVA FUNCIÓN: Confirma una transacción de Webpay Plus después de que el usuario regresa.
 * @param {string} token - El token 'token_ws' que Transbank añade a la URL de retorno.
 * @returns {Promise<object>} - El resultado de la transacción.
 */
export const confirmWebpayTransaction = async (token) => {
  try {
    const response = await tx.commit(token);
    // La respuesta contiene el estado de la transacción (si fue aprobada, rechazada, etc.)
    // response.status === 'AUTHORIZED' significa que el pago fue exitoso.
    return response;
  } catch (error) {
    console.error("Error al confirmar la transacción en Transbank:", error);
    throw new Error("No se pudo confirmar el pago con Transbank.");
  }
};
