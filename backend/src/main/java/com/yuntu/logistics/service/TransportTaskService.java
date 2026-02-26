package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.entity.TransportTask;
import java.util.List;

public interface TransportTaskService {
    /** 创建运输任务（调度） */
    TransportTask createTask(Long routeId, Long vehicleId, List<Long> waybillIds, Long creatorId, String creatorName);

    /** 确认装车 */
    void confirmLoading(Long taskId);

    /** 确认发车 */
    void confirmDeparture(Long taskId);

    /** 车辆到达 - 一键入库：整车货物自动变为落点待出库库存 */
    void confirmArrival(Long taskId);

    /** 分页查询 */
    IPage<TransportTask> page(int pageNum, int pageSize, String status, String keyword);

    /** 根据ID查询详情 */
    TransportTask getById(Long id);
}
