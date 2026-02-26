package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_vehicle")
public class Vehicle {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String plateNo;
    private String type;
    private BigDecimal maxWeight;
    private BigDecimal maxVolume;
    private String driverName;
    private String driverPhone;
    private String status; // 空闲/运输中/维修中/停用
    private Long currentOrgId;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
