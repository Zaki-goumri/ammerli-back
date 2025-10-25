const transformPhoneNumber = (value: string): string => {
  if (!value) return value;

  const cleaned = value.toString().trim().replace(/\s+/g, '');
  if (cleaned.startsWith('+213')) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('213') && cleaned.length > 10) {
    return '0' + cleaned.slice(3);
  }
  return cleaned;
};
