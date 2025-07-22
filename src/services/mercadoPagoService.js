import mercadopago from "mercadopago";

/**
 * ADVERTENCIA DE SEGURIDAD IMPORTANTE:
 * Al igual que con Transbank, en una aplicación real, el Access Token NUNCA debe estar en el código del cliente.
 * Debe estar en un backend (Firebase Functions) que reciba la petición y se comunique de forma segura con Mercado Pago.
 * Este código es una SIMULACIÓN para desarrollo.
 */

/**
 * Función para crear una preferencia de pago en Mercado Pago.
 * @param {Array} items - Los productos en el carrito.
 * @param {string} returnUrl - La URL a la que Mercado Pago redirigirá al usuario.
 * @param {string} accessToken - El Access Token del vendedor (socio).
 * @returns {Promise<string>} - La URL de pago de Mercado Pago (init_point).
 */
export const createMercadoPagoPreference = async (
  items,
  returnUrl,
  accessToken
) => {
  if (!accessToken) {
    throw new Error("El Access Token de Mercado Pago no está configurado.");
  }

  // La configuración se mueve aquí para que se ejecute solo cuando se llama a la función.
  mercadopago.configure({
    access_token: accessToken,
  });

  // Creamos un objeto "preferencia" con los detalles de la venta
  const preference = {
    items: items.map((item) => ({
      title: item.name,
      unit_price: Math.round(item.salePrice * 1.19), // Mercado Pago usa el precio final (con IVA)
      quantity: item.quantity,
    })),
    back_urls: {
      success: returnUrl,
      failure: returnUrl,
      pending: returnUrl,
    },
    auto_return: "approved", // Regresa automáticamente al sitio si el pago es aprobado
  };

  try {
    const response = await mercadopago.preferences.create(preference);

    // La respuesta contiene la URL de pago a la que debemos redirigir al cliente
    if (response.body.init_point) {
      return response.body.init_point;
    } else {
      throw new Error(
        "La respuesta de Mercado Pago no incluyó una URL de pago."
      );
    }
  } catch (error) {
    console.error("Error al crear la preferencia en Mercado Pago:", error);
    throw new Error("No se pudo iniciar el pago con Mercado Pago.");
  }
};
