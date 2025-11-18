import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Widget from '../Widget';
import styles from '../../styles/ListPage.module.css';
import Pagination from '../Pagination';

interface UserDataRow {
    [key: string]: string | number | boolean | null | undefined;
}

export const UserWidget: React.FC = () => {
  const [userData, setUserData] = useState<UserDataRow[]>([]);
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

  const fetchUserData = useCallback(async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
          const storedUser = sessionStorage.getItem('user');
          const user = storedUser ? JSON.parse(storedUser) : {};
          const usite = user?.M_USITE_NO || 1;
          const uid = user?.M_USER_NO || null;
          const response = await axios.get('/api/data/execute', {
              params: {
                  serviceName: 'M_USER',
                  methodName: 'MLIST',
                  USITE: usite,
                  UID: uid,
                  _page: page,
                  _sort: 'M_USER_NO DESC',
                  _size: pageSize,
                  ...appliedFilters,
              }
          });
          const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
          setUserData(responseData?.data || []);
          setTotalCount(responseData?.totalCount || 0);
      } catch (err) {
          setError('사용자 정보를 불러오는 데 실패했습니다.');
          console.error('User data fetch error:', err);
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
      fetchUserData(currentPage);
  }, [fetchUserData, currentPage]);

  const handlePageChange = (page: number) => { // 이 함수는 Pagination 컴포넌트에서 사용됩니다.
      setCurrentPage(page);
  };

  if (isLoading) return <Widget title="사용자 정보"><div className={styles.loading}>데이터를 불러오는 중입니다...</div></Widget>;
  if (error) return <Widget title="사용자 정보"><div className={styles.error}>{error}</div></Widget>;

  return (
    <Widget title="사용자 정보">
      <div className={styles.filterContainer}>
        <div className={styles.filterRow}>
            <select className={styles.filterSelect} value={searchColumn} onChange={e => setSearchColumn(e.target.value)} required>
                <option value="" disabled>검색 항목</option>
                <option value="USER_CODE">사용자 ID</option>
                <option value="USER_NAME">사용자명</option>
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

      {userData.length > 0 ? (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.userDataTable}>
              <thead>
                <tr>
                  <th className={styles.textCenter}>사원코드</th>
                  <th className={styles.textCenter}>사원명</th>
                  <th className={styles.textCenter}>부서명</th>
                  <th className={styles.textCenter}>직위</th>
                  <th className={styles.textCenter}>직책</th>
                  <th className={styles.textCenter}>핸드폰</th>
                  <th className={styles.textCenter}>EMAIL</th>
                  <th className={styles.textCenter}>사용</th>
                  <th className={styles.textCenter}>입사일자</th>
                  <th className={styles.textCenter}>퇴직일자</th>
                </tr>
              </thead>
              <tbody>
                {userData.map((row, index) => (
                  <tr key={index}>
                    <td data-label="사원코드" className={styles.textCenter}>{row.USER_CODE}</td>
                    <td data-label="사원명" className={styles.textCenter}>{row.USER_NAME}</td>
                    <td data-label="부서명" className={styles.textCenter}>{row.DEPT_NAME}</td>
                    <td data-label="직위" className={styles.textCenter}>{row.POSITION_CODE}</td>
                    <td data-label="직책" className={styles.textCenter}>{row.DUTY_CODE}</td>
                    <td data-label="핸드폰" className={styles.textCenter}>{row.MOBILE_NO}</td>
                    <td data-label="EMAIL">{row.EMAIL}</td>
                    <td data-label="사용" className={styles.textCenter}>{row.USE_FLAG === '1' ? '사용' : '미사용'}</td>
                    <td data-label="입사일자" className={styles.textCenter}>{row.HIRE_DATE ? new Date(row.HIRE_DATE.toString()).toISOString().slice(0, 10) : ''}</td>
                    <td data-label="퇴직일자" className={styles.textCenter}>{row.RETIREMENT_DATE ? new Date(row.RETIREMENT_DATE.toString()).toISOString().slice(0, 10) : ''}</td>
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
        <div className={styles.noData}>표시할 사용자 정보가 없습니다.</div>
      )}
    </Widget>
  );
};