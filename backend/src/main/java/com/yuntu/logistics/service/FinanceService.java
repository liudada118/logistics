package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.entity.FinanceRecord;
import com.yuntu.logistics.entity.User;

import java.util.List;
import java.util.Map;

public interface FinanceService {

    /** 根据运单自动生成财务记录（业务财务一体化） */
    void generateFinanceRecords(Long waybillId);

    /** 分页查询财务记录 */
    IPage<FinanceRecord> page(int pageNum, int pageSize, String type, String status, String keyword);

    /** 结算 */
    void settle(Long id, User currentUser);

    /** 批量结算 */
    void batchSettle(List<Long> ids, User currentUser);

    /** 核销 */
    void verify(Long id, User currentUser);

    /** 批量核销 */
    void batchVerify(List<Long> ids, User currentUser);

    /** 取消 */
    void cancel(Long id, User currentUser);

    /** 财务汇总 */
    Map<String, Object> summary();

    /** 月度趋势 */
    List<Map<String, Object>> monthlyTrend();
}
