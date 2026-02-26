package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_inventory")
public class Inventory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long waybillId;
    private String inventoryType;   // 发货库存/到货库存
    private String goodsName;
    private Integer quantity;
    private BigDecimal weight;
    private BigDecimal volume;
    private Long orgId;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String status; // 待出库/已出库/异常
    private Long transportTaskId;
    private LocalDateTime inboundAt;
    private LocalDateTime outboundAt;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // 非数据库字段
    @TableField(exist = false)
    private String waybillNo;
    @TableField(exist = false)
    private String orgName;
}
