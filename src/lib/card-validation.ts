export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  return "unknown";
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(raw: string): { valid: boolean; brand: CardBrand } {
  const digits = raw.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const lengthOk = brand === "amex" ? digits.length === 15 : digits.length >= 13 && digits.length <= 19;
  return { valid: lengthOk && luhnValid(digits), brand };
}

export function validateExpiry(month: string, year: string): boolean {
  const m = parseInt(month, 10);
  const y = parseInt(year.length === 2 ? `20${year}` : year, 10);
  if (!m || !y || m < 1 || m > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (y < currentYear) return false;
  if (y === currentYear && m < currentMonth) return false;
  return true;
}

export function validateCvv(cvv: string, brand: CardBrand): boolean {
  const digits = cvv.replace(/\D/g, "");
  return brand === "amex" ? digits.length === 4 : digits.length === 3;
}

export function last4(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.slice(-4);
}
