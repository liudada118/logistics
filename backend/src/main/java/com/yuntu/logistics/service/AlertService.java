package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yuntu.logistics.entity.*;
import com.yuntu.logistics.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 预警检测服务
 * 实现PRD中12项预警红灯的检测逻辑
 */
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertMapper alertMapper;
    private final InventoryMapper inventoryMapper;
    private final WaybillMapper waybillMapper;
    private final FinanceRecordMapper financeRecordMapper;

    /**
     * 检测库存超期预警
     * 货物在库时间超过3天
     */
    public void checkInventoryOverdue() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(3);
        LambdaQueryWrapper<Inventory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Inventory::getStatus, "待出库")
               .lt(Inventory::getInboundAt, threshold);
        List<Inventory> overdueItems = inventoryMapper.selectList(wrapper);

        for (Inventory item : overdueItems) {
            // 检查是否已有未处理的同类预警
            LambdaQueryWrapper<Alert> check = new LambdaQueryWrapper<>();
            check.eq(Alert::getTargetId, item.getId())
                 .eq(Alert::getTargetType, "inventory")
                 .eq(Alert::getType, "库存超期预警")
                 .eq(Alert::getStatus, "未处理");
            if (alertMapper.selectCount(check) > 0) continue;

            Alert alert = new Alert();
            alert.setType("库存超期预警");
            alert.setLevel("中");
            alert.setTitle("库存超期：" + item.getGoodsName());
            alert.setContent("运单关联货物 " + item.getGoodsName() + " 在库超过3天，请及时处理");
            alert.setTargetId(item.getId());
            alert.setTargetType("inventory");
            alert.setOrgId(item.getOrgId());
            alert.setStatus("未处理");
            alertMapper.insert(alert);
        }
    }

    /**
     * 检测回单超期预警
     * 已签收但回单状态仍为"待寄出"超过5天
     */
    public void checkReceiptOverdue() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(5);
        LambdaQueryWrapper<Waybill> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Waybill::getStatus, "已签收")
               .eq(Waybill::getReceiptStatus, "待寄出")
               .lt(Waybill::getUpdatedAt, threshold);
        List<Waybill> overdueWaybills = waybillMapper.selectList(wrapper);

        for (Waybill w : overdueWaybills) {
            LambdaQueryWrapper<Alert> check = new LambdaQueryWrapper<>();
            check.eq(Alert::getTargetId, w.getId())
                 .eq(Alert::getTargetType, "waybill")
                 .eq(Alert::getType, "回单超期预警")
                 .eq(Alert::getStatus, "未处理");
            if (alertMapper.selectCount(check) > 0) continue;

            Alert alert = new Alert();
            alert.setType("回单超期预警");
            alert.setLevel("中");
            alert.setTitle("回单超期：" + w.getWaybillNo());
            alert.setContent("运单 " + w.getWaybillNo() + " 已签收但回单未寄出超过5天");
            alert.setTargetId(w.getId());
            alert.setTargetType("waybill");
            alert.setOrgId(w.getCurrentOrgId());
            alert.setStatus("未处理");
            alertMapper.insert(alert);
        }
    }

    /**
     * 检测应收款超期预警
     * 待结算超过30天
     */
    public void checkFinanceOverdue() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        LambdaQueryWrapper<FinanceRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FinanceRecord::getStatus, "待结算")
               .eq(FinanceRecord::getType, "应收")
               .lt(FinanceRecord::getCreatedAt, threshold);
        List<FinanceRecord> overdueRecords = financeRecordMapper.selectList(wrapper);

        for (FinanceRecord r : overdueRecords) {
            LambdaQueryWrapper<Alert> check = new LambdaQueryWrapper<>();
            check.eq(Alert::getTargetId, r.getId())
                 .eq(Alert::getTargetType, "finance")
                 .eq(Alert::getType, "应收款超期预警")
                 .eq(Alert::getStatus, "未处理");
            if (alertMapper.selectCount(check) > 0) continue;

            Alert alert = new Alert();
            alert.setType("应收款超期预警");
            alert.setLevel("高");
            alert.setTitle("应收款超期：" + r.getWaybillNo());
            alert.setContent("运单 " + r.getWaybillNo() + " 应收款 ¥" + r.getAmount() + " 超过30天未结算");
            alert.setTargetId(r.getId());
            alert.setTargetType("finance");
            alert.setOrgId(r.getOrgId());
            alert.setStatus("未处理");
            alertMapper.insert(alert);
        }
    }

    /**
     * 运行所有预警检测
     */
    public void runAllChecks() {
        checkInventoryOverdue();
        checkReceiptOverdue();
        checkFinanceOverdue();
    }
}
