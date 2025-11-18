import React, { useState, useEffect } from "react";
import axios from "axios";
import { Chart } from "react-google-charts";
import Widget from "../Widget";

interface SalesStatus {
    thisMonthSales: number;
    lastMonthSales: number;
}

const SalesStatusWidget: React.FC = () => {
    const [salesStatusData, setSalesStatusData] = useState<SalesStatus[]>([]);
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
                    }
                });
                setSalesStatusData(response.data);
            } catch (err) {
                setError('매출 상태 정보를 불러오는 데 실패했습니다.');
                console.error('Sales status data fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalesStatusData();
    }, []);

    const chartData = [
        ["Task", "매출 현황"],
        ["이번 달 매출", salesStatusData[0]?.thisMonthSales || 0],
        ["지난 달 매출", salesStatusData[0]?.lastMonthSales || 0],
    ];

    const chartOptions = {
        title: '매출 현황',
        is3D: true,
    };

    if (isLoading) return <Widget title="매출 현황"><div className="loading">데이터를 불러오는 중입니다...</div></Widget>;
    if (error) return <Widget title="매출 현황"><div className="error">{error}</div></Widget>;

    return (
        <Widget title="매출 현황">
            {salesStatusData.length > 0 ? (
                <Chart
                    chartType="PieChart"
                    data={chartData}
                    options={chartOptions}
                    width={"100%"}
                    height={"300px"}
                />
            ) : (
                <div>표시할 매출 현황 데이터가 없습니다.</div>
            )}
        </Widget>
    );
};

export default SalesStatusWidget;
