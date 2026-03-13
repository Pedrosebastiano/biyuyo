import { useState, useCallback } from "react";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";

const API_URL = getApiUrl();

/**
 * Utilidad para convertir base64url a Uint8Array (Buffer)
 */
function base64urlToUint8Array(base64url: string) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Utilidad para convertir Buffer a base64url
 */
function bufferToBase64url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function useWebAuthn() {
  const [loading, setLoading] = useState(false);

  /**
   * Paso A: Verificar disponibilidad
   */
  const checkAvailability = useCallback(async () => {
    if (!window.PublicKeyCredential) return false;
    
    // Verifica si el dispositivo soporta biometría de plataforma (TouchID, FaceID, Windows Hello)
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }, []);

  /**
   * Registro: Generar llave pública y guardarla en el servidor
   */
  const registerBiometrics = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // 1. Obtener desafío del servidor
      const resChallenge = await fetch(`${API_URL}/api/auth/webauthn/register-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!resChallenge.ok) throw new Error("Error al obtener desafío de registro");
      const options = await resChallenge.json();

      // Preparar opciones para navigator.credentials.create
      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          ...options,
          challenge: base64urlToUint8Array(options.challenge),
          user: {
            ...options.user,
            id: base64urlToUint8Array(options.user.id),
          },
          pubKeyCredParams: options.pubKeyCredParams,
        },
      };

      // 2. Llamar a la API del navegador (Lanza el prompt biométrico)
      const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential;

      if (!credential) throw new Error("No se pudo crear la credencial");

      // 3. Enviar respuesta al servidor para verificar y guardar
      const response = credential.response as AuthenticatorAttestationResponse;
      
      const resVerify = await fetch(`${API_URL}/api/auth/webauthn/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          credential: {
            id: credential.id,
            rawId: bufferToBase64url(credential.rawId),
            type: credential.type,
            response: {
              attestationObject: bufferToBase64url(response.attestationObject),
              clientDataJSON: bufferToBase64url(response.clientDataJSON),
              // En una implementación real enviaríamos más datos, aquí simplificamos
              publicKey: response.getPublicKey ? bufferToBase64url(response.getPublicKey()) : "",
            },
            authenticatorAttachment: credential.authenticatorAttachment,
          },
        }),
      });

      if (!resVerify.ok) throw new Error("Error al verificar registro biométrico");

      toast.success("¡Biometría registrada con éxito!");
      return true;
    } catch (err) {
      console.error("WebAuthn Register Error:", err);
      toast.error(err instanceof Error ? err.message : "Error al registrar biometría");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Autenticación (Login / Autofill): Verificar firma
   */
  const loginBiometrics = useCallback(async (isConditional: boolean = false) => {
    try {
      setLoading(true);

      // 1. Obtener desafío del servidor
      const resChallenge = await fetch(`${API_URL}/api/auth/webauthn/login-challenge`);
      if (!resChallenge.ok) throw new Error("Error al obtener desafío de login");
      const options = await resChallenge.json();

      // Preparar opciones para navigator.credentials.get
      const requestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: base64urlToUint8Array(options.challenge),
          rpId: options.rpId,
          userVerification: options.userVerification,
          timeout: options.timeout,
        },
        // Habilitar Conditional UI si se solicita
        mediation: isConditional ? "conditional" : "optional",
      } as any;

      // 2. Llamar a la API del navegador
      const assertion = (await navigator.credentials.get(requestOptions)) as PublicKeyCredential;

      if (!assertion) throw new Error("No se recibió respuesta biométrica");

      // 3. Enviar al servidor para validar firma
      const response = assertion.response as AuthenticatorAssertionResponse;
      const resVerify = await fetch(`${API_URL}/api/auth/webauthn/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: {
            id: assertion.id,
            rawId: bufferToBase64url(assertion.rawId),
            type: assertion.type,
            response: {
              authenticatorData: bufferToBase64url(response.authenticatorData),
              clientDataJSON: bufferToBase64url(response.clientDataJSON),
              signature: bufferToBase64url(response.signature),
              userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
            },
          },
        }),
      });

      if (!resVerify.ok) throw new Error("Firma biométrica inválida");

      const result = await resVerify.json();
      return result.user; // Devolvemos los datos del usuario logueado
    } catch (err) {
      // Si es Conditional UI y se cancela, no mostramos error invasivo
      if (isConditional && (err as Error).name === "NotAllowedError") return null;
      
      console.error("WebAuthn Login Error:", err);
      if (!isConditional) toast.error("Error al iniciar sesión con biometría");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar si el usuario ya tiene biometría registrada
   */
  const checkBiometricStatus = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/webauthn/status/${userId}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.enabled as boolean;
    } catch (err) {
      console.error("Error al verificar estado biométrico:", err);
      return false;
    }
  }, []);

  /**
   * Desactivar (eliminar) biometría
   */
  const removeBiometrics = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/webauthn/remove/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al desactivar biometría");
      toast.success("Biometría desactivada");
      return true;
    } catch (err) {
      console.error("Error al remover biometría:", err);
      toast.error("Error al desactivar biometría");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    checkAvailability,
    registerBiometrics,
    loginBiometrics,
    checkBiometricStatus,
    removeBiometrics,
  };
}
