package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("biz_transport_task")
public class TransportTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String taskNo;
    private Long routeId;
    private Long vehicleId;
    private Long startOrgId;
    private Long endOrgId;
    private Integer waybillCount;
    private BigDecimal totalWeight;
    private BigDecimal totalVolume;
    private Integer totalQuantity;     // 总件数
    private BigDecimal loadRate;       // 装载率(%)
    private String status; // 待装车/装车中/已发车/运输中/已到达/已完成/异常
    private Long creatorId;
    private String creatorName;
    private LocalDateTime departedAt;
    private LocalDateTime arrivedAt;
    private String sealNo;             // 封签号
    private String remark;             // 备注
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // 非数据库字段
    @TableField(exist = false)
    private String routeName;
    @TableField(exist = false)
    private String vehiclePlateNo;
    @TableField(exist = false)
    private String driverName;
    @TableField(exist = false)
    private String driverPhone;
    @TableField(exist = false)
    private String startOrgName;
    @TableField(exist = false)
    private String endOrgName;
    @TableField(exist = false)
    private List<Long> waybillIds;
}
