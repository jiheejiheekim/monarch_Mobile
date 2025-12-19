import axios from 'axios';

/**
 * 사용자 정보 타입을 정의합니다.
 * 필요한 속성만 포함하여 간결하게 정의할 수 있습니다.
 */
interface User {
    M_USITE_NO?: number | string;
    M_USER_NO?: number | string;
    USER_NAME?: string;
    USER_CODE?: string;
}

// 새로운 axios 인스턴스를 생성합니다.
const axiosInstance = axios.create({
    // baseURL, timeout 등 공통 설정을 추가할 수 있습니다.
    // baseURL: '/api',
});

// 요청 인터셉터를 추가합니다.
axiosInstance.interceptors.request.use(config => {
    // '/api/data/execute' 경로의 요청에만 공통 파라미터를 추가합니다.
    if (config.url === '/api/data/execute') {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const user: User = JSON.parse(storedUser);
            // 기존 params에 공통 파라미터를 추가합니다.
            config.params = {
                ...config.params,
                USITE: user.M_USITE_NO,
                UID: user.M_USER_NO,
                UNM: user.USER_NAME,
                UCD: user.USER_CODE,
            };
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default axiosInstance;