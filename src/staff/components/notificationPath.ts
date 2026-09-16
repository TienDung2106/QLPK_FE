/** action_url của backend có thể là đường dẫn tuyệt đối hoặc tương đối; chỉ đi theo đường nội bộ. */
export function internalPath(actionUrl: string | null): string | null {
  if (!actionUrl) {
    return null;
  }
  try {
    const parsed = new URL(actionUrl, window.location.origin);
    return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}` : null;
  } catch {
    return null;
  }
}
