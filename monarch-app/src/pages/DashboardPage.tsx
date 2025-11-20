import React from 'react';
import Widget from '../components/Widget';
// 원래대로 상대 경로를 사용하여 import 경로를 수정합니다.
import CustomerStatusWidget from '../components/widgets/dashboard/CustomerStatusWidget';
import SalesStatusWidget from '../components/widgets/dashboard/SalesStatusWidget';

import styles from './DashboardPage.module.css';

// 준비 중인 위젯을 위한 간단한 플레이스홀더 컴포넌트입니다.
const PlaceholderWidget: React.FC<{ title: string }> = ({ title }) => (
    <Widget title={title}>
        <div>콘텐츠 준비 중...</div>
    </Widget>
);

const DashboardPage: React.FC = () => {
    // 위젯 목록을 배열로 정의합니다.
    // 각 위젯은 고유한 id와 렌더링할 컴포넌트를 가집니다.
    const dashboardWidgets = [
        { id: 'customerStatus', Component: CustomerStatusWidget },
        { id: 'salesStatus', Component: SalesStatusWidget },
        // PlaceholderWidget을 사용하여 예시 위젯을 간결하게 표현합니다.
        { id: 'newWidget1', Component: () => <PlaceholderWidget title="새로운 위젯 1" /> },
        { id: 'newWidget2', Component: () => <PlaceholderWidget title="새로운 위젯 2" /> },
        { id: 'newWidget3', Component: () => <PlaceholderWidget title="새로운 위젯 3" /> },
        { id: 'newWidget4', Component: () => <PlaceholderWidget title="새로운 위젯 4" /> },
    ];

    return (
        <main className={styles.pageContent}>
            <h2 className={styles.pageTitle}>대시보드</h2>
            <div className={styles.widgetGrid}>
                {dashboardWidgets.map(({ id, Component }) => (
                    <Component key={id} />
                ))}
            </div>
        </main>
    );
};

export default DashboardPage;