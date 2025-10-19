export function extractCheckoutIdFromUrl(checkoutUrl: string): string | null {
  try {
    const regex = /\/checkouts\/([a-z0-9]+)\/pay/i;
    const match = checkoutUrl.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}
