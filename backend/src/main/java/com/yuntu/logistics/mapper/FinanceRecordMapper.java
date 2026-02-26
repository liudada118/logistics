package com.yuntu.logistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yuntu.logistics.entity.FinanceRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface FinanceRecordMapper extends BaseMapper<FinanceRecord> {

    @Select("SELECT type, SUM(amount) as total, COUNT(*) as count FROM biz_finance_record WHERE status != '已取消' GROUP BY type")
    List<Map<String, Object>> summaryByType();

    @Select("SELECT type, SUM(amount) as total, COUNT(*) as count FROM biz_finance_record WHERE status = '待结算' GROUP BY type")
    List<Map<String, Object>> pendingSummaryByType();

    @Select("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, type, SUM(amount) as total FROM biz_finance_record WHERE status != '已取消' GROUP BY month, type ORDER BY month DESC LIMIT 24")
    List<Map<String, Object>> monthlyTrend();
}
