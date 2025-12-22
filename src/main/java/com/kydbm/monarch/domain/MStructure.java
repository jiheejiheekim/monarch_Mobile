package com.kydbm.monarch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * @Entity
 * @description 동적 화면 구성 정보를 관리하는 엔티티 클래스입니다.
 */
/**
 * 동적 화면 구성 정보를 관리하는 엔티티
 */
@Entity
@Table(name = "M_STRUCTURE", uniqueConstraints = {
        @UniqueConstraint(name = "M_STRUCTURE_UK", columnNames = { "STRUCTURE_NAME", "M_USITE_NO" })
})
@Getter
@Setter
public class MStructure {
    /**
     * @Id @GeneratedValue
     * @description 화면구성번호 (PK). 데이터베이스 시퀀스를 사용하여 자동으로 생성됩니다.
     */
    /**
     * 화면구성번호 (PK)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "M_STRUCTURE_NO_SEQ_GENERATOR")
    @SequenceGenerator(name = "M_STRUCTURE_NO_SEQ_GENERATOR", sequenceName = "M_STRUCTURE_NO_SEQ", allocationSize = 1)
    @Column(name = "M_STRUCTURE_NO")
    private Long mStructureNo;

    /**
     * 화면구성명 (예: "영업관리_MTBL").
     * 프론트엔드의 `DynamicGridWidget`을 식별하는 고유한 이름이며, UK 제약 조건에 사용됩니다.
     */
    @Column(name = "STRUCTURE_NAME", nullable = false, length = 200)
    private String structureName;

    /**
     * 화면구성 유형 (예: "고객 > 고객관리").
     * 관리 화면에서 메뉴의 계층 구조를 표현하거나, 화면의 종류를 나타낼 때 사용합니다.
     */
    @Column(name = "STRUCTURE_TYPE", length = 50)
    private String structureType;

    /**
     * 화면 구성 내용 (JSON 형식).
     * `DynamicGridWidget`의 모양과 동작을 정의하는 실제 JSON 문자열이 저장됩니다.
     * NCLOB 타입을 사용하여 긴 텍스트 데이터를 저장합니다.
     */
    @Lob
    @Column(name = "STRUCTURE_CONT", columnDefinition = "NCLOB")
    private String structureCont;

    /**
     * 화면 구성에 대한 간단한 설명.
     * 관리자가 위젯의 용도를 파악하는 데 도움을 줍니다.
     */
    @Column(name = "STRUCTURE_DESC", length = 200)
    private String structureDesc;

    /**
     * 사용 여부 (예: "1"은 사용, "0"은 미사용).
     * 이 위젯을 현재 시스템에서 활성화할지 여부를 결정합니다.
     */
    @Column(name = "USE_FLAG", length = 1)
    private String useFlag;

    /**
     * 회원사번호.
     * 다중 테넌트(multi-tenant) 환경에서 어떤 회원사에 속하는 데이터인지 식별하는 데 사용합니다.
     */
    @Column(name = "M_USITE_NO", nullable = false)
    private Long mUsiteNo;

    /**
     * @description 등록일. 데이터가 생성된 시간을 자동으로 기록합니다.
     */
    @CreationTimestamp
    @Column(name = "REG_DATE", nullable = false, updatable = false)
    private LocalDateTime regDate;

    /**
     * @description 수정일. 데이터가 마지막으로 수정된 시간을 자동으로 기록합니다.
     */
    @UpdateTimestamp
    @Column(name = "UPD_DATE", nullable = false)
    private LocalDateTime updDate;

    /**
     * @Column(name = "REG_USER")
     * @description 등록자. 데이터를 처음 등록한 사용자의 식별자를 기록합니다.
     */
    /**
     * 등록자
     */
    @Column(name = "REG_USER", nullable = false)
    private Long regUser;

    /**
     * @Column(name = "UPD_USER")
     * @description 수정자. 데이터를 마지막으로 수정한 사용자의 식별자를 기록합니다.
     */
    /**
     * 수정자
     */
    @Column(name = "UPD_USER", nullable = false)
    private Long updUser;

    /**
     * @Lob @Column(columnDefinition = "NCLOB")
     * @description HTML 내용 (사용 시). HTML 코드를 직접 저장해야 할 경우를 대비한 필드입니다.
     */
    /**
     * HTML 내용 (사용 시)
     */
    @Lob
    @Column(name = "HTML_CONT", columnDefinition = "NCLOB")
    private String htmlCont;
}