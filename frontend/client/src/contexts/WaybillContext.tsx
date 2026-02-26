import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { mockWaybills, mockStatusLogs, generateWaybillNo, type Waybill, type WaybillStatusLog } from '@/lib/mock-data';
import { waybillApi } from '@/lib/api';

interface WaybillContextType {
  waybills: Waybill[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (p: number) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  keyword: string;
  setKeyword: (k: string) => void;
  getWaybill: (id: number) => Waybill | undefined;
  fetchWaybillById: (id: number) => Promise<Waybill | null>;
  getStatusLogs: (waybillId: number) => WaybillStatusLog[];
  fetchStatusLogs: (waybillId: number) => Promise<WaybillStatusLog[]>;
  createWaybill: (data: any) => Promise<Waybill>;
  updateWaybill: (id: number, data: any) => Promise<void>;
  deleteWaybill: (id: number) => Promise<void>;
  updateReceiptStatus: (id: number, status: string) => Promise<void>;
  refresh: () => void;
  useApi: boolean;
}

const WaybillContext = createContext<WaybillContextType | undefined>(undefined);

export function WaybillProvider({ children }: { children: ReactNode }) {
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusLogs, setStatusLogs] = useState<Record<number, WaybillStatusLog[]>>(mockStatusLogs);
  const [useApi, setUseApi] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // 加载运单列表
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await waybillApi.list({ page, size: 20, status: statusFilter || undefined, keyword: keyword || undefined });
        if (!cancelled) {
          setWaybills(result.records);
          setTotal(result.total);
          setUseApi(true);
        }
      } catch {
        // API不可用时降级到mock
        if (!cancelled) {
          setWaybills(mockWaybills);
          setTotal(mockWaybills.length);
          setUseApi(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, statusFilter, keyword, refreshKey]);

  const getWaybill = useCallback((id: number) => {
    return waybills.find(w => w.id === id);
  }, [waybills]);

  const fetchWaybillById = useCallback(async (id: number): Promise<Waybill | null> => {
    try {
      return await waybillApi.get(id);
    } catch {
      return waybills.find(w => w.id === id) || null;
    }
  }, [waybills]);

  const getStatusLogs = useCallback((waybillId: number) => {
    return statusLogs[waybillId] || [];
  }, [statusLogs]);

  const fetchStatusLogs = useCallback(async (waybillId: number): Promise<WaybillStatusLog[]> => {
    try {
      const logs = await waybillApi.getLogs(waybillId);
      setStatusLogs(prev => ({ ...prev, [waybillId]: logs }));
      return logs;
    } catch {
      return statusLogs[waybillId] || [];
    }
  }, [statusLogs]);

  const createWaybill = useCallback(async (data: any): Promise<Waybill> => {
    try {
      const result = await waybillApi.create(data);
      refresh();
      return result;
    } catch {
      // mock降级
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
      const newWaybill: Waybill = {
        ...data,
        id: Math.max(0, ...waybills.map(w => w.id)) + 1,
        waybillNo: generateWaybillNo(),
        status: '待调度',
        receiptStatus: '待寄出',
        currentOrgName: '广州分拨中心',
        creatorName: '当前用户',
        createdAt: now,
        updatedAt: now,
      };
      setWaybills(prev => [newWaybill, ...prev]);
      return newWaybill;
    }
  }, [waybills, refresh]);

  const updateWaybill = useCallback(async (id: number, data: any): Promise<void> => {
    try {
      await waybillApi.update(id, data);
      refresh();
    } catch {
      setWaybills(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    }
  }, [refresh]);

  const deleteWaybill = useCallback(async (id: number): Promise<void> => {
    try {
      await waybillApi.delete(id);
      refresh();
    } catch {
      setWaybills(prev => prev.filter(w => w.id !== id));
    }
  }, [refresh]);

  const updateReceiptStatus = useCallback(async (id: number, status: string): Promise<void> => {
    try {
      await waybillApi.updateReceipt(id, status);
      refresh();
    } catch {
      setWaybills(prev => prev.map(w => w.id === id ? { ...w, receiptStatus: status as any } : w));
    }
  }, [refresh]);

  return (
    <WaybillContext.Provider value={{ waybills, total, loading, page, setPage, statusFilter, setStatusFilter, keyword, setKeyword, getWaybill, fetchWaybillById, getStatusLogs, fetchStatusLogs, createWaybill, updateWaybill, deleteWaybill, updateReceiptStatus, refresh, useApi }}>
      {children}
    </WaybillContext.Provider>
  );
}

export function useWaybills() {
  const context = useContext(WaybillContext);
  if (!context) throw new Error('useWaybills must be used within WaybillProvider');
  return context;
}
