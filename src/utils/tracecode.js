import { getAppBaseUrl } from "@utils/appUrl";

const encodeTraceToken = (payload = {}) => {
  const tokenPayload = {
    id: payload?.id,
    timestamp: Date.now(),
    contenedor: payload?.contenedor || ""
  };

  try {
    return btoa(JSON.stringify(tokenPayload));
  } catch (error) {
    console.error("No fue posible generar el token de tracecode:", error);
    return "";
  }
};

const decodeTraceToken = (token) => {
  try {
    return JSON.parse(atob(token));
  } catch (error) {
    console.error("No fue posible decodificar el token de tracecode:", error);
    return null;
  }
};

const buildTracecodeUrl = (payload) => {
  const token = typeof payload === "string" ? payload : encodeTraceToken(payload);
  const baseUrl = getAppBaseUrl();

  return `${baseUrl}/tracecode?token=${token}`;
};

export { buildTracecodeUrl, decodeTraceToken, encodeTraceToken };
