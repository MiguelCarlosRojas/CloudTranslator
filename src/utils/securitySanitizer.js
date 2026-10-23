/**
 * securitySanitizer.js
 * Funciones de sanitización de identificadores, cabeceras HTTP y confinamiento de rutas (Path Traversal Guard).
 */
const path = require("path");

/**
 * Valida y sanitiza identificadores de recursos en memoria / disco
 * Bloquea directory traversal (..), caracteres de inyección o IDs malformados.
 * @param {*} id
 * @returns {string|null}
 */
function sanitizeId(id) {
  if (!id || typeof id !== "string") return null;
  const trimmed = id.trim();
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed) || trimmed.length > 128) {
    return null;
  }
  return trimmed;
}

/**
 * Sanitiza nombres de archivos para cabeceras HTTP Content-Disposition.
 * Previene ataques de HTTP Response Splitting / CRLF Injection.
 * @param {string} raw
 * @param {string} fallback
 * @returns {string}
 */
function sanitizeFilenameHeader(raw, fallback = "archivo_descarga") {
  if (!raw || typeof raw !== "string") return fallback;
  const clean = raw
    .replace(/[\r\n\t"]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .trim();
  return clean.slice(0, 100) || fallback;
}

/**
 * Verifica rigurosamente que una ruta de archivo resida dentro del directorio base permitido.
 * Bloquea cualquier escape por Path Traversal (ej: ../../../etc/passwd o ../../windows).
 * @param {string} targetPath
 * @param {string} allowedBaseDir
 * @returns {boolean}
 */
function isPathContained(targetPath, allowedBaseDir) {
  if (!targetPath || !allowedBaseDir) return false;
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(allowedBaseDir);
  return resolvedTarget.startsWith(resolvedBase);
}

module.exports = {
  sanitizeId,
  sanitizeFilenameHeader,
  isPathContained
};
