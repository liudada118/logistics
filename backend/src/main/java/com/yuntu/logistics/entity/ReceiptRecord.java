package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("biz_receipt_record")
public class ReceiptRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long waybillId;
    private String waybillNo;
    private String action;           // 签收/寄出/收到/返厂/反签收/反寄出/反收回/取消返厂
    private Integer receiptCount;
    private String expressNo;        // 快递单号（寄出时填写）
    private String remark;
    private Long operatorId;
    private String operatorName;
    private Long orgId;
    private LocalDateTime createdAt;
}
