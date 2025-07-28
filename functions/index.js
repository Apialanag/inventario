// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");
const { WebpayPlus, Options, Environment } = require("transbank-sdk");

admin.initializeApp();
const db = admin.firestore(); // Define db aquí para que esté disponible para todas las funciones

// --- FUNCIÓN PARA PAGO CON MERCADO PAGO ---
exports.createMercadoPagoPreference = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "El usuario no está autenticado."
      );
    }
    const userId = context.auth.uid;
    const { cart, appId, returnUrl } = data;

    if (!cart || !appId || !returnUrl) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Faltan datos para crear la preferencia."
      );
    }

    try {
      const settingsRef = admin
        .firestore()
        .doc(`artifacts/${appId}/users/${userId}/settings/app_config`);
      const settingsSnap = await settingsRef.get();

      if (!settingsSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "No se encontró la configuración del usuario."
        );
      }

      const settings = settingsSnap.data();
      const accessToken = settings.posPrivateKey;

      if (!accessToken) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "El Access Token de Mercado Pago no está configurado."
        );
      }

      mercadopago.configure({ access_token: accessToken });

      const items = cart.map((item) => ({
        title: item.name,
        unit_price: Math.round((item.salePrice || 0) * 1.19),
        quantity: item.quantity,
      }));

      const preference = {
        items: items,
        back_urls: {
          success: returnUrl,
          failure: returnUrl,
          pending: returnUrl,
        },
        auto_return: "approved",
      };

      const response = await mercadopago.preferences.create(preference);
      return { id: response.body.id, init_point: response.body.init_point };
    } catch (error) {
      console.error("Error al crear preferencia de Mercado Pago:", error);
      throw new functions.https.HttpsError(
        "internal",
        "No se pudo crear el link de pago.",
        error.message
      );
    }
  }
);

// --- FUNCIÓN PARA PAGO CON TRANSBANK ---
exports.createTransbankTransaction = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "El usuario no está autenticado."
      );
    }
    const userId = context.auth.uid;
    const { cart, appId, returnUrl } = data;

    if (!cart || !appId || !returnUrl) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Faltan datos para crear la transacción."
      );
    }

    try {
      const settingsRef = admin
        .firestore()
        .doc(`artifacts/${appId}/users/${userId}/settings/app_config`);
      const settingsSnap = await settingsRef.get();

      if (!settingsSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "No se encontró la configuración del usuario."
        );
      }

      const settings = settingsSnap.data();
      const commerceCode = settings.posPublicKey;
      const apiKey = settings.posPrivateKey;

      if (!commerceCode || !apiKey) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Las credenciales de Transbank no están configuradas."
        );
      }

      const tx = new WebpayPlus.Transaction(
        new Options(commerceCode, apiKey, Environment.Production)
      );

      const buyOrder = `bo_${Date.now()}`;
      const sessionId = `sid_${userId.substring(0, 10)}`;
      const amount = cart.reduce(
        (sum, item) =>
          sum + Math.round((item.salePrice || 0) * 1.19) * item.quantity,
        0
      );

      const response = await tx.create(buyOrder, sessionId, amount, returnUrl);

      return { url: response.url, token: response.token };
    } catch (error) {
      console.error("Error al crear la transacción de Transbank:", error);
      throw new functions.https.HttpsError(
        "internal",
        "No se pudo crear el link de pago con Transbank.",
        error.message
      );
    }
  }
);

// REEMPLAZA TU FUNCIÓN migrateUsers CON ESTA VERSIÓN

exports.migrateUsers = functions.https.onRequest(async (req, res) => {
  const oldUsersRef = db.collection("artifacts/default-app-id/users");
  const newUsersRef = db.collection("artifacts/apialaninventarioapp/users");

  try {
    const oldUsersSnapshot = await oldUsersRef.get();

    if (oldUsersSnapshot.empty) {
      console.log("No hay usuarios que migrar.");
      res.status(200).send("No hay usuarios que migrar.");
      return;
    }

    const batch = db.batch();

    for (const userDoc of oldUsersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      if (userId === "undefined") continue;
      console.log(`Migrando usuario: ${userId}`);

      const newUserDocRef = newUsersRef.doc(userId);
      batch.set(newUserDocRef, userData);

      const subcollections = ["products", "movements", "suppliers", "settings"];
      for (const subcollectionName of subcollections) {
        const oldSubcollectionRef = oldUsersRef
          .doc(userId)
          .collection(subcollectionName);
        const newSubcollectionRef = newUsersRef
          .doc(userId)
          .collection(subcollectionName);
        const subcollectionSnapshot = await oldSubcollectionRef.get();
        subcollectionSnapshot.forEach((doc) => {
          console.log(`  -> Migrando ${subcollectionName}/${doc.id}`);
          batch.set(newSubcollectionRef.doc(doc.id), doc.data());
        });
      }
    }

    await batch.commit();
    const successMessage = `Migración completada. ${oldUsersSnapshot.size} documentos de usuario procesados.`;
    console.log(successMessage);
    res.status(200).send(successMessage);
  } catch (error) {
    console.error("Error durante la migración:", error);
    res.status(500).send("La migración falló. Revisa los registros (logs).");
  }
});

// AÑADE ESTA NUEVA FUNCIÓN AL FINAL DE TU ARCHIVO functions/index.js

exports.diagnosePaths = functions.https.onRequest(async (req, res) => {
  try {
    const artifactsRef = db.collection("artifacts");
    const snapshot = await artifactsRef.get();

    if (snapshot.empty) {
      res
        .status(200)
        .send("La colección 'artifacts' está vacía o no se puede encontrar.");
      return;
    }

    const docIds = snapshot.docs.map((doc) => doc.id);

    console.log("Documentos encontrados en 'artifacts':", docIds);
    res.status(200).json({
      message:
        "Estos son los documentos que la función encontró dentro de 'artifacts':",
      documents: docIds,
    });
  } catch (error) {
    console.error("Error en el diagnóstico:", error);
    res.status(500).send("Error en el diagnóstico. Revisa los registros.");
  }
});
