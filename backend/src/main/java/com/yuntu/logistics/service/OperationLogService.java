package com.yuntu.logistics.service;

import com.yuntu.logistics.entity.OperationLog;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogMapper operationLogMapper;

    public void log(String module, String action, String description, Long targetId, String targetType, User operator) {
        OperationLog log = new OperationLog();
        log.setModule(module);
        log.setAction(action);
        log.setDescription(description);
        log.setTargetId(targetId);
        log.setTargetType(targetType);
        if (operator != null) {
            log.setOperatorId(operator.getId());
            log.setOperatorName(operator.getFullName());
        }
        operationLogMapper.insert(log);
    }

    public void log(String module, String action, String description) {
        log(module, action, description, null, null, null);
    }
}
