package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.ReceiptRecord;

import java.util.List;

public interface ReceiptService {
    /**
     * 回单签收
     */
    void signReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId, String remark);

    /**
     * 回单寄出
     */
    void sendReceipt(Long waybillId, String expressNo, Long operatorId, String operatorName, Long orgId, String remark);

    /**
     * 回单收到
     */
    void receiveReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId, String remark);

    /**
     * 回单返厂
     */
    void returnReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId, String remark);

    /**
     * 反签收
     */
    void unsignReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId);

    /**
     * 反寄出
     */
    void unsendReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId);

    /**
     * 查询运单的回单操作记录
     */
    List<ReceiptRecord> getByWaybillId(Long waybillId);

    /**
     * 分页查询回单记录
     */
    IPage<ReceiptRecord> list(Page<ReceiptRecord> page, String keyword, String action);
}
