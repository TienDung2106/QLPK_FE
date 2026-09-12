/**
 * Bọc Web Storage: tự JSON hoá khi ghi, tự parse khi đọc, và nuốt lỗi thay vì ném ra.
 *
 * Nuốt lỗi là có chủ đích. Trình duyệt ở chế độ ẩn danh, hoặc cấu hình chặn site data,
 * ném ngay ở lần truy cập đầu tiên — nếu để lỗi đó nổi lên thì cả ứng dụng trắng trang
 * chỉ vì không đọc được một token. Không đọc được thì coi như chưa đăng nhập.
 *
 * Kho được lấy qua hàm chứ không giữ sẵn tham chiếu: chính việc chạm vào
 * `window.sessionStorage` đã có thể ném, nên phải nằm trong try/catch.
 */
export class WebStorageService {
  private readonly getStore: () => Storage;

  constructor(getStore: () => Storage) {
    this.getStore = getStore;
  }

  setItem(key: string, value: unknown): void {
    try {
      this.getStore().setItem(key, JSON.stringify(value));
    } catch {
      /* hết chỗ, hoặc trình duyệt chặn site data */
    }
  }

  getItem<T = unknown>(key: string): T | null {
    try {
      const raw = this.getStore().getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      this.getStore().removeItem(key);
    } catch {
      /* như trên */
    }
  }
}

/** Còn lại sau khi đóng trình duyệt — dùng khi người dùng tick "Ghi nhớ". */
export const localStorageService = new WebStorageService(() => window.localStorage);

/** Mất khi đóng tab — dùng khi người dùng **không** tick "Ghi nhớ". */
export const sessionStorageService = new WebStorageService(() => window.sessionStorage);

export default localStorageService;
