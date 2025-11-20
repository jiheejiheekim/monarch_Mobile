import React, { useState, useEffect } from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
    currentPage: number;
    totalCount: number; // 전체 아이템 개수
    pageSize: number;
    onPageChange: (page: number) => void;
}

interface NavButtonProps {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    ariaLabel: string;
}
/**
 * 페이지 이동 버튼 컴포넌트.
 * @param props 버튼 클릭 시 실행할 함수, 비활성화 여부, 버튼 내용, 접근성 라벨
 */
const NavButton: React.FC<NavButtonProps> = ({ onClick, disabled, children, ariaLabel }) => (
    <li className={`${styles.pageItem} ${disabled ? styles.disabled : ''}`}>
        <button className={styles.pageLink} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
            {children}
        </button>
    </li>
);

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalCount, pageSize, onPageChange }) => {
    const [pageBlockSize, setPageBlockSize] = useState(10);
    const totalPages = Math.ceil(totalCount / pageSize);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
            setPageBlockSize(e.matches ? 5 : 10); // 모바일에서는 5개, 데스크톱에서는 10개씩 페이지 번호 표시
        };

        mediaQuery.addEventListener('change', handleResize);
        handleResize(mediaQuery);

        return () => mediaQuery.removeEventListener('change', handleResize);
    }, []);
    const currentBlock = Math.ceil(currentPage / pageBlockSize);
    // 현재 페이지 블록의 시작 페이지 번호
    const startPage = (currentBlock - 1) * pageBlockSize + 1;
    // 현재 페이지 블록의 마지막 페이지 번호
    const endPage = Math.min(startPage + pageBlockSize - 1, totalPages);

    if (totalPages <= 1) { // 페이지가 1개 이하면 페이지네이션 UI를 렌더링하지 않음
        return null;
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav className={styles.paginationContainer}>
            <ul className={styles.pagination}>
                <NavButton onClick={() => onPageChange(1)} disabled={currentPage === 1} ariaLabel="First Page">&laquo;</NavButton>
                <NavButton onClick={() => onPageChange(startPage - 1)} disabled={currentBlock === 1} ariaLabel="Previous Page Block">&lt;</NavButton>

                {pageNumbers.map(number => (
                    <li key={number} className={`${styles.pageItem} ${currentPage === number ? styles.active : ''}`}>
                        <button className={styles.pageLink} onClick={() => onPageChange(number)} aria-current={currentPage === number ? 'page' : undefined}>
                            {number}
                        </button>
                    </li>
                ))}
                <NavButton onClick={() => onPageChange(endPage + 1)} disabled={endPage >= totalPages} ariaLabel="Next Page Block">&gt;</NavButton>
                <NavButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} ariaLabel="Last Page">&raquo;</NavButton>
            </ul>
        </nav>
    );
};

export default Pagination;