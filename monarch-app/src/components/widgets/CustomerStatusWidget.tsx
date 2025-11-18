import React, { useState, useEffect } from "react";
import axios from "axios";
import { Chart } from "react-google-charts";
import Widget from "../Widget";

interface CustomerStatus {
    activeCustomers: number;
    potentialCustomers: number;
    churnedCustomers: number;
}

const CustomerStatusWidget: React.FC = () => {
    const [customerStatusData, setCustomerStatusData] = useState<CustomerStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomerStatusData = async () => {
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
                        methodName: 'CHART_LIST',
                        USITE: usite,
                        UID: uid,
                    }
                });
                setCustomerStatusData(response.data);
            } catch (err) {
                setError('고객 상태 정보를 불러오는 데 실패했습니다.');
                console.error('Customer status data fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomerStatusData();
    }, []);

    const chartData = [
        ["Task", "고객 현황"],
        ["활성 고객", customerStatusData[0]?.activeCustomers || 0],
        ["잠재 고객", customerStatusData[0]?.potentialCustomers || 0],
        ["이탈 고객", customerStatusData[0]?.churnedCustomers || 0],
    ];

    const chartOptions = {
        title: '고객 현황',
        is3D: true,
    };

    if (isLoading) return <Widget title="고객 현황"><div className="loading">데이터를 불러오는 중입니다...</div></Widget>;
    if (error) return <Widget title="고객 현황"><div className="error">{error}</div></Widget>;

    return (
        <Widget title="고객 현황">
            {customerStatusData.length > 0 ? (
                <Chart
                    chartType="PieChart"
                    data={chartData}
                    options={chartOptions}
                    width={"100%"}
                    height={"300px"}
                />
            ) : (
                <div>표시할 고객 현황 데이터가 없습니다.</div>
            )}
        </Widget>
    );
};

export default CustomerStatusWidget;
