import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/ListPage.module.css";
import Pagination from "../Pagination";
import Widget from "../Widget";

interface ContactDataRow {
    [key: string]: string | number | boolean | null | undefined;
}

const ContactWidget: React.FC = () => {
    const [contactData, setContactData] = useState<ContactDataRow[]>([]);
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

    const fetchContactData = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const storedUser = sessionStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const usite = user?.M_USITE_NO || 1;
            const uid = user?.M_USER_NO || null;
            const response = await axios.get('/api/data/execute', {
                params: {
                    serviceName: 'M_CONTACT',
                    methodName: 'MLIST',
                    USITE: usite,
                    UID: uid,
                    _page: page,
                    _sort: 'CONTID DESC',
                    _size: pageSize,
                    ...appliedFilters,
                }
            });
            const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
            setContactData(responseData?.data || []);
            setTotalCount(responseData?.totalCount || 0);
        } catch (err) {
            setError('접촉 정보를 불러오는 데 실패했습니다.');
            console.error('Contact data fetch error:', err);
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
        fetchContactData(currentPage);
    }, [fetchContactData, currentPage]);

    const handlePageChange = (page: number) => { // 이 함수는 Pagination 컴포넌트에서 사용됩니다.
        setCurrentPage(page);
    };

    if (isLoading) return <Widget title="접촉 정보"><div className={styles.loading}>데이터를 불러오는 중입니다...</div></Widget>;
    if (error) return <Widget title="접촉 정보"><div className={styles.error}>{error}</div></Widget>;

    return (
        <Widget title="접촉 정보">
            <div className={styles.filterContainer}>
                <div className={styles.filterRow}>
                    <select className={styles.filterSelect} value={searchColumn} onChange={e => setSearchColumn(e.target.value)} required>
                        <option value="" disabled>검색 항목</option>
                        <option value="CTTUSER_NM">접촉자명</option>
                        <option value="CSTNAME">고객명</option>
                        <option value="COMPANY">회사명</option>
                        <option value="CTTDESC">접촉내용</option>
                        {/* 날짜 검색은 별도의 DatePicker 컴포넌트가 필요할 수 있습니다. */}
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

            {contactData.length > 0 ? (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.userDataTable}>
                            <thead>
                                <tr>
                                    <th className={styles.textCenter}>접촉일자</th>
                                    <th className={styles.textCenter}>접촉자</th>
                                    <th className={styles.textCenter}>고객명</th>
                                    <th className={styles.textCenter}>회사명</th>
                                    <th className={styles.textCenter}>접촉채널</th>
                                    <th className={styles.textCenter}>접촉목표</th>
                                    <th className={styles.textCenter}>접촉결과</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contactData.map((row, index) => (
                                    <tr key={index}>
                                        <td data-label="접촉일자" className={styles.textCenter}>
                                            {row.CTTDATE ? new Date(row.CTTDATE.toString()).toISOString().slice(0, 10) : ''}
                                        </td>
                                        <td data-label="접촉자" className={styles.textCenter}>{row.CTTUSER_NM}</td>
                                        <td data-label="고객명" className={styles.textCenter}>{row.CSTNAME}</td>
                                        <td data-label="회사명" className={styles.textCenter}>{row.COMPANY}</td>
                                        <td data-label="접촉채널" className={styles.textCenter}>{row.CTTCHANNEL_NM}</td>
                                        <td data-label="접촉목표">{row.CONTGOALID_NM}</td>
                                        <td data-label="접촉결과">{row.CTTRESULT_NM}</td>
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
                <div className={styles.noData}>표시할 접촉 정보가 없습니다.</div>
            )}
        </Widget>
    );
};

export default ContactWidget;
