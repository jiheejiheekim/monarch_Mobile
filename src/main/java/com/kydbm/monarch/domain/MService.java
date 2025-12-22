package com.kydbm.monarch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/** 서비스(동적 쿼리) 정보를 관리하는 엔티티. M_SERVICE 테이블과 매핑됩니다. */
@Entity
@Table(name = "M_SERVICE", uniqueConstraints = {
        @UniqueConstraint(name = "M_SERVICE_UK", columnNames = { "SERVICE_NAME", "METHOD_NAME", "M_USITE_NO" })
})
@Getter
@Setter
public class MService {

    /**
     * 서비스번호 (PK). DB 시퀀스를 통해 자동 생성됩니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "M_SERVICE_NO_SEQ_GENERATOR")
    @SequenceGenerator(name = "M_SERVICE_NO_SEQ_GENERATOR", sequenceName = "M_SERVICE_NO_SEQ", allocationSize = 1)
    @Column(name = "M_SERVICE_NO", nullable = false)
    private Long mServiceNo;

    /** 쿼리명. 쿼리의 목적이나 기능을 간략하게 설명하는 이름입니다. */
    @Column(name = "QUERY_NAME", length = 200)
    private String queryName;

    /** 서비스명. 이 서비스 엔티티를 식별하는 고유한 이름이며, UK 제약 조건에 사용됩니다. */
    @Column(name = "SERVICE_NAME", nullable = false, length = 50)
    private String serviceName;

    /** 메소드명. 서비스 내에서 실행할 특정 작업(메소드)을 식별하는 이름이며, UK 제약 조건에 사용됩니다. */
    @Column(name = "METHOD_NAME", nullable = false, length = 50)
    private String methodName;

    /** 실행방식. 쿼리의 실행 유형(READ, LIST, INSERT, UPDATE, DELETE 등)을 정의합니다. */
    @Column(name = "EXEC_TYPE", length = 50)
    private String execType;

    /** 쿼리문. 실제로 실행될 SQL 쿼리문이며, NCLOB 타입을 사용하여 긴 쿼리문을 저장합니다. */
    @Lob
    @Column(name = "QUERY_STMT", columnDefinition = "NCLOB")
    private String queryStmt;

    /** 쿼리설명. 쿼리에 대한 설명을 제공하여, 쿼리의 목적과 내용을 쉽게 이해할 수 있도록 돕습니다. */
    @Column(name = "QUERY_DESC", length = 200)
    private String queryDesc;

    /** 테이블명. 쿼리가 어떤 테이블과 관련되어 있는지 나타냅니다. */
    @Column(name = "TABLE_NAME", length = 200)
    private String tableName;

    /** 데이터소스명. 어떤 데이터소스를 사용하여 쿼리를 실행해야 하는지 나타냅니다. */
    @Column(name = "DS_NAME", length = 100)
    private String dsName;

    /** 사용여부. 쿼리가 현재 사용 가능한 상태인지 나타냅니다 (1: 사용, 0: 미사용). */
    @JdbcTypeCode(SqlTypes.NCHAR)
    @Column(name = "USE_FLAG", length = 1)
    private String useFlag;

    /** 회원사번호. 다중 테넌트 환경에서 데이터를 구분하기 위해 사용됩니다. */
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
}
