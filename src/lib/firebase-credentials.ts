// Parse environment serialization without ever logging credential contents.
export function parseServiceAccount(raw: string) {
  let value: unknown = JSON.parse(raw.trim());
  if (typeof value === 'string') value = JSON.parse(value);
  if (!value || typeof value !== 'object') throw new Error('invalid_service_account');
  const data = value as Record<string, unknown>;
  const projectId = data.project_id || data.projectId;
  const clientEmail = data.client_email || data.clientEmail;
  const key = data.private_key || data.privateKey;
  if (typeof projectId !== 'string' || typeof clientEmail !== 'string' || typeof key !== 'string') throw new Error('incomplete_service_account');
  return { projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') };
}
