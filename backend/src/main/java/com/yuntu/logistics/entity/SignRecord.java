package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("biz_sign_record")
public class SignRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long waybillId;
    private String waybillNo;
    private String signType;         // 本人签收/代签/拒签/部分签收
    private String signerName;
    private String signerPhone;
    private Integer signQuantity;
    private Integer damageQuantity;
    private Integer shortageQuantity;
    private String signRemark;
    private String deliveryMethod;   // 自提/送货上门/代理中转
    private Long orgId;
    private String orgName;
    private Long operatorId;
    private String operatorName;
    private LocalDateTime signedAt;
    private LocalDateTime createdAt;
}
