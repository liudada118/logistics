package com.yuntu.logistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.ReceiptRecord;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.mapper.ReceiptRecordMapper;
import com.yuntu.logistics.mapper.WaybillMapper;
import com.yuntu.logistics.service.ReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ReceiptServiceImpl implements ReceiptService {

    @Autowired
    private ReceiptRecordMapper receiptRecordMapper;
    @Autowired
    private WaybillMapper waybillMapper;

    // 回单状态流转映射：操作 -> 新回单状态
    private static final Map<String, String> ACTION_STATUS_MAP = Map.of(
            "签收", "已签收",
            "寄出", "已寄出",
            "收到", "已收到",
            "返厂", "已返厂",
            "反签收", "待签收",
            "反寄出", "已签收",
            "反收回", "已寄出",
            "取消返厂", "已收到"
    );

    @Override
    @Transactional
    public void signReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId, String remark) {
        doAction(waybillId, "签收", "", operatorId, operatorName, orgId, remark);
    }

    @Override
    @Transactional
    public void sendReceipt(Long waybillId, String expressNo, Long operatorId, String operatorName, Long orgId, String remark) {
        doAction(waybillId, "寄出", expressNo, operatorId, operatorName, orgId, remark);
    }

    @Override
    @Transactional
    public void receiveReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId, String remark) {
        doAction(waybillId, "收到", "", operatorId, operatorName, orgId, remark);
    }

    @Override
    @Transactional
    public void returnReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId, String remark) {
        doAction(waybillId, "返厂", "", operatorId, operatorName, orgId, remark);
    }

    @Override
    @Transactional
    public void unsignReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId) {
        doAction(waybillId, "反签收", "", operatorId, operatorName, orgId, "反签收操作");
    }

    @Override
    @Transactional
    public void unsendReceipt(Long waybillId, Long operatorId, String operatorName, Long orgId) {
        doAction(waybillId, "反寄出", "", operatorId, operatorName, orgId, "反寄出操作");
    }

    private void doAction(Long waybillId, String action, String expressNo, Long operatorId, String operatorName, Long orgId, String remark) {
        Waybill waybill = waybillMapper.selectById(waybillId);
        if (waybill == null) {
            throw new RuntimeException("运单不存在");
        }

        // 更新运单回单状态
        String newStatus = ACTION_STATUS_MAP.get(action);
        if (newStatus != null) {
            waybill.setReceiptStatus(newStatus);
            waybillMapper.updateById(waybill);
        }

        // 创建回单记录
        ReceiptRecord record = new ReceiptRecord();
        record.setWaybillId(waybillId);
        record.setWaybillNo(waybill.getWaybillNo());
        record.setAction(action);
        record.setReceiptCount(waybill.getReceiptCount() != null ? waybill.getReceiptCount() : 1);
        record.setExpressNo(expressNo != null ? expressNo : "");
        record.setRemark(remark != null ? remark : "");
        record.setOperatorId(operatorId);
        record.setOperatorName(operatorName);
        record.setOrgId(orgId);
        receiptRecordMapper.insert(record);
    }

    @Override
    public List<ReceiptRecord> getByWaybillId(Long waybillId) {
        LambdaQueryWrapper<ReceiptRecord> qw = new LambdaQueryWrapper<>();
        qw.eq(ReceiptRecord::getWaybillId, waybillId).orderByDesc(ReceiptRecord::getCreatedAt);
        return receiptRecordMapper.selectList(qw);
    }

    @Override
    public IPage<ReceiptRecord> list(Page<ReceiptRecord> page, String keyword, String action) {
        LambdaQueryWrapper<ReceiptRecord> qw = new LambdaQueryWrapper<>();
        if (action != null && !action.isEmpty()) {
            qw.eq(ReceiptRecord::getAction, action);
        }
        if (keyword != null && !keyword.isEmpty()) {
            qw.and(w -> w.like(ReceiptRecord::getWaybillNo, keyword)
                    .or().like(ReceiptRecord::getOperatorName, keyword));
        }
        qw.orderByDesc(ReceiptRecord::getCreatedAt);
        return receiptRecordMapper.selectPage(page, qw);
    }
}
