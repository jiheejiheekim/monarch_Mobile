import React from 'react';
import styles from './DashboardPage.module.css'; // 기존 스타일 재사용

/**
 * Service 정보 관리 페이지 컴포넌트입니다.
 */
const ServiceAdminPage: React.FC = () => {
    return (
        <main className={styles.pageContent}>
            <h2 className={styles.pageTitle}>Service 정보 관리</h2>
            <p>이곳에서 Service 정보를 관리할 수 있습니다.</p>
        </main>
    );
};

export default ServiceAdminPage;