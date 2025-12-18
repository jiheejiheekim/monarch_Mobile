import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance'; // 수정: axiosInstance import
import { useNavigate } from 'react-router-dom';

import styles from './MainPage.module.css'; // CSS 모듈 가져오기

interface UserData {
    USER_NAME: string;
    [key: string]: string | number | boolean | null | undefined;
}

const MainPage: React.FC = () => {
    const navigate = useNavigate(); // For handleLogout
    const [message, setMessage] = useState('Loading...');

    const user: UserData | null = useMemo(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    }, []);

 const handleLogout = async () => {
 await axiosInstance.post('/api/logout').catch(err => console.error("Logout failed", err));
 // sessionStorage에서 사용자 정보를 삭제합니다.
 sessionStorage.removeItem('user');
 navigate('/login'); // 로그아웃 성공 시 로그인 페이지로 이동합니다.
 };
    
    useEffect(() => {
        const fetchHelloMessage = async () => {
            try {
                const response = await axiosInstance.get('/api/hello');
                setMessage(response.data.message);
            } catch (error) {
                console.error("Failed to fetch hello message:", error);
                setMessage("Could not load message from backend.");
            }
        };
        fetchHelloMessage();
    }, []);
    
    // user 객체를 테이블 데이터 형식으로 변환
    const userData = user ? [user] : [];

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        반갑습니다, {user?.USER_NAME} <span className={styles.honorific}>님</span>
                    </h1>
                    <p className={styles.subtitle}>You are successfully logged in.</p>
                </div>
                <p className={styles.message}>
                    Message from backend: <strong>{message}</strong>
                </p>
                {userData.length > 0 && (
                    <div className={styles.userDataSection}>
                        <h2 className={styles.userDataTitle}>User Details from DB</h2>
                        <table className={styles.userDataTable}>
                            <thead>
                                <tr>
                                    {Object.keys(userData[0] || {}).map(key => <th key={key}>{key}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {userData.map((row, index) => <tr key={index}>{Object.values(row).map((val, i) => <td key={i}>{String(val)}</td>)}</tr>)}
                            </tbody>
                        </table>
                    </div>
                )}
                <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </div>
        </div>
    );
};

export default MainPage;