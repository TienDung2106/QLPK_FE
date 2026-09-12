import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

/** Cách duy nhất để đọc trạng thái đăng nhập trong component. */
export const useAuth = () => useContext(AuthContext);

export default useAuth;
