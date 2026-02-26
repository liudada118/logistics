// 仓储/库存管理
// 功能：查看各落点库存、待出库货物管理、确认出库
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { inventoryApi } from '@/lib/api';
import { mockInventory, mockOrganizations, type InventoryItem, type InventoryStatus } from '@/lib/mock-data';
import { Search, Warehouse, Package, ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<InventoryStatus, string> = {
  '待出库': 'bg-amber-100 text-amber-700',
  '已出库': 'bg-emerald-100 text-emerald-700',
  '异常': 'bg-red-100 text-red-700',
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.list({
        page: 1, size: 200,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        keyword: search || undefined,
      });
      setItems(res.records || []);
    } catch {
      setItems(mockInventory);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const orgsWithInventory = Array.from(new Set(items.map(i => i.orgName)));

  const filtered = items.filter(i => {
    const matchSearch = !search || i.waybillNo?.includes(search) || i.goodsName?.includes(search) || i.receiverName?.includes(search);
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchOrg = orgFilter === 'all' || i.orgName === orgFilter;
    const matchType = typeFilter === 'all' || (i as any).inventoryType === typeFilter;
    return matchSearch && matchStatus && matchOrg && matchType;
  });

  const pendingCount = items.filter(i => i.status === '待出库').length;
  const outboundCount = items.filter(i => i.status === '已出库').length;
  const totalWeight = items.filter(i => i.status === '待出库').reduce((s, i) => s + (i.weight || 0), 0);

  const handleOutbound = async (id: number) => {
    try {
      await inventoryApi.outbound(id);
      toast.success('出库操作成功');
      loadData();
    } catch {
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: '已出库' as const, outboundAt: now } : i));
      toast.success('出库操作成功');
    }
  };

  const handleBatchOutbound = async () => {
    const pendingIds = filtered.filter(i => i.status === '待出库').map(i => i.id);
    if (pendingIds.length === 0) { toast.error('没有待出库的货物'); return; }
    try {
      await inventoryApi.batchOutbound(pendingIds);
      toast.success(`批量出库成功，共 ${pendingIds.length} 件`);
      loadData();
    } catch {
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
      setItems(prev => prev.map(i => pendingIds.includes(i.id) ? { ...i, status: '已出库' as const, outboundAt: now } : i));
      toast.success(`批量出库成功，共 ${pendingIds.length} 件`);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">库存管理</h1>
          </div>
          <Button size="sm" variant="outline" onClick={handleBatchOutbound}>
            <ArrowUpRight className="w-4 h-4 mr-1" />批量出库
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">待出库</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">件</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">已出库</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{outboundCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">件</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">库存总重</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalWeight.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">kg (待出库)</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">涉及网点</div>
            <div className="text-2xl font-bold text-foreground mt-1">{orgsWithInventory.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">个</div>
          </div>
        </div>

        {/* 筛选 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索运单号/货物/收货人" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="待出库">待出库</SelectItem>
              <SelectItem value="已出库">已出库</SelectItem>
              <SelectItem value="异常">异常</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="发货库存">发货库存</SelectItem>
              <SelectItem value="到货库存">到货库存</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部网点</SelectItem>
              {orgsWithInventory.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 库存列表 */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">库存类型</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">运单号</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">货物名称</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">数量</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">重量(kg)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">所在网点</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">收货人</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">入库时间</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">暂无库存记录</td></tr>
                )}
                {!loading && filtered.map(item => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${(item as any).inventoryType === '发货库存' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {(item as any).inventoryType || '发货库存'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground text-xs">{item.waybillNo}</td>
                    <td className="px-4 py-3 font-medium">{item.goodsName}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{item.weight}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{item.orgName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{item.receiverName}</td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground hidden md:table-cell">{item.inboundAt}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[item.status] || 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.status === '待出库' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleOutbound(item.id)}>
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />出库
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setDetailItem(item); setDetailOpen(true); }}>详情</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>库存详情</DialogTitle>
            <DialogDescription>查看货物的详细信息和收货人信息</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">运单号</span><div className="mt-0.5 font-mono font-medium">{detailItem.waybillNo}</div></div>
                <div><span className="text-muted-foreground">状态</span><div className="mt-0.5"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[detailItem.status] || 'bg-gray-100 text-gray-600'}`}>{detailItem.status}</span></div></div>
                <div><span className="text-muted-foreground">货物名称</span><div className="mt-0.5 font-medium">{detailItem.goodsName}</div></div>
                <div><span className="text-muted-foreground">数量</span><div className="mt-0.5">{detailItem.quantity} 件</div></div>
                <div><span className="text-muted-foreground">重量</span><div className="mt-0.5">{detailItem.weight} kg</div></div>
                <div><span className="text-muted-foreground">体积</span><div className="mt-0.5">{detailItem.volume} m³</div></div>
                <div><span className="text-muted-foreground">所在网点</span><div className="mt-0.5">{detailItem.orgName}</div></div>
                <div><span className="text-muted-foreground">入库时间</span><div className="mt-0.5 text-xs">{detailItem.inboundAt}</div></div>
                {detailItem.outboundAt && <div><span className="text-muted-foreground">出库时间</span><div className="mt-0.5 text-xs">{detailItem.outboundAt}</div></div>}
              </div>

              <div className="border-t border-border pt-3">
                <div className="text-sm font-medium text-foreground mb-2">收货人信息</div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />{detailItem.receiverName}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />{detailItem.receiverPhone}
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{detailItem.receiverAddress}
                  </div>
                </div>
              </div>

              {detailItem.status === '待出库' && (
                <Button className="w-full" onClick={() => { handleOutbound(detailItem.id); setDetailItem({ ...detailItem, status: '已出库' }); }}>
                  <ArrowUpRight className="w-4 h-4 mr-1" />确认出库
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
