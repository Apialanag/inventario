import React, { useState } from "react";

const AuthScreen = ({ onLogin, onRegister, error }) => {
  // Estado para alternar entre la vista de Login y la de Registro
  const [isLoginView, setIsLoginView] = useState(true);

  // Estados para los campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Nuevo estado para el código de invitación
  const [invitationCode, setInvitationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    // Si es la vista de registro, también valida el código de invitación
    if (!isLoginView && !invitationCode) {
      alert("Por favor, introduce el código de invitación.");
      return;
    }

    setIsProcessing(true);

    if (isLoginView) {
      await onLogin(email, password);
    } else {
      // Pasamos el código de invitación a la función de registro
      await onRegister(email, password, invitationCode);
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            🐝 Apialan Inventario
          </h1>
          <p className="mt-2 text-gray-600">
            {isLoginView
              ? "Inicia sesión para continuar"
              : "Crea una cuenta para empezar"}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* --- Nuevo Campo: Código de Invitación (solo en la vista de registro) --- */}
          {!isLoginView && (
            <div>
              <label
                htmlFor="invitationCode"
                className="text-sm font-medium text-gray-700"
              >
                Código de Invitación
              </label>
              <input
                id="invitationCode"
                name="invitationCode"
                type="text"
                required
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isProcessing
                ? "Procesando..."
                : isLoginView
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          {isLoginView ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
          <button
            onClick={() => setIsLoginView(!isLoginView)}
            className="ml-1 font-medium text-blue-600 hover:text-blue-500"
          >
            {isLoginView ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
