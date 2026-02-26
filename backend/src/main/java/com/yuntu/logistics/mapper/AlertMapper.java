package com.yuntu.logistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yuntu.logistics.entity.Alert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AlertMapper extends BaseMapper<Alert> {

    @Select("SELECT COUNT(*) FROM biz_alert WHERE status = '未处理'")
    int countUnhandled();
}
