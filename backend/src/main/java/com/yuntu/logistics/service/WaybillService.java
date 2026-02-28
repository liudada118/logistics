package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.dto.WaybillCreateRequest;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.entity.WaybillStatusLog;
import com.yuntu.logistics.entity.User;

import java.util.List;

public interface WaybillService {
    Waybill createWaybill(WaybillCreateRequest request, User currentUser);
    Waybill getWaybillById(Long id);
    IPage<Waybill> listWaybills(int page, int size, String status, String keyword);
    void updateWaybill(Long id, WaybillCreateRequest request);
    void deleteWaybill(Long id);
    void updateReceiptStatus(Long id, String receiptStatus, User currentUser);
    void updateStatus(Long id, String status, String description, User currentUser);
    List<WaybillStatusLog> getStatusLogs(Long waybillId);
}
