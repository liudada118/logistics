package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.TransportTask;
import com.yuntu.logistics.service.TransportTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport-tasks")
@RequiredArgsConstructor
public class TransportTaskController {

    private final TransportTaskService transportTaskService;

    /** 创建运输任务 */
    @PostMapping
    public Result<TransportTask> create(@RequestBody Map<String, Object> body) {
        Long routeId = Long.valueOf(body.get("routeId").toString());
        Long vehicleId = Long.valueOf(body.get("vehicleId").toString());
        @SuppressWarnings("unchecked")
        List<Long> waybillIds = ((List<Number>) body.get("waybillIds")).stream().map(Number::longValue).toList();
        // 实际项目中从 SecurityContext 获取当前用户
        Long creatorId = body.containsKey("creatorId") ? Long.valueOf(body.get("creatorId").toString()) : 1L;
        String creatorName = body.containsKey("creatorName") ? body.get("creatorName").toString() : "系统管理员";

        TransportTask task = transportTaskService.createTask(routeId, vehicleId, waybillIds, creatorId, creatorName);
        return Result.success(task);
    }

    /** 确认装车 */
    @PutMapping("/{id}/loading")
    public Result<Void> confirmLoading(@PathVariable Long id) {
        transportTaskService.confirmLoading(id);
        return Result.success(null);
    }

    /** 确认发车 */
    @PutMapping("/{id}/depart")
    public Result<Void> confirmDeparture(@PathVariable Long id) {
        transportTaskService.confirmDeparture(id);
        return Result.success(null);
    }

    /** 车辆到达 - 一键入库 */
    @PutMapping("/{id}/arrive")
    public Result<Void> confirmArrival(@PathVariable Long id) {
        transportTaskService.confirmArrival(id);
        return Result.success(null);
    }

    /** 分页查询 */
    @GetMapping
    public Result<IPage<TransportTask>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return Result.success(transportTaskService.page(page, size, status, keyword));
    }

    /** 查询详情 */
    @GetMapping("/{id}")
    public Result<TransportTask> detail(@PathVariable Long id) {
        return Result.success(transportTaskService.getById(id));
    }
}
