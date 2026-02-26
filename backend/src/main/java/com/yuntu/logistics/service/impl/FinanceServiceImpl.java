package com.yuntu.logistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.FinanceRecord;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.mapper.FinanceRecordMapper;
import com.yuntu.logistics.mapper.WaybillMapper;
import com.yuntu.logistics.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {

    private final FinanceRecordMapper financeRecordMapper;
    private final WaybillMapper waybillMapper;

    @Override
    @Transactional
    public void generateFinanceRecords(Long waybillId) {
        Waybill waybill = waybillMapper.selectById(waybillId);
        if (waybill == null) return;

        // 检查是否已生成过
        LambdaQueryWrapper<FinanceRecord> check = new LambdaQueryWrapper<>();
        check.eq(FinanceRecord::getWaybillId, waybillId).eq(FinanceRecord::getType, "应收");
        if (financeRecordMapper.selectCount(check) > 0) return;

        // 生成应收记录
        FinanceRecord receivable = new FinanceRecord();
        receivable.setWaybillId(waybillId);
        receivable.setWaybillNo(waybill.getWaybillNo());
        receivable.setType("应收");
        receivable.setAmount(waybill.getFreightFee());
        receivable.setPaymentMethod(waybill.getPaymentMethod());
        receivable.setStatus("待结算");
        receivable.setCustomerName(waybill.getSenderName());
        receivable.setOrgId(waybill.getCurrentOrgId());
        receivable.setOrgName(waybill.getCurrentOrgName());
        receivable.setCreatorId(waybill.getCreatorId());
        receivable.setCreatorName(waybill.getCreatorName());

        // 现付运单直接标记为已结算
        if ("现付".equals(waybill.getPaymentMethod())) {
            receivable.setStatus("已结算");
            receivable.setSettledAt(LocalDateTime.now());
        }

        financeRecordMapper.insert(receivable);

        // 如果有代收货款，生成代收货款记录
        if (waybill.getCodAmount() != null && waybill.getCodAmount().compareTo(BigDecimal.ZERO) > 0) {
            FinanceRecord codRecord = new FinanceRecord();
            codRecord.setWaybillId(waybillId);
            codRecord.setWaybillNo(waybill.getWaybillNo());
            codRecord.setType("代收货款");
            codRecord.setAmount(waybill.getCodAmount());
            codRecord.setPaymentMethod(waybill.getPaymentMethod());
            codRecord.setStatus("待结算");
            codRecord.setCustomerName(waybill.getSenderName());
            codRecord.setOrgId(waybill.getCurrentOrgId());
            codRecord.setOrgName(waybill.getCurrentOrgName());
            codRecord.setCreatorId(waybill.getCreatorId());
            codRecord.setCreatorName(waybill.getCreatorName());
            financeRecordMapper.insert(codRecord);
        }
    }

    @Override
    public IPage<FinanceRecord> page(int pageNum, int pageSize, String type, String status, String keyword) {
        LambdaQueryWrapper<FinanceRecord> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(type)) wrapper.eq(FinanceRecord::getType, type);
        if (StringUtils.hasText(status)) wrapper.eq(FinanceRecord::getStatus, status);
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like(FinanceRecord::getWaybillNo, keyword)
                .or().like(FinanceRecord::getCustomerName, keyword)
            );
        }
        wrapper.orderByDesc(FinanceRecord::getCreatedAt);
        return financeRecordMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional
    public void settle(Long id, User currentUser) {
        FinanceRecord record = financeRecordMapper.selectById(id);
        if (record == null) throw new RuntimeException("财务记录不存在");
        if (!"待结算".equals(record.getStatus())) throw new RuntimeException("当前状态不可结算");
        record.setStatus("已结算");
        record.setSettledAt(LocalDateTime.now());
        financeRecordMapper.updateById(record);
    }

    @Override
    @Transactional
    public void batchSettle(List<Long> ids, User currentUser) {
        LocalDateTime now = LocalDateTime.now();
        for (Long id : ids) {
            FinanceRecord record = financeRecordMapper.selectById(id);
            if (record != null && "待结算".equals(record.getStatus())) {
                record.setStatus("已结算");
                record.setSettledAt(now);
                financeRecordMapper.updateById(record);
            }
        }
    }

    @Override
    @Transactional
    public void verify(Long id, User currentUser) {
        FinanceRecord record = financeRecordMapper.selectById(id);
        if (record == null) throw new RuntimeException("财务记录不存在");
        if (!"已结算".equals(record.getStatus())) throw new RuntimeException("只有已结算的记录才能核销");
        record.setStatus("已核销");
        record.setVerifiedAt(LocalDateTime.now());
        financeRecordMapper.updateById(record);
    }

    @Override
    @Transactional
    public void batchVerify(List<Long> ids, User currentUser) {
        LocalDateTime now = LocalDateTime.now();
        for (Long id : ids) {
            FinanceRecord record = financeRecordMapper.selectById(id);
            if (record != null && "已结算".equals(record.getStatus())) {
                record.setStatus("已核销");
                record.setVerifiedAt(now);
                financeRecordMapper.updateById(record);
            }
        }
    }

    @Override
    @Transactional
    public void cancel(Long id, User currentUser) {
        FinanceRecord record = financeRecordMapper.selectById(id);
        if (record == null) throw new RuntimeException("财务记录不存在");
        record.setStatus("已取消");
        financeRecordMapper.updateById(record);
    }

    @Override
    public Map<String, Object> summary() {
        Map<String, Object> result = new HashMap<>();
        result.put("byType", financeRecordMapper.summaryByType());
        result.put("pending", financeRecordMapper.pendingSummaryByType());
        return result;
    }

    @Override
    public List<Map<String, Object>> monthlyTrend() {
        return financeRecordMapper.monthlyTrend();
    }
}
