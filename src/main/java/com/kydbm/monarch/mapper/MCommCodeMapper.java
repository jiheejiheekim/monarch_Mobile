package com.kydbm.monarch.mapper;

import com.kydbm.monarch.domain.MCommCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MCommCodeMapper {

    @Select("""
            SELECT M_COMM_CODE_NO, CODE_GRP, CODE_VAL, CODE_NAME, CODE_NAME2, CODE_NAME3,
                   CODE_DTL, STYLE, SORT_NO, CODE_DESC, USE_FLAG, M_USITE_NO,
                   REG_DATE, UPD_DATE, REG_USER, UPD_USER, LANG_CODE, UPPER_CODE_GRP, ATTC_FILE
            FROM M_COMM_CODE
            WHERE CODE_GRP = #{codeGrp} AND M_USITE_NO = #{mUsiteNo} AND USE_FLAG = '1'
            ORDER BY SORT_NO ASC, CODE_NAME ASC
            """)
    List<MCommCode> findByCodeGrpAndUsiteNo(@Param("codeGrp") String codeGrp, @Param("mUsiteNo") Long mUsiteNo);
}
