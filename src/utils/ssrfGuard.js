/**
 * SSRF Guard - Módulo de Protección contra Server-Side Request Forgery
 * 
 * Previene que peticiones originadas por el servidor accedan a:
 * - Direcciones IP de Loopback (127.0.0.1, ::1, etc.)
 * - Redes privadas RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Direcciones Link-Local y de Metadatos de Nube (169.254.0.0/16, AWS, Azure, GCP, DigitalOcean)
 * - Carrier-Grade NAT (100.64.0.0/10)
 * - Direcciones reservadas / broadcast (0.0.0.0/8, 240.0.0.0/4, etc.)
 * - Protocolos no seguros (file://, gopher://, ftp://, dict://, etc.)
 */

const dns = require("dns");
const { promisify } = require("util");
const lookupAsync = promisify(dns.lookup);

/**
 * Determina si una dirección IP pertenece a un rango privado, loopback o reservado.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIP(ip) {
  if (!ip || typeof ip !== "string") return true;

  const cleanIp = ip.trim().toLowerCase();

  // IPv6 checks
  if (
    cleanIp === "::1" ||
    cleanIp === "::" ||
    cleanIp.startsWith("fc") ||
    cleanIp.startsWith("fd") ||
    cleanIp.startsWith("fe80") ||
    cleanIp.startsWith("ff") || // multicast
    cleanIp === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  // IPv4-mapped IPv6 check (e.g. ::ffff:127.0.0.1)
  if (cleanIp.startsWith("::ffff:")) {
    const ipv4Part = cleanIp.substring(7);
    return isPrivateIP(ipv4Part);
  }

  // IPv4 checks
  const parts = cleanIp.split(".").map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) {
    return true; // Si no es un formato IPv4 válido, bloquear por seguridad
  }

  const [p0, p1] = parts;

  // 0.0.0.0/8 (red actual)
  if (p0 === 0) return true;

  // 127.0.0.0/8 (loopback)
  if (p0 === 127) return true;

  // 10.0.0.0/8 (privada Clase A)
  if (p0 === 10) return true;

  // 100.64.0.0/10 (Carrier Grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  // 169.254.0.0/16 (link-local y Cloud Metadata APIs)
  if (p0 === 169 && p1 === 254) return true;

  // 172.16.0.0/12 (privada Clase B)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.0.0.0/24 & 192.0.2.0/24 (TEST-NET-1)
  if (p0 === 192 && p1 === 0) return true;

  // 192.168.0.0/16 (privada Clase C)
  if (p0 === 192 && p1 === 168) return true;

  // 198.18.0.0/15 (pruebas de benchmark)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (p0 === 198 && p1 === 51) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (p0 === 203 && p1 === 0) return true;

  // 224.0.0.0/4 (multicast) y 240.0.0.0/4 (reservado)
  if (p0 >= 224) return true;

  return false;
}

/**
 * Valida de forma rigurosa una URL externa comprobando protocolo, sintaxis y resolución DNS.
 * @param {string} rawUrl
 * @returns {Promise<{ valid: boolean, parsedUrl: URL, resolvedIp: string }>}
 */
async function validateSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("La URL proporcionada es requerida y debe ser una cadena de texto.");
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    throw new Error("La URL excede la longitud máxima permitida de 2048 caracteres.");
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Formato de URL inválido.");
  }

  // 1. Restringir protocolos a HTTP y HTTPS únicamente
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Protocolo no permitido: '${parsed.protocol}'. Solo se permiten peticiones HTTP y HTTPS.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Bloquear nombres de host internos conocidos
  const blockedHostnames = [
    "localhost",
    "ip6-localhost",
    "ip6-loopback",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
    "169.254.169.254"
  ];

  if (
    blockedHostnames.includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error(`Acceso denegado al host restringido: '${hostname}' (Protección SSRF).`);
  }

  // 3. Si el hostname es una IP directa, verificar inmediatamente
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":")) {
    if (isPrivateIP(hostname)) {
      throw new Error(`Acceso denegado a dirección IP privada o restringida: '${hostname}' (Protección SSRF).`);
    }
  }

  // 4. Resolución DNS para verificar que el dominio no apunte a un recurso interno (DNS Rebinding / Intranet)
  let resolvedAddress;
  try {
    const lookup = await lookupAsync(hostname, { all: false });
    resolvedAddress = lookup.address;
  } catch (dnsErr) {
    throw new Error(`Error en la resolución DNS para el host '${hostname}': ${dnsErr.message}`);
  }

  if (isPrivateIP(resolvedAddress)) {
    throw new Error(`El host '${hostname}' resuelve a una dirección IP interna/privada restringida '${resolvedAddress}' (Protección SSRF).`);
  }

  return {
    valid: true,
    parsedUrl: parsed,
    resolvedIp: resolvedAddress,
    cleanUrl: parsed.toString()
  };
}

module.exports = {
  isPrivateIP,
  validateSafeUrl
};
