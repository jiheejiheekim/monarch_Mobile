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
 * 공통 코드를 가져오고 캐싱합니다.
 * @param codeGrp 코드 그룹명
 * @returns 코드 목록
 */
export const getCommCodes = async (codeGrp: string): Promise<CommCode[]> => {
    // 1. 캐시 확인
    if (codeCache[codeGrp] !== undefined) {
        return codeCache[codeGrp]!;
    }

    // 2. 이미 요청 중인 경우 해당 Promise 반환
    if (pendingRequests[codeGrp] !== undefined) {
        return pendingRequests[codeGrp]!;
    }

    // 3. 새 요청 생성
    const storedUser = sessionStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : {};
    const mUsiteNo = user?.M_USITE_NO || 1;

    const requestPromise = axios.get<CommCode[]>('/api/comm-code', {
        params: { codeGrp, mUsiteNo }
    }).then(response => {
        const data = response.data;
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
