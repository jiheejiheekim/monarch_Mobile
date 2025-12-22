package com.kydbm.monarch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 공통 코드를 관리하는 엔티티. M_COMM_CODE 테이블과 매핑됩니다.
 */
@Entity
@Table(name = "M_COMM_CODE")
@Getter
@Setter
public class MCommCode {

    /**
     * 공통코드 번호 (PK). DB 시퀀스를 통해 자동 생성됩니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "M_COMM_CODE_NO_SEQ_GENERATOR")
    @SequenceGenerator(name = "M_COMM_CODE_NO_SEQ_GENERATOR", sequenceName = "M_COMM_CODE_NO_SEQ", allocationSize = 1)
    @Column(name = "M_COMM_CODE_NO", nullable = false)
    private Long mCommCodeNo;

    /** 코드 그룹 ID */
    @Column(name = "CODE_GRP", nullable = false, length = 100)
    private String codeGrp;

    /** 코드 값 */
    @Column(name = "CODE_VAL", nullable = false, length = 100)
    private String codeVal;

    /** 코드 명 */
    @Column(name = "CODE_NAME", nullable = false, length = 100)
    private String codeName;

    /** 코드 명2 (추가 명칭) */
    @Column(name = "CODE_NAME2", length = 100)
    private String codeName2;

    /** 코드 명3 (추가 명칭) */
    @Column(name = "CODE_NAME3", length = 100)
    private String codeName3;

    /** 코드 상세 설명 */
    @Column(name = "CODE_DTL", length = 100)
    private String codeDtl;

    /** 표시 스타일 (CSS 등) */
    @Column(name = "STYLE", length = 50)
    private String style;

    /** 정렬 순서 */
    @Column(name = "SORT_NO")
    private Integer sortNo;

    /** 코드 설명 */
    @Column(name = "CODE_DESC", length = 500)
    private String codeDesc;

    /** 사용 여부 (1: 사용, 0: 미사용) */
    @JdbcTypeCode(SqlTypes.CHAR)
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

    /** 언어 코드 (ko, en 등) */
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "LANG_CODE", length = 2)
    private String langCode;

    /** 상위 코드 그룹 ID */
    @Column(name = "UPPER_CODE_GRP", length = 100)
    private String upperCodeGrp;

    /** 첨부 파일 정보 */
    @Column(name = "ATTC_FILE", length = 30)
    private String attcFile;
}
