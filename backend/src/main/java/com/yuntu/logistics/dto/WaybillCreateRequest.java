package com.yuntu.logistics.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class WaybillCreateRequest {
    // 发货信息
    private Long senderCustomerId;
    @NotBlank(message = "发货方名称不能为空")
    private String senderName;
    private String senderPhone;
    private String senderAddress;

    // 收货信息
    @NotBlank(message = "收货人不能为空")
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;

    // 站点信息（发站/中转地/到站）
    private Long originOrgId;
    private String originOrgName;
    private Long transitOrgId;
    private String transitOrgName;
    private Long destOrgId;
    private String destOrgName;

    // 货物信息
    @NotBlank(message = "货物名称不能为空")
    private String goodsName;
    private String packingType = "纸箱";
    private Integer quantity = 1;
    private BigDecimal weight = BigDecimal.ZERO;
    private BigDecimal volume = BigDecimal.ZERO;

    // 费用信息
    private String paymentMethod = "现付";
    private BigDecimal freightFee = BigDecimal.ZERO;
    private BigDecimal baseFreight = BigDecimal.ZERO;
    private BigDecimal insuranceFee = BigDecimal.ZERO;
    private BigDecimal pickupFee = BigDecimal.ZERO;
    private BigDecimal deliveryFee = BigDecimal.ZERO;
    private BigDecimal packingFee = BigDecimal.ZERO;
    private BigDecimal otherFee = BigDecimal.ZERO;

    // 代收货款
    private BigDecimal codAmount = BigDecimal.ZERO;

    // 回单要求
    private Integer receiptRequired = 0;
    private Integer receiptCount = 0;

    // 交接方式
    private String deliveryMethod = "自提";

    private String remark = "";
}
