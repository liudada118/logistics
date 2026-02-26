package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.*;
import com.yuntu.logistics.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BaseDataController {

    private final OrganizationMapper organizationMapper;
    private final RouteMapper routeMapper;
    private final VehicleMapper vehicleMapper;
    private final CustomerMapper customerMapper;

    // ==================== 网点管理 ====================

    @GetMapping("/organizations")
    public Result<IPage<Organization>> listOrgs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Organization> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Organization::getName, keyword).or().like(Organization::getAddress, keyword);
        }
        wrapper.orderByAsc(Organization::getId);
        return Result.success(organizationMapper.selectPage(new Page<>(page, size), wrapper));
    }

    @GetMapping("/organizations/all")
    public Result<List<Organization>> allOrgs() {
        return Result.success(organizationMapper.selectList(new LambdaQueryWrapper<Organization>().eq(Organization::getStatus, 1)));
    }

    @PostMapping("/organizations")
    public Result<Organization> createOrg(@RequestBody Organization org) {
        organizationMapper.insert(org);
        return Result.success(org);
    }

    @PutMapping("/organizations/{id}")
    public Result<Void> updateOrg(@PathVariable Long id, @RequestBody Organization org) {
        org.setId(id);
        organizationMapper.updateById(org);
        return Result.success(null);
    }

    @DeleteMapping("/organizations/{id}")
    public Result<Void> deleteOrg(@PathVariable Long id) {
        organizationMapper.deleteById(id);
        return Result.success(null);
    }

    // ==================== 线路管理 ====================

    @GetMapping("/routes")
    public Result<IPage<Route>> listRoutes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Route> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Route::getName, keyword);
        }
        wrapper.orderByDesc(Route::getCreatedAt);
        return Result.success(routeMapper.selectPage(new Page<>(page, size), wrapper));
    }

    @GetMapping("/routes/all")
    public Result<List<Route>> allRoutes() {
        return Result.success(routeMapper.selectList(new LambdaQueryWrapper<Route>().eq(Route::getStatus, 1)));
    }

    @PostMapping("/routes")
    public Result<Route> createRoute(@RequestBody Route route) {
        routeMapper.insert(route);
        return Result.success(route);
    }

    @PutMapping("/routes/{id}")
    public Result<Void> updateRoute(@PathVariable Long id, @RequestBody Route route) {
        route.setId(id);
        routeMapper.updateById(route);
        return Result.success(null);
    }

    @DeleteMapping("/routes/{id}")
    public Result<Void> deleteRoute(@PathVariable Long id) {
        routeMapper.deleteById(id);
        return Result.success(null);
    }

    // ==================== 车辆管理 ====================

    @GetMapping("/vehicles")
    public Result<IPage<Vehicle>> listVehicles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Vehicle> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) wrapper.eq(Vehicle::getStatus, status);
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Vehicle::getPlateNo, keyword).or().like(Vehicle::getDriverName, keyword));
        }
        wrapper.orderByDesc(Vehicle::getCreatedAt);
        return Result.success(vehicleMapper.selectPage(new Page<>(page, size), wrapper));
    }

    @GetMapping("/vehicles/available")
    public Result<List<Vehicle>> availableVehicles() {
        return Result.success(vehicleMapper.selectList(new LambdaQueryWrapper<Vehicle>().eq(Vehicle::getStatus, "空闲")));
    }

    @PostMapping("/vehicles")
    public Result<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        vehicleMapper.insert(vehicle);
        return Result.success(vehicle);
    }

    @PutMapping("/vehicles/{id}")
    public Result<Void> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        vehicle.setId(id);
        vehicleMapper.updateById(vehicle);
        return Result.success(null);
    }

    @DeleteMapping("/vehicles/{id}")
    public Result<Void> deleteVehicle(@PathVariable Long id) {
        vehicleMapper.deleteById(id);
        return Result.success(null);
    }

    // ==================== 客户管理 ====================

    @GetMapping("/customers")
    public Result<IPage<Customer>> listCustomers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Customer> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Customer::getName, keyword).or().like(Customer::getContactPerson, keyword);
        }
        wrapper.orderByDesc(Customer::getCreatedAt);
        return Result.success(customerMapper.selectPage(new Page<>(page, size), wrapper));
    }

    @PostMapping("/customers")
    public Result<Customer> createCustomer(@RequestBody Customer customer) {
        customerMapper.insert(customer);
        return Result.success(customer);
    }

    @PutMapping("/customers/{id}")
    public Result<Void> updateCustomer(@PathVariable Long id, @RequestBody Customer customer) {
        customer.setId(id);
        customerMapper.updateById(customer);
        return Result.success(null);
    }

    @DeleteMapping("/customers/{id}")
    public Result<Void> deleteCustomer(@PathVariable Long id) {
        customerMapper.deleteById(id);
        return Result.success(null);
    }
}
