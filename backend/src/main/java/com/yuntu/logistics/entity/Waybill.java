package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_waybill")
public class Waybill {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String waybillNo;

    // 发货信息
    private Long senderCustomerId;
    private String senderName;
    private String senderPhone;
    private String senderAddress;

    // 收货信息
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;

    // 站点信息（参照T9：发站/中转地/到站）
    private Long originOrgId;
    private String originOrgName;
    private Long transitOrgId;
    private String transitOrgName;
    private Long destOrgId;
    private String destOrgName;

    // 货物信息
    private String goodsName;
    private String packingType;       // 包装类型：纸箱/木箱/编织袋/裸装/托盘/其他
    private Integer quantity;
    private BigDecimal weight;
    private BigDecimal volume;

    // 费用信息（参照T9：多种付款方式 + 运费明细）
    private String paymentMethod;     // 付款方式：现付/提付/回单付/月结/货款扣
    private BigDecimal freightFee;    // 运费合计
    private BigDecimal baseFreight;   // 基本运费
    private BigDecimal insuranceFee;  // 保险费
    private BigDecimal pickupFee;     // 接货费/提货费
    private BigDecimal deliveryFee;   // 送货费
    private BigDecimal packingFee;    // 包装费
    private BigDecimal otherFee;      // 其他费用

    // 代收货款（参照T9）
    private BigDecimal codAmount;     // 代收货款金额
    private String codStatus;         // 代收货款状态：无/待收/已收/已退

    // 回单要求
    private Integer receiptRequired;  // 是否需要回单：1-需要 0-不需要
    private Integer receiptCount;     // 回单份数

    // 交接方式
    private String deliveryMethod;    // 交接方式：自提/送货上门/代理中转

    // 状态
    private String status;            // 运单状态
    private String receiptStatus;     // 回单状态

    // 位置与操作
    private Long currentOrgId;
    private String currentOrgName;
    private Long transportTaskId;
    private Long creatorId;
    private String creatorName;

    // 签收信息
    private LocalDateTime signedAt;
    private String signerName;
    private String signRemark;

    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
