import { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { apiGetMe, apiLogout } from '../api/functions/auth';
import type { AuthTokens, AuthenticatedAccount } from '../api/session';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredAccount,
  onSessionExpired,
  saveAccount,
  saveSession,
} from '../api/session';

interface AuthState {
  /** false cho tới khi đã hỏi xong backend "tôi là ai" — dùng để chặn nháy trang. */
  isInitialised: boolean;
  isAuthenticated: boolean;
  account: AuthenticatedAccount | null;
}

type AuthAction =
  | { type: 'INIT'; isAuthenticated: boolean; account: AuthenticatedAccount | null }
  | { type: 'LOGIN'; account: AuthenticatedAccount }
  | { type: 'ACCOUNT'; account: AuthenticatedAccount }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  isInitialised: false,
  isAuthenticated: false,
  account: null,
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT':
      return {
        isInitialised: true,
        isAuthenticated: action.isAuthenticated,
        account: action.account,
      };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, account: action.account };
    case 'ACCOUNT':
      return { ...state, account: action.account };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, account: null };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  /** Quyền hiệu lực của vai trò, do backend trả về — dùng để ẩn thao tác sẽ bị từ chối. */
  hasPermission: (permissionCode: string) => boolean;
  /**
   * Nhận một phiên mà trang gọi đã lấy được: đăng nhập, hoặc xác thực đăng ký (backend trả
   * luôn cặp token ở bước đó). Trang tự gọi API để còn kiểm tra vai trò trước khi lưu.
   *
   * @param remember true thì phiên sống qua lần đóng trình duyệt (ô "Ghi nhớ").
   */
  adoptSession: (tokens: AuthTokens, remember?: boolean) => void;
  logout: () => Promise<void>;
  /** Đọc lại /api/auth/me, ví dụ sau khi đổi mật khẩu xong. */
  reloadAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  ...initialState,
  hasPermission: () => false,
  adoptSession: () => undefined,
  logout: () => Promise.resolve(),
  reloadAccount: () => Promise.resolve(),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const adoptSession = useCallback((tokens: AuthTokens, remember = false) => {
    saveSession(tokens, remember);
    dispatch({ type: 'LOGIN', account: tokens.account });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    // Gọi trước khi xoá, để request còn mang được token mà nó cần thu hồi. dcv2 làm ngược
    // thứ tự này và lời gọi logout ở đó đi ra mà không có gì để thu hồi.
    if (refreshToken) {
      await apiLogout(refreshToken);
    }

    clearSession();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const reloadAccount = useCallback(async () => {
    const result = await apiGetMe();

    if (result.ok && result.data) {
      saveAccount(result.data);
      dispatch({ type: 'ACCOUNT', account: result.data });
    }
  }, []);

  useEffect(() => {
    // Interceptor của axios đã thử refresh trước khi tới đây; tới đây nghĩa là refresh
    // token cũng hỏng, nên chỉ còn cách đưa người dùng về trạng thái chưa đăng nhập.
    onSessionExpired(() => dispatch({ type: 'LOGOUT' }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getAccessToken()) {
        dispatch({ type: 'INIT', isAuthenticated: false, account: null });
        return;
      }

      // Hỏi lại backend thay vì tin bản sao trong localStorage: vai trò và quyền có thể đã
      // đổi, và /me cũng là phép thử xem token còn sống không. Nếu hết hạn thì interceptor
      // tự refresh trong lúc gọi, nên một lần đọc này đủ cho cả hai việc.
      const result = await apiGetMe();

      if (cancelled) {
        return;
      }

      if (result.ok && result.data) {
        saveAccount(result.data);
        dispatch({ type: 'INIT', isAuthenticated: true, account: result.data });
        return;
      }

      // Mất mạng thì token vẫn có thể còn tốt — giữ lại và dùng bản sao đã lưu, để một lần
      // rớt sóng không làm người dùng bị đăng xuất.
      if (result.status === undefined) {
        dispatch({ type: 'INIT', isAuthenticated: true, account: getStoredAccount() });
        return;
      }

      clearSession();
      dispatch({ type: 'INIT', isAuthenticated: false, account: null });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      hasPermission: (permissionCode: string) =>
        state.account?.permissions?.includes(permissionCode) ?? false,
      adoptSession,
      logout,
      reloadAccount,
    }),
    [state, adoptSession, logout, reloadAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
