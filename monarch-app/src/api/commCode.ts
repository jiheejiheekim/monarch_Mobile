import axios from 'axios';

export interface CommCode {
    codeVal: string;
    codeName: string;
    codeGrp: string;
    mCommCodeNo: number;
    // 필요한 다른 필드 추가 가능
}

const codeCache: Record<string, CommCode[] | undefined> = {};
const pendingRequests: Record<string, Promise<CommCode[]> | undefined> = {};

/**
 * 전역 캐시를 비웁니다. 
 * 페이지 이동 시나 메모리 압박이 있을 때 호출할 수 있습니다.
 */
export const clearCommCodeCache = () => {
    Object.keys(codeCache).forEach(key => delete codeCache[key]);
};

/**
 * 공통 코드를 가져옵니다.
 * - 동일 그룹에 대한 중복 요청 방지 (deduplication)
 * - 전역 캐시를 통한 성능 최적화
 * @param codeGrp 코드 그룹명
 * @returns 코드 목록
 */
export const getCommCodes = async (codeGrp: string): Promise<CommCode[]> => {
    // 1. 캐시 확인
    if (codeCache[codeGrp]) {
        return codeCache[codeGrp];
    }

    // 2. 이미 동일 그룹 요청이 진행 중이면 해당 Promise 재사용
    if (pendingRequests[codeGrp]) {
        return pendingRequests[codeGrp];
    }

    // 3. 새 요청 생성
    const storedUser = sessionStorage.getItem('user');
    let user: any = {};
    try {
        user = storedUser ? JSON.parse(storedUser) : {};
    } catch (e) { /* ignore */ }
    const mUsiteNo = user?.M_USITE_NO || 1;

    const requestPromise = axios.get<CommCode[]>('/api/comm-code', {
        params: { codeGrp, mUsiteNo }
    }).then(response => {
        const data = response.data || [];
        // 너무 큰 데이터는 캐싱하지 않거나 제한할 수 있지만, 
        // 여기서는 일단 캐싱하고 수동으로 비울 수 있는 인터페이스 제공
        codeCache[codeGrp] = data;
        delete pendingRequests[codeGrp];
        return data;
    }).catch(error => {
        delete pendingRequests[codeGrp];
        console.error(`Failed to fetch comm codes for ${codeGrp}:`, error);
        return [];
    });

    pendingRequests[codeGrp] = requestPromise;
    return requestPromise;
};
