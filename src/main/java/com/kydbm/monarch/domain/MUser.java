package com.kydbm.monarch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Date;

/** 사용자 정보를 관리하는 엔티티. M_USER 테이블과 매핑됩니다. */
@Entity
@Table(name = "M_USER")
@Getter
@Setter
public class MUser {

    /**
     * 사용자번호 (PK). DB 시퀀스를 통해 자동 생성됩니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "M_USER_NO_SEQ_GENERATOR")
    @SequenceGenerator(name = "M_USER_NO_SEQ_GENERATOR", sequenceName = "M_USER_NO_SEQ", allocationSize = 1)
    @Column(name = "M_USER_NO", nullable = false)
    private Long mUserNo;

    /** 사용자 ID (로그인 시 사용) */
    @Column(name = "USER_CODE", nullable = false, length = 50)
    private String userCode;

    /** 사용자 비밀번호 (BCrypt로 암호화되어 저장) */
    @Column(name = "USER_PASSWORD", length = 100)
    private String userPassword;

    /** 사용자 이름 */
    @Column(name = "USER_NAME", length = 100)
    private String userName;

    /** 입사일 */
    @Column(name = "HIRE_DATE")
    private Date hireDate;

    /** 퇴사일 */
    @Column(name = "RETIREMENT_DATE")
    private Date retirementDate;

    /** 일반 전화번호 */
    @Column(name = "TEL_NO", length = 20)
    private String telNo;

    /** 휴대폰 번호 */
    @Column(name = "MOBILE_NO", length = 20)
    private String mobileNo;

    /** 이메일 주소 */
    @Column(name = "EMAIL", length = 50)
    private String email;

    /** 그룹웨어 연동 키 */
    @Column(name = "GROUPWARE_KEY", length = 50)
    private String groupwareKey;

    /** 부서 번호 (M_DEPT 테이블의 PK) */
    @Column(name = "M_DEPT_NO")
    private Long mDeptNo;

    /** 부서 코드 */
    @Column(name = "DEPT_CODE", length = 12)
    private String deptCode;

    /** 사용 여부 (1: 사용, 0: 미사용) */
    @JdbcTypeCode(SqlTypes.NCHAR)
    @Column(name = "USE_FLAG", length = 1)
    private String useFlag;

    /** 회원사 번호 (다중 테넌트 지원용) */
    @Column(name = "M_USITE_NO", nullable = false)
    private Long mUsiteNo;

    /** 등록일 (자동 생성) */
    @CreationTimestamp
    @Column(name = "REG_DATE", nullable = false, updatable = false)
    private LocalDateTime regDate;

    /** 수정일 (자동 업데이트) */
    @UpdateTimestamp
    @Column(name = "UPD_DATE", nullable = false)
    private LocalDateTime updDate;

    /** 등록자 (M_USER_NO) */
    @Column(name = "REG_USER", nullable = false)
    private Long regUser;

    /** 수정자 (M_USER_NO) */
    @Column(name = "UPD_USER", nullable = false)
    private Long updUser;

    /** 직위 코드 */
    @Column(name = "POSITION_CODE", length = 20)
    private String positionCode;

    /** 직책 코드 */
    @Column(name = "DUTY_CODE", length = 20)
    private String dutyCode;

    /** 접속 유지 시간 */
    @Column(name = "CONN_DUR", nullable = false)
    private Long connDur;

    /** 중복 로그인 허용 여부 */
    @Column(name = "MULTIPLE_LOGIN_FLAG")
    private Long multipleLoginFlag;

    /** 로그인 후 시작 메뉴 ID */
    @Column(name = "START_MENU")
    private Long startMenu;

    /** 비밀번호 마지막 수정일 */
    @Column(name = "PW_UPD_DATE")
    private Date pwUpdDate;

    /** 접근 제한 여부 */
    @Column(name = "ACCESS_LIMIT_FLAG", length = 1)
    private String accessLimitFlag;

    /** 로그인 실패 횟수 (5회 이상 시 계정 잠김) */
    @Column(name = "LOGIN_FAIL_CNT")
    private Long loginFailCnt;

    /** 사용자 언어 설정 (ko, en 등) */
    @Column(name = "USER_LANG", length = 2)
    private String userLang;

    /** 사용자 직무 */
    @Column(name = "USERDUTY", length = 200)
    private String userDuty;

    /** 사용자 ID (USER_CODE와 중복될 수 있음) */
    @Column(name = "USERID", length = 50)
    private String userId;

    /** 권한 번호 */
    @Column(name = "AUTH_NUM")
    private Integer authNum;
}
