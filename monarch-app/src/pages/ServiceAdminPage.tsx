import React, { useState } from 'react';
import axios from 'axios';
import styles from './LoginPage.module.css'; // 간단한 스타일 재사용
import Widget from '@/components/Widget.tsx';

/**
 * API 응답 데이터의 타입을 정의합니다.
 * 백엔드에서 SNAKE_CASE로 넘어오는 필드를 그대로 따릅니다.
 */
interface ServiceAdminResponse {
    QUERY_STMT: string;
}

/**
 * Service 정보 관리 페이지 컴포넌트입니다.
 */
const ServiceAdminPage: React.FC = () => {
    const [serviceName, setServiceName] = useState('M_SALES');
    const [methodName, setMethodName] = useState('MLIST');
    const [queryStmt, setQueryStmt] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchService = async () => {
        if (!serviceName.trim() || !methodName.trim()) {
            alert('서비스명과 메소드명을 모두 입력하세요.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setQueryStmt('');

        try {
            const storedUser = sessionStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const usiteNo = user?.M_USITE_NO || 1;

            const response = await axios.get('/api/data/execute', {
                params: {
                    serviceName: 'M_SERVICE_ADMIN', // 관리자용 특별 서비스 이름
                    searchServiceName: serviceName,
                    searchMethodName: methodName,
                    usiteNo: usiteNo,
                }
            });

            const result: ServiceAdminResponse | null = response.data && response.data.length > 0 ? response.data[0] : null;

            if (result && result.QUERY_STMT) {
                setQueryStmt(result.QUERY_STMT);
            } else {
                setError('해당 서비스/메소드를 찾을 수 없거나, QUERY_STMT 내용이 비어있습니다.');
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <Widget title="Admin - Service 정보">
                <div className={styles.inputGroup}>
                    <label htmlFor="serviceName">서비스명</label>
                    <input id="serviceName" type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="예: M_SALES" />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="methodName">메소드명</label>
                    <input id="methodName" type="text" value={methodName} onChange={(e) => setMethodName(e.target.value)} placeholder="예: MLIST" />
                </div>
                <button className={styles.submitButton} onClick={handleFetchService} disabled={isLoading}>
                    {isLoading ? '조회 중...' : 'QUERY_STMT 내용 조회'}
                </button>

                {error && <p className={styles.error}>{error}</p>}

                {queryStmt && (
                    <pre style={{ backgroundColor: '#f4f4f4', color: '#333', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '1.5rem' }}>
                        <code>{queryStmt}</code>
                    </pre>
                )}
            </Widget>
        </div>
    );
};

export default ServiceAdminPage;