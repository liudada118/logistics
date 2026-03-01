package com.yuntu.logistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.*;
import com.yuntu.logistics.mapper.*;
import com.yuntu.logistics.service.TransportTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class TransportTaskServiceImpl implements TransportTaskService {

    private final TransportTaskMapper transportTaskMapper;
    private final WaybillMapper waybillMapper;
    private final RouteMapper routeMapper;
    private final VehicleMapper vehicleMapper;
    private final InventoryMapper inventoryMapper;
    private final OrganizationMapper organizationMapper;
    private final WaybillStatusLogMapper statusLogMapper;
    private final TransportWaybillMapper transportWaybillMapper;

    @Override
    @Transactional
    public TransportTask createTask(Long routeId, Long vehicleId, List<Long> waybillIds, Long creatorId, String creatorName) {
        Route route = routeMapper.selectById(routeId);
        Vehicle vehicle = vehicleMapper.selectById(vehicleId);
        if (route == null || vehicle == null) {
            throw new RuntimeException("线路或车辆不存在");
        }

        // 查询运单并计算汇总
        List<Waybill> waybills = waybillMapper.selectBatchIds(waybillIds);
        BigDecimal totalWeight = waybills.stream().map(Waybill::getWeight).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalVolume = waybills.stream().map(Waybill::getVolume).reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalQuantity = waybills.stream().mapToInt(w -> w.getQuantity() != null ? w.getQuantity() : 0).sum();

        // 计算装载率（基于载重）
        BigDecimal loadRate = BigDecimal.ZERO;
        if (vehicle.getMaxWeight() != null && vehicle.getMaxWeight().compareTo(BigDecimal.ZERO) > 0) {
            loadRate = totalWeight.divide(vehicle.getMaxWeight(), 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }

        // 创建运输任务
        TransportTask task = new TransportTask();
        task.setTaskNo(generateTaskNo());
        task.setRouteId(routeId);
        task.setVehicleId(vehicleId);
        task.setStartOrgId(route.getStartOrgId());
        task.setEndOrgId(route.getEndOrgId());
        task.setWaybillCount(waybillIds.size());
        task.setTotalWeight(totalWeight);
        task.setTotalVolume(totalVolume);
        task.setTotalQuantity(totalQuantity);
        task.setLoadRate(loadRate);
        task.setStatus("待装车");
        task.setCreatorId(creatorId);
        task.setCreatorName(creatorName);
        transportTaskMapper.insert(task);

        // 创建配载关联记录 + 更新运单状态
        for (Waybill w : waybills) {
            // 配载关联
            TransportWaybill tw = new TransportWaybill();
            tw.setTransportTaskId(task.getId());
            tw.setWaybillId(w.getId());
            transportWaybillMapper.insert(tw);

            // 更新运单状态
            w.setStatus("已调度");
            w.setTransportTaskId(task.getId());
            waybillMapper.updateById(w);
        }

        return task;
    }

    @Override
    @Transactional
    public void confirmLoading(Long taskId) {
        TransportTask task = transportTaskMapper.selectById(taskId);
        if (task == null) throw new RuntimeException("任务不存在");
        task.setStatus("装车中");
        transportTaskMapper.updateById(task);

        // 更新关联运单状态
        updateWaybillsStatus(task, "装车中", "正在装车");
    }

    @Override
    @Transactional
    public void confirmDeparture(Long taskId) {
        TransportTask task = transportTaskMapper.selectById(taskId);
        if (task == null) throw new RuntimeException("任务不存在");
        task.setStatus("运输中");
        task.setDepartedAt(LocalDateTime.now());
        transportTaskMapper.updateById(task);

        // 更新车辆状态
        Vehicle vehicle = vehicleMapper.selectById(task.getVehicleId());
        if (vehicle != null) {
            vehicle.setStatus("运输中");
            vehicleMapper.updateById(vehicle);
        }

        // 更新关联运单状态为"运输中"
        updateWaybillsStatus(task, "运输中", "车辆已发车，运输中");

        // 发货库存出库：标记发站的发货库存为已出库
        LambdaQueryWrapper<Inventory> invQuery = new LambdaQueryWrapper<>();
        invQuery.eq(Inventory::getTransportTaskId, taskId)
                .eq(Inventory::getInventoryType, "发货库存")
                .eq(Inventory::getStatus, "待出库");
        List<Inventory> sendInvList = inventoryMapper.selectList(invQuery);
        for (Inventory inv : sendInvList) {
            inv.setStatus("已出库");
            inv.setOutboundAt(LocalDateTime.now());
            inventoryMapper.updateById(inv);
        }
    }

    @Override
    @Transactional
    public void confirmArrival(Long taskId) {
        TransportTask task = transportTaskMapper.selectById(taskId);
        if (task == null) throw new RuntimeException("任务不存在");

        LocalDateTime now = LocalDateTime.now();
        Organization endOrg = organizationMapper.selectById(task.getEndOrgId());
        String endOrgName = endOrg != null ? endOrg.getName() : "";

        // 更新任务状态
        task.setStatus("已到达");
        task.setArrivedAt(now);
        transportTaskMapper.updateById(task);

        // 更新车辆状态为空闲，并更新所在网点
        Vehicle vehicle = vehicleMapper.selectById(task.getVehicleId());
        if (vehicle != null) {
            vehicle.setStatus("空闲");
            vehicle.setCurrentOrgId(task.getEndOrgId());
            vehicleMapper.updateById(vehicle);
        }

        // 查询该任务关联的所有运单（通过配载关联表）
        LambdaQueryWrapper<TransportWaybill> twQuery = new LambdaQueryWrapper<>();
        twQuery.eq(TransportWaybill::getTransportTaskId, taskId);
        List<TransportWaybill> twList = transportWaybillMapper.selectList(twQuery);

        for (TransportWaybill tw : twList) {
            Waybill w = waybillMapper.selectById(tw.getWaybillId());
            if (w == null) continue;

            // 更新运单状态为"已到货"
            w.setStatus("已到货");
            w.setCurrentOrgId(task.getEndOrgId());
            w.setCurrentOrgName(endOrgName);
            waybillMapper.updateById(w);

            // 记录状态日志
            WaybillStatusLog log = new WaybillStatusLog();
            log.setWaybillId(w.getId());
            log.setStatus("已到货");
            log.setDescription("车辆到达" + endOrgName + "，货物自动入库（到货库存）");
            statusLogMapper.insert(log);

            // 创建到货库存记录
            Inventory inventory = new Inventory();
            inventory.setWaybillId(w.getId());
            inventory.setInventoryType("到货库存");
            inventory.setGoodsName(w.getGoodsName());
            inventory.setQuantity(w.getQuantity());
            inventory.setWeight(w.getWeight());
            inventory.setVolume(w.getVolume());
            inventory.setOrgId(task.getEndOrgId());
            inventory.setReceiverName(w.getReceiverName());
            inventory.setReceiverPhone(w.getReceiverPhone());
            inventory.setReceiverAddress(w.getReceiverAddress());
            inventory.setStatus("待出库");
            inventory.setTransportTaskId(taskId);
            inventory.setInboundAt(now);
            inventoryMapper.insert(inventory);
        }
    }

    @Override
    @Transactional
    public void assignWaybills(Long taskId, List<Long> waybillIds) {
        TransportTask task = transportTaskMapper.selectById(taskId);
        if (task == null) throw new RuntimeException("派车单不存在");
        if (!"待装车".equals(task.getStatus())) {
            throw new RuntimeException("只有待装车状态的派车单才能追加运单");
        }
        List<Waybill> waybills = waybillMapper.selectBatchIds(waybillIds);
        for (Waybill w : waybills) {
            if (!"待调度".equals(w.getStatus())) continue;
            TransportWaybill tw = new TransportWaybill();
            tw.setTransportTaskId(taskId);
            tw.setWaybillId(w.getId());
            transportWaybillMapper.insert(tw);
            w.setStatus("已调度");
            w.setTransportTaskId(taskId);
            waybillMapper.updateById(w);
        }
        // 重新统计汇总数据
        LambdaQueryWrapper<TransportWaybill> twQuery = new LambdaQueryWrapper<>();
        twQuery.eq(TransportWaybill::getTransportTaskId, taskId);
        List<TransportWaybill> allTw = transportWaybillMapper.selectList(twQuery);
        List<Long> allWaybillIds = allTw.stream().map(TransportWaybill::getWaybillId).toList();
        if (!allWaybillIds.isEmpty()) {
            List<Waybill> allWaybills = waybillMapper.selectBatchIds(allWaybillIds);
            BigDecimal totalWeight = allWaybills.stream().map(Waybill::getWeight)
                    .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalVolume = allWaybills.stream().map(Waybill::getVolume)
                    .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            int totalQuantity = allWaybills.stream().mapToInt(w -> w.getQuantity() != null ? w.getQuantity() : 0).sum();
            task.setWaybillCount(allWaybills.size());
            task.setTotalWeight(totalWeight);
            task.setTotalVolume(totalVolume);
            task.setTotalQuantity(totalQuantity);
            transportTaskMapper.updateById(task);
        }
    }

    @Override
    public IPage<TransportTask> page(int pageNum, int pageSize, String status, String keyword) {
        LambdaQueryWrapper<TransportTask> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            wrapper.eq(TransportTask::getStatus, status);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(TransportTask::getTaskNo, keyword));
        }
        wrapper.orderByDesc(TransportTask::getCreatedAt);
        return transportTaskMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public TransportTask getById(Long id) {
        return transportTaskMapper.selectById(id);
    }

    private void updateWaybillsStatus(TransportTask task, String status, String description) {
        // 通过配载关联表查询运单
        LambdaQueryWrapper<TransportWaybill> twQuery = new LambdaQueryWrapper<>();
        twQuery.eq(TransportWaybill::getTransportTaskId, task.getId());
        List<TransportWaybill> twList = transportWaybillMapper.selectList(twQuery);

        for (TransportWaybill tw : twList) {
            Waybill w = waybillMapper.selectById(tw.getWaybillId());
            if (w == null) continue;
            w.setStatus(status);
            waybillMapper.updateById(w);

            WaybillStatusLog log = new WaybillStatusLog();
            log.setWaybillId(w.getId());
            log.setStatus(status);
            log.setDescription(description);
            statusLogMapper.insert(log);
        }
    }

    private String generateTaskNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int random = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "TK" + date + random;
    }
}
