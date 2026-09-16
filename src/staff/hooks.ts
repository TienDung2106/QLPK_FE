import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResult } from '../api/helpers';

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status?: number;
  reload: () => void;
  setData: (updater: T | null | ((current: T | null) => T | null)) => void;
}

interface Snapshot<T> {
  /** Khoá của lượt gọi đã về đích — so với khoá hiện tại để biết còn đang tải hay không. */
  key: string | null;
  data: T | null;
  error: string | null;
  status?: number;
}

/**
 * Gọi một hàm API mỗi khi `deps` đổi. Kết quả về muộn của lượt cũ bị bỏ, để gõ tìm kiếm
 * nhanh không làm bảng nhảy lùi về kết quả của chữ trước.
 *
 * `loading` suy ra từ việc lượt gọi ứng với deps hiện tại đã về chưa, nên không phải bật tắt
 * cờ trong effect. `deps` chỉ nên chứa giá trị nguyên thuỷ.
 */
export function useApiQuery<T>(
  loader: () => Promise<ApiResult<T>>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
): QueryState<T> {
  const enabled = options.enabled ?? true;
  const [nonce, setNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ key: null, data: null, error: null });
  const loaderRef = useRef(loader);
  const key = JSON.stringify([...deps, nonce]);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let alive = true;

    loaderRef.current().then((result) => {
      if (!alive) {
        return;
      }
      setSnapshot((previous) => ({
        key,
        status: result.status,
        // Lỗi thì giữ dữ liệu cũ trên màn hình, chỉ báo lỗi.
        data: result.ok ? result.data : previous.data,
        error: result.ok ? null : result.error,
      }));
    });

    return () => {
      alive = false;
    };
  }, [key, enabled]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const setData = useCallback((updater: T | null | ((current: T | null) => T | null)) => {
    setSnapshot((previous) => ({
      ...previous,
      data: typeof updater === 'function' ? (updater as (current: T | null) => T | null)(previous.data) : updater,
    }));
  }, []);

  return {
    data: snapshot.data,
    loading: enabled && snapshot.key !== key,
    error: snapshot.error,
    status: snapshot.status,
    reload,
    setData,
  };
}

/** Giá trị trễ, cho ô tìm kiếm. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Chạy một thao tác ghi, giữ cờ đang chạy để khoá nút và tránh bấm hai lần.
 * Trả về kết quả để nơi gọi tự quyết hiện toast hay đóng form.
 */
export function useAction() {
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(async <T,>(key: string, action: () => Promise<ApiResult<T>>) => {
    setPending(key);
    try {
      return await action();
    } finally {
      setPending(null);
    }
  }, []);

  return { pending, run, isPending: (key: string) => pending === key };
}
