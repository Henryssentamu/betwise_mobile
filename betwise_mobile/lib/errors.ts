export function isNetworkError(err: any): boolean {
  return !err?.response && (err?.code === "ERR_NETWORK" || err?.message === "Network Error");
}

export function friendlyErrorMessage(err: any, fallback: string): string {
  if (isNetworkError(err)) {
    return "You're offline. Check your connection and try again.";
  }
  return err?.response?.data?.detail || fallback;
}
