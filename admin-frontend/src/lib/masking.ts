import { type Role, SENSITIVE_DATA_ROLES } from '@/types/auth';

/**
 * Che giấu email: "user@example.com" → "us***@example.com"
 * Các role trong SENSITIVE_DATA_ROLES sẽ thấy email đầy đủ.
 */
export function maskEmail(email: string, viewerRole: Role): string {
  if (SENSITIVE_DATA_ROLES.includes(viewerRole)) return email;

  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return `***@${domain}`;

  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

/**
 * Che giấu số điện thoại: "0912345678" → "091***678"
 */
export function maskPhone(phone: string, viewerRole: Role): string {
  if (SENSITIVE_DATA_ROLES.includes(viewerRole)) return phone;
  if (phone.length < 6) return '***';

  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

/**
 * Che giấu số tài khoản ngân hàng: "1234567890123" → "1234 **** **** 0123"
 */
export function maskBankAccount(account: string, viewerRole: Role): string {
  if (SENSITIVE_DATA_ROLES.includes(viewerRole)) return account;
  if (account.length < 8) return '****';

  const start = account.slice(0, 4);
  const end = account.slice(-4);
  return `${start} **** **** ${end}`;
}

/**
 * Kiểm tra xem role có quyền xem dữ liệu nhạy cảm không.
 */
export function canViewSensitiveData(role: Role): boolean {
  return SENSITIVE_DATA_ROLES.includes(role);
}
