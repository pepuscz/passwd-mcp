/**
 * Parsed injection spec from --inject VAR=SECRET_ID:FIELD.
 */
export interface InjectionSpec {
  varName: string;
  secretId: string;
  field: string;
}

/**
 * Parse a single --inject spec string into its components.
 * Format: VAR=SECRET_ID:FIELD
 */
export function parseInjection(spec: string): InjectionSpec {
  const eqIdx = spec.indexOf("=");
  if (eqIdx === -1) {
    throw new Error(`Invalid --inject format: '${spec}'. Expected VAR=SECRET_ID:FIELD`);
  }
  const varName = spec.slice(0, eqIdx);
  const rest = spec.slice(eqIdx + 1);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) {
    throw new Error(`Invalid --inject format: '${spec}'. Expected VAR=SECRET_ID:FIELD`);
  }
  const secretId = rest.slice(0, colonIdx);
  const field = rest.slice(colonIdx + 1);
  return { varName, secretId, field };
}
