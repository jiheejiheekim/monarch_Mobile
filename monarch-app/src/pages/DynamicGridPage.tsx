import React from 'react';
import { useParams } from 'react-router-dom';
import DynamicGridWidget from '../components/widgets/DynamicGridWidget';
import styles from '../styles/ListPage.module.css';

/**
 * 동적 라우팅을 통해 다양한 그리드를 렌더링하는 템플릿 페이지 컴포넌트입니다.
 */
const DynamicGridPage: React.FC = () => {
    // useParams 훅을 사용하여 URL의 파라미터 값을 가져옵니다.
    // 예를 들어, URL이 /grid/영업관리_MTBL 이라면, structureName 변수에는 "영업관리_MTBL"이 담깁니다.
    const { structureName } = useParams<{ structureName: string }>();

    // structureName이 없는 경우를 대비한 방어 코드
    if (!structureName) {
        return <div className={styles.error}>표시할 그리드 정보가 없습니다.</div>;
    }

    return (
        <main className={styles.pageContent}>
            <DynamicGridWidget structureName={structureName} />
        </main>
    );
};

export default DynamicGridPage;