import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/ListPage.module.css";
import Pagination from "../Pagination";
import Widget from "../Widget";

interface SalesDataRow {
    [key: string]: string | number | boolean | null | undefined;
}

const SalesWidget: React.FC = () => {
    const [salesData, setSalesData] = useState<SalesDataRow[]>([]);
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

    const fetchSalesData = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const storedUser = sessionStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const usite = user?.M_USITE_NO || 1;
            const uid = user?.M_USER_NO || null;
            const response = await axios.get('/api/data/execute', {
                params: {
                    serviceName: 'M_SALES',
                    methodName: 'MLIST',
                    USITE: usite,
                    UID: uid,
                    _page: page,
                    _sort: 'SALESID DESC',
                    _size: pageSize,
                    ...appliedFilters,
                }
            });
            const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
            setSalesData(responseData?.data || []);
            setTotalCount(responseData?.totalCount || 0);
        } catch (err) {
            setError('영업 정보를 불러오는 데 실패했습니다.');
            console.error('Sales data fetch error:', err);
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
        fetchSalesData(currentPage);
    }, [fetchSalesData, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (isLoading) return <Widget title="영업 정보"><div className={styles.loading}>데이터를 불러오는 중입니다...</div></Widget>;
    if (error) return <Widget title="영업 정보"><div className={styles.error}>{error}</div></Widget>;

    return (
        <Widget title="영업 정보">
            <div className={styles.filterContainer}>
                <div className={styles.filterRow}>
                    <select className={styles.filterSelect} value={searchColumn} onChange={e => setSearchColumn(e.target.value)} required>
                        <option value="" disabled>검색 항목</option>
                        <option value="SALENAME">영업기회명</option>
                        <option value="CLINAME">고객사명</option>
                        <option value="OWNER_NM">담당자</option>
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

            {salesData.length > 0 ? (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.userDataTable}>
                            <thead>
                                <tr>
                                    <th className={styles.textCenter}>영업번호</th>
                                    <th className={styles.textCenter}>영업기회명</th>
                                    <th className={styles.textCenter}>고객사명</th>
                                    <th className={styles.textCenter}>담당자</th>
                                    <th className={styles.textCenter}>예상수주일</th>
                                    <th className={styles.textRight}>예상수주금액</th>
                                    <th className={styles.textCenter}>진행상태</th>
                                </tr> 
                            </thead>
                            <tbody>
                                {salesData.map((row, index) => (
                                    <tr key={index}>
                                        <td data-label="영업번호" className={styles.textCenter}>{row.SALESID}</td>
                                        <td data-label="영업기회명">{row.SALENAME}</td>
                                        <td data-label="고객사명" className={styles.textCenter}>{row.CLINAME}</td>
                                        <td data-label="담당자" className={styles.textCenter}>{row.OWNER_NM}</td>
                                        <td data-label="예상수주일" className={styles.textCenter}>{row.FORDDATE ? new Date(row.FORDDATE.toString()).toISOString().slice(0, 10) : ''}</td>
                                        <td data-label="예상수주금액" className={styles.textRight}>{Number(row.FORDAMOUNT).toLocaleString()}</td>
                                        <td data-label="진행상태" className={styles.textCenter}>{row.SALESSTATE_NM}</td>
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
                <div className={styles.noData}>표시할 매출 정보가 없습니다.</div>
            )}
        </Widget>
    );
};

export default SalesWidget;
