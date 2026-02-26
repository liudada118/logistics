package com.yuntu.logistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.dto.WaybillCreateRequest;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.entity.WaybillStatusLog;
import com.yuntu.logistics.mapper.WaybillMapper;
import com.yuntu.logistics.mapper.WaybillStatusLogMapper;
import com.yuntu.logistics.service.FinanceService;
import com.yuntu.logistics.service.WaybillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class WaybillServiceImpl implements WaybillService {

    private final WaybillMapper waybillMapper;
    private final WaybillStatusLogMapper statusLogMapper;
    private final FinanceService financeService;
    private static final AtomicLong SEQ = new AtomicLong(1);

    private String generateWaybillNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long seq = SEQ.getAndIncrement();
        return "YT" + dateStr + String.format("%05d", seq);
    }

    @Override
    @Transactional
    public Waybill createWaybill(WaybillCreateRequest request, User currentUser) {
        Waybill waybill = new Waybill();
        waybill.setWaybillNo(generateWaybillNo());

        // 发货信息
        waybill.setSenderCustomerId(request.getSenderCustomerId());
        waybill.setSenderName(request.getSenderName());
        waybill.setSenderPhone(request.getSenderPhone());
        waybill.setSenderAddress(request.getSenderAddress());

        // 收货信息
        waybill.setReceiverName(request.getReceiverName());
        waybill.setReceiverPhone(request.getReceiverPhone());
        waybill.setReceiverAddress(request.getReceiverAddress());

        // 站点信息
        waybill.setOriginOrgId(request.getOriginOrgId());
        waybill.setOriginOrgName(request.getOriginOrgName());
        waybill.setTransitOrgId(request.getTransitOrgId());
        waybill.setTransitOrgName(request.getTransitOrgName());
        waybill.setDestOrgId(request.getDestOrgId());
        waybill.setDestOrgName(request.getDestOrgName());

        // 货物信息
        waybill.setGoodsName(request.getGoodsName());
        waybill.setPackingType(request.getPackingType());
        waybill.setQuantity(request.getQuantity());
        waybill.setWeight(request.getWeight());
        waybill.setVolume(request.getVolume());

        // 费用信息
        waybill.setPaymentMethod(request.getPaymentMethod());
        waybill.setFreightFee(request.getFreightFee());
        waybill.setBaseFreight(request.getBaseFreight());
        waybill.setInsuranceFee(request.getInsuranceFee());
        waybill.setPickupFee(request.getPickupFee());
        waybill.setDeliveryFee(request.getDeliveryFee());
        waybill.setPackingFee(request.getPackingFee());
        waybill.setOtherFee(request.getOtherFee());

        // 代收货款
        waybill.setCodAmount(request.getCodAmount());
        waybill.setCodStatus(request.getCodAmount() != null && request.getCodAmount().compareTo(BigDecimal.ZERO) > 0 ? "待收" : "无");

        // 回单要求
        waybill.setReceiptRequired(request.getReceiptRequired());
        waybill.setReceiptCount(request.getReceiptCount());

        // 交接方式
        waybill.setDeliveryMethod(request.getDeliveryMethod());

        // 状态
        waybill.setStatus("待调度");
        waybill.setReceiptStatus(request.getReceiptRequired() != null && request.getReceiptRequired() == 0 ? "无需回单" : "待签收");

        // 操作信息
        waybill.setCreatorId(currentUser.getId());
        waybill.setCreatorName(currentUser.getFullName());
        waybill.setCurrentOrgId(currentUser.getOrgId());
        waybill.setCurrentOrgName(currentUser.getOrgName());
        waybill.setRemark(request.getRemark());

        // 默认发站为当前网点
        if (waybill.getOriginOrgId() == null) {
            waybill.setOriginOrgId(currentUser.getOrgId());
            waybill.setOriginOrgName(currentUser.getOrgName());
        }

        waybillMapper.insert(waybill);

        // 记录状态日志
        addStatusLog(waybill.getId(), "待调度", "运单创建成功", currentUser);

        // 自动生成财务记录（业务财务一体化）
        financeService.generateFinanceRecords(waybill.getId());

        return waybill;
    }

    @Override
    public Waybill getWaybillById(Long id) {
        Waybill waybill = waybillMapper.selectById(id);
        if (waybill == null) {
            throw new RuntimeException("运单不存在");
        }
        return waybill;
    }

    @Override
    public IPage<Waybill> listWaybills(int page, int size, String status, String keyword) {
        LambdaQueryWrapper<Waybill> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(status)) {
            wrapper.eq(Waybill::getStatus, status);
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like(Waybill::getWaybillNo, keyword)
                .or().like(Waybill::getSenderName, keyword)
                .or().like(Waybill::getReceiverName, keyword)
                .or().like(Waybill::getGoodsName, keyword)
            );
        }

        wrapper.orderByDesc(Waybill::getCreatedAt);
        return waybillMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    @Transactional
    public void updateWaybill(Long id, WaybillCreateRequest request) {
        Waybill waybill = getWaybillById(id);

        // 发货信息
        waybill.setSenderCustomerId(request.getSenderCustomerId());
        waybill.setSenderName(request.getSenderName());
        waybill.setSenderPhone(request.getSenderPhone());
        waybill.setSenderAddress(request.getSenderAddress());

        // 收货信息
        waybill.setReceiverName(request.getReceiverName());
        waybill.setReceiverPhone(request.getReceiverPhone());
        waybill.setReceiverAddress(request.getReceiverAddress());

        // 站点信息
        waybill.setOriginOrgId(request.getOriginOrgId());
        waybill.setOriginOrgName(request.getOriginOrgName());
        waybill.setTransitOrgId(request.getTransitOrgId());
        waybill.setTransitOrgName(request.getTransitOrgName());
        waybill.setDestOrgId(request.getDestOrgId());
        waybill.setDestOrgName(request.getDestOrgName());

        // 货物信息
        waybill.setGoodsName(request.getGoodsName());
        waybill.setPackingType(request.getPackingType());
        waybill.setQuantity(request.getQuantity());
        waybill.setWeight(request.getWeight());
        waybill.setVolume(request.getVolume());

        // 费用信息
        waybill.setPaymentMethod(request.getPaymentMethod());
        waybill.setFreightFee(request.getFreightFee());
        waybill.setBaseFreight(request.getBaseFreight());
        waybill.setInsuranceFee(request.getInsuranceFee());
        waybill.setPickupFee(request.getPickupFee());
        waybill.setDeliveryFee(request.getDeliveryFee());
        waybill.setPackingFee(request.getPackingFee());
        waybill.setOtherFee(request.getOtherFee());

        // 代收货款
        waybill.setCodAmount(request.getCodAmount());

        // 回单要求
        waybill.setReceiptRequired(request.getReceiptRequired());
        waybill.setReceiptCount(request.getReceiptCount());

        // 交接方式
        waybill.setDeliveryMethod(request.getDeliveryMethod());

        waybill.setRemark(request.getRemark());

        waybillMapper.updateById(waybill);
    }

    @Override
    public void deleteWaybill(Long id) {
        waybillMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void updateReceiptStatus(Long id, String receiptStatus, User currentUser) {
        Waybill waybill = getWaybillById(id);
        waybill.setReceiptStatus(receiptStatus);
        waybillMapper.updateById(waybill);

        // 记录日志
        addStatusLog(id, waybill.getStatus(), "回单状态更新为：" + receiptStatus, currentUser);
    }

    @Override
    public List<WaybillStatusLog> getStatusLogs(Long waybillId) {
        LambdaQueryWrapper<WaybillStatusLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WaybillStatusLog::getWaybillId, waybillId);
        wrapper.orderByAsc(WaybillStatusLog::getCreatedAt);
        return statusLogMapper.selectList(wrapper);
    }

    private void addStatusLog(Long waybillId, String status, String description, User operator) {
        WaybillStatusLog log = new WaybillStatusLog();
        log.setWaybillId(waybillId);
        log.setStatus(status);
        log.setDescription(description);
        log.setOperatorId(operator.getId());
        log.setOperatorName(operator.getFullName());
        statusLogMapper.insert(log);
    }
}
