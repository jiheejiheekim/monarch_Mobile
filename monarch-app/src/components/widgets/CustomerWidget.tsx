import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/ListPage.module.css";
import Pagination from "../Pagination";
import Widget from "../Widget";

interface CustomerDataRow {
    [key: string]: string | number | boolean | null | undefined;
}

const CustomerWidget: React.FC = () => {
    const [customerData, setCustomerData] = useState<CustomerDataRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [searchColumn, setSearchColumn] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [appliedFilters, setAppliedFilters] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
            setPageSize(e.matches ? 5 : 10);
            setCurrentPage(1);
        };
        mediaQuery.addEventListener('change', handleResize);
        handleResize(mediaQuery);
        return () => mediaQuery.removeEventListener('change', handleResize);
    }, []);

    const fetchCustomerData = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const storedUser = sessionStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const usite = user?.M_USITE_NO || 1;
            const uid = user?.M_USER_NO || null;
            const response = await axios.get('/api/data/execute', {
                params: {
                    serviceName: 'M_CUST',
                    methodName: 'MLIST',
                    USITE: usite,
                    UID: uid,
                    _page: page,
                    _sort: 'CSTID DESC',
                    _size: pageSize,
                    ...appliedFilters,
                }
            });
            const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
            setCustomerData(responseData?.data || []);
            setTotalCount(responseData?.totalCount || 0);
        } catch (err) {
            setError('고객 정보를 불러오는 데 실패했습니다.');
            console.error('Customer data fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [appliedFilters, pageSize]);

    const handleSearch = () => {
        if (searchKeyword && !searchColumn) {
            alert('검색 항목을 선택해주세요.');
            return;
        }
        setCurrentPage(1);
        const newFilters: { [key: string]: string } = {};
        if (searchKeyword.trim() !== '' && searchColumn) {
            newFilters[searchColumn] = searchKeyword;
        }
        setAppliedFilters(newFilters);
    };

    useEffect(() => {
        fetchCustomerData(currentPage);
    }, [fetchCustomerData, currentPage]);

    const handlePageChange = (page: number) => { // 이 함수는 Pagination 컴포넌트에서 사용됩니다.
        setCurrentPage(page);
    };

    if (isLoading) return <Widget title="고객 정보"><div className={styles.loading}>데이터를 불러오는 중입니다...</div></Widget>;
    if (error) return <Widget title="고객 정보"><div className={styles.error}>{error}</div></Widget>;

    return (
        <Widget title="고객 정보">
            <div className={styles.filterContainer}>
                <div className={styles.filterRow}>
                    <select className={styles.filterSelect} value={searchColumn} onChange={e => setSearchColumn(e.target.value)} required>
                        <option value="" disabled>검색 항목</option>
                        <option value="CSTNAME">고객명</option>
                        <option value="COMPANY">회사명</option>
                        <option value="PHONE">휴대폰번호</option>
                    </select>
                    <input
                        type="text"
                        className={styles.filterInput}
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                        placeholder="검색어를 입력하세요..."
                    />
                    <button className={styles.searchButton} onClick={handleSearch}>
                        조회
                    </button>
                </div>
            </div>

            {customerData.length > 0 ? (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.userDataTable}>
                            <thead>
                                <tr>
                                    <th className={styles.textCenter}>고객명</th>
                                    <th className={styles.textCenter}>회사명</th>
                                    <th className={styles.textCenter}>직책</th>
                                    <th className={styles.textCenter}>휴대폰번호</th>
                                    <th className={styles.textCenter}>담당자</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerData.map((row, index) => (
                                    <tr key={index}>
                                        <td data-label="고객명">{row.CSTNAME}</td>
                                        <td data-label="회사명">{row.COMPANY}</td>
                                        <td data-label="직책">{row.JOBTITLE}</td>
                                        <td data-label="휴대폰번호">{row.PHONE}</td>
                                        <td data-label="담당자">{row.OWNER_NM}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.paginationWrapper}>
                        <span className={styles.totalCount}>총 {totalCount}건</span>
                        <Pagination
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            ) : (
                <div className={styles.noData}>표시할 고객 정보가 없습니다.</div>
            )}
        </Widget>
    );
};

export default CustomerWidget;
