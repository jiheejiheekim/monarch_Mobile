import React, { useState, useEffect } from "react";
import axios from "axios";
import { Chart } from "react-google-charts";
import styles from "../../styles/ListPage.module.css"; // styles import 추가
import Widget from "../Widget";

interface SalesStatusItem {
    SALESTATE_NM: string;
    PRIORITY6M: number;
}

type SalesStatusData = (string | number)[];

const SalesStatusWidget: React.FC = () => {
    const [chartData, setChartData] = useState<SalesStatusData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSalesStatusData = async () => {
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
                        methodName: 'CHART_LIST',
                        USITE: usite,
                        UID: uid,
                        _sort: 'SALESTATE ASC', // 정렬 조건 추가
                    }
                });

                // API 응답 데이터를 Google Charts 형식에 맞게 변환합니다.
                const formattedData: SalesStatusData[] = [["영업 단계", "건수"]];
                // EXEC_TYPE이 'LIST'이므로, 응답은 { data: [...], totalCount: N } 형태의 객체를 포함한 배열입니다.
                const result = response.data[0];
                const actualData = result?.data || [];
                actualData.forEach((item: SalesStatusItem) => {
                    // 건수가 0보다 큰 항목만 차트에 추가합니다.
                    if (Number(item.PRIORITY6M) > 0) {
                        formattedData.push([item.SALESTATE_NM, Number(item.PRIORITY6M)]);
                    }
                });
                setChartData(formattedData);
            } catch (err) {
                setError('매출 상태 정보를 불러오는 데 실패했습니다.');
                console.error('Sales status data fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalesStatusData();
    }, []);

    const chartOptions = {
        title: '영업 단계별 현황 (최근 6개월)',
        pieHole: 0.4, // 도넛 차트 효과
    };

    if (isLoading) return <Widget title="매출 현황"><div className={styles.loading}>데이터를 불러오는 중입니다...</div></Widget>;
    if (error) return <Widget title="매출 현황"><div className={styles.error}>{error}</div></Widget>;

    return (
        <Widget title="매출 현황">
            {chartData.length > 1 ? (
                <>
                    <Chart
                        chartType="PieChart"
                        data={chartData}
                        options={chartOptions}
                        width={"100%"}
                        height={"250px"} // 테이블 공간을 위해 차트 높이 조정
                    />
                    <div className={styles.tableContainer} style={{ marginTop: '20px', maxHeight: '200px' }}>
                        <table className={styles.userDataTable}>
                            <thead>
                                <tr>
                                    <th className={styles.textCenter}>영업 단계</th>
                                    <th className={styles.textRight}>건수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartData.slice(1).map((row, index) => ( // 헤더를 제외하고 데이터만 렌더링
                                    <tr key={index}>
                                        <td>{String(row[0])}</td>
                                        <td className={styles.textRight}>{Number(row[1]).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (<div className={styles.noData}>표시할 매출 현황 데이터가 없습니다.</div>)}
        </Widget>
    );
};

export default SalesStatusWidget;
