package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.*;
import com.yuntu.logistics.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final WaybillMapper waybillMapper;
    private final TransportTaskMapper transportTaskMapper;
    private final InventoryMapper inventoryMapper;
    private final FinanceRecordMapper financeRecordMapper;
    private final AlertMapper alertMapper;
    private final VehicleMapper vehicleMapper;
    private final CustomerMapper customerMapper;

    /**
     * 经营数据驾驶舱 - 核心指标概览
     */
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        Map<String, Object> data = new HashMap<>();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);

        // 今日运单数
        long todayWaybills = waybillMapper.selectCount(
            new LambdaQueryWrapper<Waybill>().between(Waybill::getCreatedAt, todayStart, todayEnd));
        data.put("todayWaybills", todayWaybills);

        // 总运单数
        long totalWaybills = waybillMapper.selectCount(null);
        data.put("totalWaybills", totalWaybills);

        // 各状态运单数
        Map<String, Long> waybillStatusCounts = new HashMap<>();
        for (String status : List.of("待调度", "已调度", "运输中", "已到货", "派送中", "已签收", "异常")) {
            long count = waybillMapper.selectCount(
                new LambdaQueryWrapper<Waybill>().eq(Waybill::getStatus, status));
            waybillStatusCounts.put(status, count);
        }
        data.put("waybillStatusCounts", waybillStatusCounts);

        // 运输中任务数
        long inTransitTasks = transportTaskMapper.selectCount(
            new LambdaQueryWrapper<TransportTask>().in(TransportTask::getStatus, "运输中", "已发车"));
        data.put("inTransitTasks", inTransitTasks);

        // 待出库库存数
        long pendingInventory = inventoryMapper.selectCount(
            new LambdaQueryWrapper<Inventory>().eq(Inventory::getStatus, "待出库"));
        data.put("pendingInventory", pendingInventory);

        // 未处理预警数
        int unhandledAlerts = alertMapper.countUnhandled();
        data.put("unhandledAlerts", unhandledAlerts);

        // 今日运费总额
        LambdaQueryWrapper<Waybill> todayFeeQuery = new LambdaQueryWrapper<>();
        todayFeeQuery.between(Waybill::getCreatedAt, todayStart, todayEnd);
        List<Waybill> todayWaybillList = waybillMapper.selectList(todayFeeQuery);
        BigDecimal todayRevenue = todayWaybillList.stream()
            .map(Waybill::getFreightFee)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.put("todayRevenue", todayRevenue);

        // 总运费
        List<Waybill> allWaybills = waybillMapper.selectList(null);
        BigDecimal totalRevenue = allWaybills.stream()
            .map(Waybill::getFreightFee)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.put("totalRevenue", totalRevenue);

        // 车辆状态统计
        Map<String, Long> vehicleStatusCounts = new HashMap<>();
        for (String status : List.of("空闲", "运输中", "维修中", "停用")) {
            long count = vehicleMapper.selectCount(
                new LambdaQueryWrapper<Vehicle>().eq(Vehicle::getStatus, status));
            vehicleStatusCounts.put(status, count);
        }
        data.put("vehicleStatusCounts", vehicleStatusCounts);

        // 客户总数
        long totalCustomers = customerMapper.selectCount(null);
        data.put("totalCustomers", totalCustomers);

        return Result.success(data);
    }

    /**
     * 最近7天运单趋势
     */
    @GetMapping("/waybill-trend")
    public Result<List<Map<String, Object>>> waybillTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            long count = waybillMapper.selectCount(
                new LambdaQueryWrapper<Waybill>().between(Waybill::getCreatedAt, start, end));

            // 当天运费总额
            List<Waybill> dayWaybills = waybillMapper.selectList(
                new LambdaQueryWrapper<Waybill>().between(Waybill::getCreatedAt, start, end));
            BigDecimal dayRevenue = dayWaybills.stream()
                .map(Waybill::getFreightFee)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> item = new HashMap<>();
            item.put("date", date.toString());
            item.put("count", count);
            item.put("revenue", dayRevenue);
            trend.add(item);
        }
        return Result.success(trend);
    }

    /**
     * 网点运营数据
     */
    @GetMapping("/org-stats")
    public Result<List<Map<String, Object>>> orgStats() {
        // 简化实现：按当前网点统计运单数和运费
        List<Map<String, Object>> stats = new ArrayList<>();
        List<Waybill> allWaybills = waybillMapper.selectList(null);

        Map<String, List<Waybill>> byOrg = new HashMap<>();
        for (Waybill w : allWaybills) {
            String orgName = w.getCurrentOrgName() != null ? w.getCurrentOrgName() : "未知";
            byOrg.computeIfAbsent(orgName, k -> new ArrayList<>()).add(w);
        }

        for (Map.Entry<String, List<Waybill>> entry : byOrg.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("orgName", entry.getKey());
            item.put("waybillCount", entry.getValue().size());
            BigDecimal revenue = entry.getValue().stream()
                .map(Waybill::getFreightFee)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            item.put("revenue", revenue);
            stats.add(item);
        }
        return Result.success(stats);
    }
}
