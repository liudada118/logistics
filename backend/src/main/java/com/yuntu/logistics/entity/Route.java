package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_route")
public class Route {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private Long startOrgId;
    private Long endOrgId;
    private BigDecimal distance;
    private BigDecimal estimatedHours;
    private Integer status; // 1-启用 0-停用
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // 非数据库字段
    @TableField(exist = false)
    private String startOrgName;
    @TableField(exist = false)
    private String endOrgName;
}
