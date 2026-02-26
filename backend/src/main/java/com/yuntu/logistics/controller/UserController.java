package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    /** 分页查询用户 */
    @GetMapping
    public Result<IPage<User>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(role)) wrapper.eq(User::getRole, role);
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(User::getUsername, keyword)
                .or().like(User::getFullName, keyword)
                .or().like(User::getPhone, keyword));
        }
        wrapper.orderByDesc(User::getCreatedAt);
        IPage<User> result = userMapper.selectPage(new Page<>(page, size), wrapper);
        // 清除密码字段
        result.getRecords().forEach(u -> u.setPassword(null));
        return Result.success(result);
    }

    /** 获取用户详情 */
    @GetMapping("/{id}")
    public Result<User> detail(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        if (user != null) user.setPassword(null);
        return Result.success(user);
    }

    /** 创建用户 */
    @PostMapping
    public Result<User> create(@RequestBody User user) {
        // 检查用户名是否已存在
        User existing = userMapper.findByUsername(user.getUsername());
        if (existing != null) return Result.error("用户名已存在");

        // 加密密码，默认密码为 123456
        String rawPassword = StringUtils.hasText(user.getPassword()) ? user.getPassword() : "123456";
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setStatus(1);
        userMapper.insert(user);
        user.setPassword(null);
        return Result.success(user);
    }

    /** 更新用户 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody User user) {
        User existing = userMapper.selectById(id);
        if (existing == null) return Result.error("用户不存在");

        existing.setFullName(user.getFullName());
        existing.setPhone(user.getPhone());
        existing.setRole(user.getRole());
        existing.setOrgId(user.getOrgId());
        if (user.getStatus() != null) existing.setStatus(user.getStatus());
        userMapper.updateById(existing);
        return Result.success(null);
    }

    /** 重置密码 */
    @PutMapping("/{id}/reset-password")
    public Result<Void> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");
        String newPassword = body.getOrDefault("password", "123456");
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
        return Result.success(null);
    }

    /** 删除用户 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userMapper.deleteById(id);
        return Result.success(null);
    }
}
