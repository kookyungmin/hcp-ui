"use client";

import Image from "next/image";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { SERVICE_CATEGORIES } from "@/shared/constants/service-catalog";
import { useAuthStore } from "@/shared/stores/auth.store";
import { hasServicePermission } from "@/shared/lib/permission";
import { getAccessToken, setAccessToken } from "@/shared/lib/access-token";
import { refreshTokenApi } from "@/shared/api/auth.api";
import { getInstanceListApi, getInstanceMetaAllApi, provisionInstanceApi, restartInstanceApi, stopInstanceApi, terminateInstanceApi, getInstanceInfoApi, updateInstanceTagsApi, updateInstanceSpecApi } from "@/shared/api/instance.api";
import { useToastStore } from "@/shared/stores/toast.store";
import type { InstanceInfo } from "@/shared/types/instance";
import type { GenerateInstanceRequest, InstanceMeta, InstanceStatus } from "@/shared/types/instance";

function CategoryIcon({ id }: { id: string }) {
  switch (id) {
    case "compute":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="14" height="9" rx="1.8" />
          <path d="M7 16h6" />
        </svg>
      );
    case "database":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="10" cy="5" rx="4.5" ry="2" />
          <path d="M5.5 5v6c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V5" />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2.5" y="3" width="5" height="5" rx="1.2" />
          <rect x="12.5" y="3" width="5" height="5" rx="1.2" />
          <rect x="7.5" y="12" width="5" height="5" rx="1.2" />
          <path d="M7.5 5.5h5M10 8v4" />
        </svg>
      );
    case "storage":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m3 6 7-3 7 3-7 3-7-3Z" />
          <path d="m3 10 7 3 7-3M3 13.5l7 3 7-3" />
        </svg>
      );
    case "security":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 2.5 4.5 5v4.6c0 3.2 2.1 5.9 5.5 7 3.4-1.1 5.5-3.8 5.5-7V5L10 2.5Z" />
          <path d="M8.3 10.1 9.6 11.4l2.4-2.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 15V5M8 15V8M13 15v-4M18 15V3" />
        </svg>
      );
  }
}

type ServerInstance = {
  instanceId: string;
  name: string;
  status: InstanceStatus;
  tags: string[];
  osName: string;
  osVersion: string;
  cpuCores: number;
  memorySize: string; // keep original unit like "256Mi"
  storageSizeGb: number;
  publicIp: string;
  privateIp: string;
  vpcName: string;
};

// NOTE: Replaced by live API fetching; keeping structure reference only.
// const MOCK_INSTANCES: ServerInstance[] = [];

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function ConsolePage() {
  const SIDEBAR_COLLAPSE_BREAKPOINT = 1500;
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useAuthStore((state) => state.loginUser);
  const initialized = useAuthStore((state) => state.initialized);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const logout = useAuthStore((state) => state.logout);

  const [activeCategoryId, setActiveCategoryId] = useState("compute");
  const [activeServiceId, setActiveServiceId] = useState("server");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT : false
  );
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() =>
    SERVICE_CATEGORIES.reduce<Record<string, boolean>>((acc, category) => {
      acc[category.id] = false;
      return acc;
    }, {})
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [operationDropdownOpen, setOperationDropdownOpen] = useState(false);
  const [instanceMeta, setInstanceMeta] = useState<InstanceMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaLoadError, setMetaLoadError] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedImageCode, setSelectedImageCode] = useState("");
  const [selectedSpecCode, setSelectedSpecCode] = useState("");
  const [selectedVpcCode, setSelectedVpcCode] = useState("");
  const [storageType, setStorageType] = useState<"HDD" | "SSD">("HDD");
  const [storageSize, setStorageSize] = useState(50);
  const [storageSizeInput, setStorageSizeInput] = useState<string>("50");
  const [createFormErrors, setCreateFormErrors] = useState<{ instanceName?: string; storageSize?: string }>({});
  const [createRequesting, setCreateRequesting] = useState(false);
  const [createRequestError, setCreateRequestError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const profileWrapperRef = useRef<HTMLDivElement | null>(null);
  const operationDropdownRef = useRef<HTMLDivElement | null>(null);
  const createSubmitLockRef = useRef(false);
  const readPermissionDeniedRef = useRef(false);
  const [instances, setInstances] = useState<ServerInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [instancesLoadError, setInstancesLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Idempotency keys per instance and action (stable until list reload)
  const [stopKeys, setStopKeys] = useState<Record<string, string>>({});
  const [restartKeys, setRestartKeys] = useState<Record<string, string>>({});
  const [terminateKeys, setTerminateKeys] = useState<Record<string, string>>({});
  const [specUpdateKeys, setSpecUpdateKeys] = useState<Record<string, string>>({});
  const firstReadableTarget = useMemo(() => {
    for (const category of SERVICE_CATEGORIES) {
      for (const service of category.services) {
        if (hasServicePermission(loginUser?.roles, category.id, service.id, "read")) {
          return { categoryId: category.id, serviceId: service.id };
        }
      }
    }

    return null;
  }, [loginUser?.roles]);
  const fallbackTarget = firstReadableTarget ?? { categoryId: "compute", serviceId: "server" };
  const canReadService = hasServicePermission(loginUser?.roles, activeCategoryId, activeServiceId, "read");
  const canExecuteService = hasServicePermission(loginUser?.roles, activeCategoryId, activeServiceId, "execute");
  const canWriteService = hasServicePermission(loginUser?.roles, activeCategoryId, activeServiceId, "write");
  const isServerInstanceService = activeCategoryId === "compute" && activeServiceId === "server";
  const isCreateMode = searchParams.get("mode") === "create" && isServerInstanceService;
  const isOperateMode = searchParams.get("mode") === "operate" && isServerInstanceService;
  const isViewOnly = isOperateMode;
  const isConsoleMode = searchParams.get("mode") === "console" && isServerInstanceService;

  useEffect(() => {
    if (initialized && !isInitializing && !loginUser) {
      router.replace("/auth/sign-in");
    }
  }, [initialized, isInitializing, loginUser, router]);

  useEffect(() => {
    if (!initialized || isInitializing || !loginUser) return;
    if (canReadService || readPermissionDeniedRef.current) return;

    if (firstReadableTarget) {
      setActiveCategoryId(firstReadableTarget.categoryId);
      setActiveServiceId(firstReadableTarget.serviceId);
      return;
    }

    readPermissionDeniedRef.current = true;
    router.replace("/");
  }, [initialized, isInitializing, loginUser, canReadService, firstReadableTarget, router]);

  const activeCategory = useMemo(
    () => SERVICE_CATEGORIES.find((category) => category.id === activeCategoryId) ?? SERVICE_CATEGORIES[0],
    [activeCategoryId]
  );
  const activeService =
    activeCategory.services.find((service) => service.id === activeServiceId) ?? activeCategory.services[0];
  const pageSize = 10;
  const hasSelectedInstance = Boolean(activeRowId);
  const selectedInstance = useMemo(
    () => instances.find((i) => i.instanceId === activeRowId) ?? null,
    [instances, activeRowId]
  );
  const canConsoleConnect = Boolean(selectedInstance && selectedInstance.status === "RUNNING");
  // WebSocket state for console
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsClosed, setWsClosed] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const termContainerRef = useRef<HTMLDivElement | null>(null);
  const decoderRef = useRef<TextDecoder | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  // Inactivity timer (5 minutes)
  const INACTIVITY_LIMIT_SEC = 5 * 60;
  const [remainSec, setRemainSec] = useState(INACTIVITY_LIMIT_SEC);
  const intervalRef = useRef<number | null>(null);
  const resetInactivity = () => setRemainSec(INACTIVITY_LIMIT_SEC);
  const sendCloseAndShutdown = () => {
    try { wsRef.current?.send(JSON.stringify({ type: "CLOSE" })); } catch {}
    try { wsRef.current?.close(); } catch {}
  };
  // Manual reconnect trigger
  const [wsConnectKey, setWsConnectKey] = useState(0);
  const filteredInstances = useMemo(() => instances, [instances]);
  const [totalPages, setTotalPages] = useState(1);
  const pagedInstances = filteredInstances;
  const emptyRowCount = Math.max(0, pageSize - pagedInstances.length - (pagedInstances.length === 0 ? 1 : 0));
  const visiblePages = useMemo(() => {
    const pages = [1];
    if (totalPages >= 2) pages.push(2);
    return pages;
  }, [totalPages]);

  useEffect(() => {
    const updateSidebarCollapsed = () => {
      setSidebarCollapsed(window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT);
    };

    updateSidebarCollapsed();
    window.addEventListener("resize", updateSidebarCollapsed);
    return () => {
      window.removeEventListener("resize", updateSidebarCollapsed);
    };
  }, []);

  // Reset idempotency key maps when list reloads
  useEffect(() => {
    setStopKeys({});
    setRestartKeys({});
    setTerminateKeys({});
  }, [reloadKey]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileOpen && profileWrapperRef.current && !profileWrapperRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (operationDropdownOpen && operationDropdownRef.current && !operationDropdownRef.current.contains(target)) {
        setOperationDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [profileOpen, operationDropdownOpen]);

  useEffect(() => {
    if (!activeCategory.services.some((service) => service.id === activeServiceId)) {
      setActiveServiceId(activeCategory.services[0]?.id ?? "");
    }
  }, [activeCategory, activeServiceId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  useEffect(() => {
    if (!activeRowId) return;
    if (!pagedInstances.some((instance) => instance.instanceId === activeRowId)) {
      setActiveRowId(null);
    }
  }, [activeRowId, pagedInstances]);

  useEffect(() => {
    if (!hasSelectedInstance || !canWriteService) {
      setOperationDropdownOpen(false);
    }
  }, [hasSelectedInstance, canWriteService]);

  useEffect(() => {
    const categoryFromQuery = searchParams.get("category");
    const serviceFromQuery = searchParams.get("service");

    if (!categoryFromQuery || !serviceFromQuery) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    const matchedCategory = SERVICE_CATEGORIES.find((category) => category.id === categoryFromQuery);
    if (!matchedCategory) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    const matchedService = matchedCategory.services.find((service) => service.id === serviceFromQuery);
    if (!matchedService) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    const canReadRequestedService = hasServicePermission(
      loginUser?.roles,
      matchedCategory.id,
      matchedService.id,
      "read"
    );
    if (!canReadRequestedService) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    setActiveCategoryId(matchedCategory.id);
    setActiveServiceId(matchedService.id);
  }, [searchParams, loginUser?.roles, fallbackTarget.categoryId, fallbackTarget.serviceId]);

  // Fetch instance list (list mode only)
  useEffect(() => {
    if (!isServerInstanceService || isCreateMode || isConsoleMode) return;
    let mounted = true;
    setInstancesLoading(true);
    setInstancesLoadError(null);

    (async () => {
      try {
        const body = await getInstanceListApi({
          searchKeyword: searchKeyword.trim(),
          page: Math.max(0, currentPage - 1),
          size: pageSize
        });

        if (!mounted) return;
        const mapped: ServerInstance[] = body.content.map((item) => ({
          instanceId: item.instanceId,
          name: item.name,
          status: item.status,
          tags: (item.tags ?? []).map((t) => t?.trim?.() ?? "").filter((t) => t.length > 0),
          osName: item.osName,
          osVersion: item.osVersion,
          cpuCores: Number.parseInt(item.cpu, 10) || 0,
          memorySize: item.memory,
          storageSizeGb: item.storageSize,
          publicIp: item.publicIp ?? "-",
          privateIp: item.privateIp ?? "-",
          vpcName: item.vpcName
        }));

        setInstances(mapped);
        setTotalPages(Math.max(1, body.totalPages ?? 1));
        if (activeRowId && !mapped.some((i) => i.instanceId === activeRowId)) {
          setActiveRowId(null);
        }
      } catch {
        if (!mounted) return;
        setInstancesLoadError("인스턴스 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (mounted) setInstancesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isServerInstanceService, isCreateMode, isConsoleMode, searchKeyword, currentPage, pageSize, reloadKey]);

  // WebSocket connect for console mode
  useEffect(() => {
    if (!isConsoleMode || !selectedInstance) {
      // Cleanup when leaving console mode
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      setWsConnected(false);
      setWsReady(false);
      setWsError(null);
      setWsClosed(false);
      setConsoleLogs([]);
      setRemainSec(INACTIVITY_LIMIT_SEC);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let triedRefresh = false;
    let resizeArmed = false;
    let resizeEnabled = false;
    let resizeTimeoutId: number | null = null;
    const sendResize = (force = false) => {
      const ws = wsRef.current;
      const term = termRef.current;
      if (!ws || !term) return;
      if (ws.readyState === WebSocket.OPEN && (force || (wsReady && resizeEnabled))) {
        try {
          ws.send(JSON.stringify({ type: "RESIZE", cols: term.cols, rows: term.rows }));
        } catch {}
      }
    };
    // Initialize xterm if needed
    if (!termRef.current && termContainerRef.current) {
      const term = new Terminal({ convertEol: true, scrollback: 2000, fontSize: 12, theme: { background: "#000000" } });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(termContainerRef.current);
      try { fit.fit(); } catch {}
      term.onData((data) => {
        resetInactivity();
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            const enc = (window as any).TextEncoder ? new TextEncoder() : null;
            if (enc) {
              ws.send(enc.encode(data));
            } else {
              ws.send(data);
            }
          } catch {
            try { ws.send(data); } catch {}
          }
        }
      });
      termRef.current = term;
      fitAddonRef.current = fit;
      // Observe container resize (sidebar toggle, split view, etc.)
      if (!resizeObsRef.current) {
        resizeObsRef.current = new ResizeObserver(() => {
          try { fitAddonRef.current?.fit(); } catch {}
          // Only send after READY
          sendResize();
        });
      }
      try { resizeObsRef.current.observe(termContainerRef.current); } catch {}
    }
    if (!decoderRef.current) {
      decoderRef.current = new TextDecoder();
    }
    const connect = async () => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const token = getAccessToken();
      const qp = new URLSearchParams({ instanceId: selectedInstance.instanceId });
      if (token) qp.set("accessToken", token);
      const url = `${protocol}://${window.location.host}/api/computes/ws/instances/terminal?${qp.toString()}`;

      try {
        const ws = new WebSocket(url);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;
        setWsConnected(false);
        setWsReady(false);
        setWsError(null);
        setWsClosed(false);
        setConsoleLogs([]);
        termRef.current?.clear();
        setRemainSec(INACTIVITY_LIMIT_SEC);

        ws.onopen = () => {
          setWsConnected(true);
          // Fit on open; defer RESIZE until READY
          try { fitAddonRef.current?.fit(); } catch {}
        };
        ws.onmessage = (event) => {
          if (typeof event.data === "string") {
            // Try to parse structured messages
            try {
              const obj = JSON.parse(event.data);
              if (obj && typeof obj === "object" && typeof obj.type === "string") {
                if (typeof obj.message === "string" && obj.message.length > 0) {
                  termRef.current?.writeln(obj.message as string);
                  setConsoleLogs((prev) => [...prev, obj.message as string]);
                }
                if (obj.type === "ERROR") {
                  setWsError(obj.message || "에러 발생");
                  if (obj.message) {
                    termRef.current?.writeln(obj.message);
                  }
                  try {
                    ws.send(JSON.stringify({ type: "CLOSE" }));
                  } catch {}
                  try { ws.close(); } catch {}
                }
                if (obj.type === "READY") {
                  setWsReady(true);
                  // Arm resize: send on first incoming payload of any kind,
                  // or fallback after a short delay if no payload arrives.
                  resizeArmed = true;
                  try { fitAddonRef.current?.fit(); } catch {}
                  if (resizeTimeoutId) {
                    window.clearTimeout(resizeTimeoutId);
                    resizeTimeoutId = null;
                  }
                  resizeTimeoutId = window.setTimeout(() => {
                    if (resizeArmed) {
                      try { fitAddonRef.current?.fit(); } catch {}
                      sendResize(true);
                      resizeArmed = false;
                      resizeEnabled = true;
                    }
                  }, 150);
                }
                if (obj.type === "CLOSE") {
                  setWsClosed(true);
                }
                // Any structured message counts as activity
                resetInactivity();
                return;
              }
            } catch {}
            // Before handling text, if resize is armed (READY already received),
            // send initial RESIZE now (first inbound text payload)
            if (resizeArmed) {
              try { fitAddonRef.current?.fit(); } catch {}
              sendResize(true);
              resizeArmed = false;
              resizeEnabled = true;
              if (resizeTimeoutId) { window.clearTimeout(resizeTimeoutId); resizeTimeoutId = null; }
            }
            // Fallback: plain text line
            termRef.current?.writeln(event.data as string);
            setConsoleLogs((prev) => [...prev, event.data as string]);
            resetInactivity();
            return;
          }
          // Binary payload (ArrayBuffer)
          if (resizeArmed) {
            // On first binary after READY, send initial RESIZE once
            try { fitAddonRef.current?.fit(); } catch {}
            sendResize(true);
            resizeArmed = false;
            resizeEnabled = true; // Enable future resize syncs
            if (resizeTimeoutId) { window.clearTimeout(resizeTimeoutId); resizeTimeoutId = null; }
          }
          try {
            const ab = event.data as ArrayBuffer;
            const text = decoderRef.current?.decode(new Uint8Array(ab)) ?? "";
            if (text) {
              // Use write (no auto newline) for streaming feel
              termRef.current?.write(text);
              setConsoleLogs((prev) => [...prev, text]);
            }
          } catch {
            // If decoding fails, show placeholder once
            termRef.current?.writeln("[unsupported binary]");
          }
          resetInactivity();
        };
        ws.onerror = () => {
          // Generic error; details will likely appear in onclose
        };
        ws.onclose = async (ev) => {
          setWsConnected(false);
          setWsReady(false);
          setWsClosed(true);
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // If unauthorized (server should use a close code e.g., 4001/4401/1008), try refresh once
          if (!triedRefresh && (ev.code === 4001 || ev.code === 4401 || ev.code === 1008)) {
            triedRefresh = true;
            try {
              const refreshed = await refreshTokenApi();
              setAccessToken(refreshed.accessToken);
              // reconnect with new token
              connect();
              return;
            } catch {
              setWsError("인증 만료됨. 다시 로그인해 주세요.");
              return;
            }
          }
          if (ev.reason) setWsError(ev.reason);
        };
      } catch (e) {
        setWsError("웹소켓을 초기화할 수 없습니다.");
      }
    };

    void connect();

    // Start inactivity countdown when in console mode and connected
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    resetInactivity();
    intervalRef.current = window.setInterval(() => {
      setRemainSec((prev) => {
        if (prev <= 1) {
          // timeout
          sendCloseAndShutdown();
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Attach resize listener to refit terminal
    const onResize = () => {
      try { fitAddonRef.current?.fit(); } catch {}
      try { sendResize(); } catch {}
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener("resize", onResize);
      if (resizeTimeoutId) {
        window.clearTimeout(resizeTimeoutId);
        resizeTimeoutId = null;
      }
      if (termRef.current) {
        try { termRef.current.dispose(); } catch {}
        termRef.current = null;
      }
      if (fitAddonRef.current) {
        try { (fitAddonRef.current as any).dispose?.(); } catch {}
        fitAddonRef.current = null;
      }
      if (resizeObsRef.current && termContainerRef.current) {
        try { resizeObsRef.current.unobserve(termContainerRef.current); } catch {}
      }
    };
  }, [isConsoleMode, selectedInstance?.instanceId, wsConnectKey]);

  useEffect(() => {
    if (!isCreateMode && !isOperateMode) return;

    let mounted = true;

    const fetchMeta = async () => {
      setMetaLoading(true);
      setMetaLoadError(null);

      try {
        const meta = await getInstanceMetaAllApi();
        if (!mounted) return;
        setInstanceMeta(meta);
        setSelectedImageCode((prev) => prev || meta.osImageList[0]?.imageCode || "");
        setSelectedSpecCode((prev) => prev || meta.specList[0]?.specCode || "");
        setSelectedVpcCode((prev) => prev || meta.vpcList[0]?.vpcCode || "");
      } catch {
        if (!mounted) return;
        setMetaLoadError("메타 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (mounted) setMetaLoading(false);
      }
    };

    fetchMeta();

    return () => {
      mounted = false;
    };
  }, [isCreateMode, isOperateMode]);

  // Fetch selected instance info in operate mode
  const [operateInstance, setOperateInstance] = useState<InstanceInfo | null>(null);
  const [operateLoading, setOperateLoading] = useState(false);
  const [operateError, setOperateError] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.showToast);
  const [operateTab, setOperateTab] = useState<"info" | "ssh" | "security">("info");
  type SecurityRule = { protocol: "TCP"; port: string; cidr: string; name: string };
  const [inboundRules, setInboundRules] = useState<SecurityRule[]>([]);
  const [outboundRules, setOutboundRules] = useState<SecurityRule[]>([]);

  useEffect(() => {
    if (!isOperateMode || !activeRowId) return;
    let mounted = true;
    setOperateLoading(true);
    setOperateError(null);
    (async () => {
      try {
        const info = await getInstanceInfoApi(activeRowId);
        if (!mounted) return;
        setOperateInstance(info);
      } catch {
        if (!mounted) return;
        setOperateError("인스턴스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (mounted) setOperateLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOperateMode, activeRowId]);

  // Populate form states from operate instance in view-only mode
  useEffect(() => {
    if (!isOperateMode || !operateInstance) return;
    setInstanceName(operateInstance.name || "");
    setTags(Array.isArray(operateInstance.tags) ? operateInstance.tags : []);
    setSelectedImageCode(operateInstance.imageCode || "");
    setSelectedSpecCode(operateInstance.specCode || "");
    setSelectedVpcCode(operateInstance.vpcCode || "");
    if (typeof operateInstance.storageSize === "number") {
      setStorageSize(operateInstance.storageSize);
      setStorageSizeInput(String(operateInstance.storageSize));
    }
    if (operateInstance.storageType === "HDD" || operateInstance.storageType === "SSD") {
      setStorageType(operateInstance.storageType);
    }
  }, [isOperateMode, operateInstance]);

  const canEditTags = isOperateMode || isCreateMode;
  const canEditSpec = isOperateMode || isCreateMode;
  const canEditStorageSize = isOperateMode || isCreateMode;

  const handleSaveBasic = async () => {
    if (!activeRowId) return;
    try {
      await updateInstanceTagsApi(activeRowId, tags.join(","));
      const info = await getInstanceInfoApi(activeRowId);
      setOperateInstance(info);
      showToast("success", "저장되었습니다.");
      setReloadKey((k) => k + 1);
    } catch {
      // error toast handled by interceptor
    }
  };

  const handleSaveSpecStorage = async () => {
    if (!activeRowId) return;
    try {
      const id = activeRowId;
      const key = specUpdateKeys[id] ?? createIdempotencyKey();
      if (!specUpdateKeys[id]) setSpecUpdateKeys((prev) => ({ ...prev, [id]: key }));
      await updateInstanceSpecApi(id, selectedSpecCode, storageType, storageSize, key);
      const info = await getInstanceInfoApi(id);
      setOperateInstance(info);
      setReloadKey((k) => k + 1);
      showToast("success", "저장되었습니다.");
    } catch {
      // error toast handled globally
    }
  };

  const handleSaveSsh = async () => {
    if (!activeRowId) return;
    // TODO: Connect SSH public key register API
    showToast("success", "SSH Public Key 저장 API 연결 필요");
  };

  const handleSaveSecurity = async () => {
    if (!activeRowId) return;
    // TODO: Connect security policy update API
    showToast("success", "보안 그룹 저장 API 연결 필요");
  };

  const addInboundRule = () => setInboundRules((prev) => [...prev, { protocol: "TCP", port: "", cidr: "", name: "" }]);
  const addOutboundRule = () => setOutboundRules((prev) => [...prev, { protocol: "TCP", port: "", cidr: "", name: "" }]);
  const removeInboundRule = (idx: number) => setInboundRules((prev) => prev.filter((_, i) => i !== idx));
  const removeOutboundRule = (idx: number) => setOutboundRules((prev) => prev.filter((_, i) => i !== idx));
  const updateInboundRule = (idx: number, patch: Partial<SecurityRule>) =>
    setInboundRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const updateOutboundRule = (idx: number, patch: Partial<SecurityRule>) =>
    setOutboundRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  useEffect(() => {
    if (!isCreateMode && !isOperateMode) {
      setCreateRequesting(false);
      setCreateRequestError(null);
      setIdempotencyKey("");
      createSubmitLockRef.current = false;
      setInstanceName("");
      setTags([]);
      setTagInput("");
      setStorageSize(50);
      setCreateFormErrors({});
      setSelectedImageCode(instanceMeta?.osImageList[0]?.imageCode || "");
      setSelectedSpecCode(instanceMeta?.specList[0]?.specCode || "");
      setSelectedVpcCode(instanceMeta?.vpcList[0]?.vpcCode || "");
      setStorageType("HDD");
      return;
    }

    setCreateRequestError(null);
    setIdempotencyKey(createIdempotencyKey());
  }, [isCreateMode, isOperateMode, instanceMeta]);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const moveToInstanceView = (mode: "list" | "create") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", "compute");
    params.set("service", "server");
    if (mode === "create") {
      params.set("mode", "create");
    } else {
      params.delete("mode");
    }
    if (mode === "list") {
      setReloadKey((k) => k + 1);
    }
    router.push(`/console?${params.toString()}`);
  };
  const addTag = (rawTag: string) => {
    const nextTag = rawTag.trim();
    if (!nextTag) return;
    setTags((prev) => (prev.includes(nextTag) ? prev : [...prev, nextTag]));
  };
  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };
  const validateCreateForm = () => {
    const nextErrors: { instanceName?: string; storageSize?: string } = {};

    if (!instanceName.trim()) {
      nextErrors.instanceName = "인스턴스 명은 필수입니다.";
    }

    if (!Number.isInteger(storageSize) || storageSize < 0) {
      nextErrors.storageSize = "스토리지 용량은 0 이상의 정수여야 합니다.";
    }

    setCreateFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const generatedRequest: GenerateInstanceRequest = {
    ownerId: loginUser?.userId ?? "",
    name: instanceName.trim(),
    tags,
    imageCode: selectedImageCode,
    specCode: selectedSpecCode,
    storageType,
    storageSize,
    vpcCode: selectedVpcCode
  };
  const selectedVpc = instanceMeta?.vpcList.find((vpc) => vpc.vpcCode === selectedVpcCode);
  const selectedImage = instanceMeta?.osImageList.find((image) => image.imageCode === selectedImageCode);
  const selectedSpec = instanceMeta?.specList.find((spec) => spec.specCode === selectedSpecCode);
  const ingressPolicyLabel = selectedVpc?.defaultIngressPolicy === "DENY_ALL" ? "모두 차단" : selectedVpc?.defaultIngressPolicy;
  const egressPolicyLabel = selectedVpc?.defaultEgressPolicy === "ALLOW_ALL" ? "모두 허용" : selectedVpc?.defaultEgressPolicy;
  const resolveOsLogo = (imageCode: string, osName: string) => {
    const normalizedCode = imageCode.toLowerCase();
    const normalizedName = osName.toLowerCase();
    if (normalizedCode.startsWith("ubuntu:") || normalizedName.includes("ubuntu")) {
      return "/images/os/ubuntu.svg";
    }
    if (normalizedCode.startsWith("rocky:") || normalizedName.includes("rocky")) {
      return "/images/os/rocky-linux.svg";
    }
    return null;
  };
  const resetCreateForm = () => {
    setInstanceName("");
    setTags([]);
    setTagInput("");
    setStorageSize(50);
    setCreateFormErrors({});
    setSelectedImageCode(instanceMeta?.osImageList[0]?.imageCode || "");
    setSelectedSpecCode(instanceMeta?.specList[0]?.specCode || "");
    setSelectedVpcCode(instanceMeta?.vpcList[0]?.vpcCode || "");
  };
  const handleCreateSubmit = async () => {
    if (createSubmitLockRef.current || createRequesting) return;
    if (!validateCreateForm()) return;

    const requestKey = idempotencyKey || createIdempotencyKey();
    if (!idempotencyKey) {
      setIdempotencyKey(requestKey);
    }

    createSubmitLockRef.current = true;
    setCreateRequesting(true);
    setCreateRequestError(null);

    try {
      await provisionInstanceApi(generatedRequest, requestKey);
      resetCreateForm();
      moveToInstanceView("list");
    } catch {
      setCreateRequestError("인스턴스 생성 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      createSubmitLockRef.current = false;
      setCreateRequesting(false);
    }
  };

  if (!initialized || isInitializing) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1320px] items-center justify-center px-5 md:px-8">
        <p className="text-sm font-medium text-slate-500">인증 상태를 확인 중입니다...</p>
      </main>
    );
  }

  if (!loginUser) {
    return null;
  }

  if (!canReadService) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7]">
      <header className="sticky top-0 z-30 border-b border-slate-700 bg-[#111827] text-white">
        <div className="mx-auto flex h-14 w-full max-w-[1840px] items-center justify-between px-8 md:px-12">
          <Link href="/" aria-label="메인으로 이동">
            <BrandLogo size="sm" className="text-white" />
          </Link>

          <div ref={profileWrapperRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-500/80 bg-slate-800/70"
              aria-label="사용자"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-slate-100" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
              </svg>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 w-72 rounded-none border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)]">
                <p className="text-sm font-semibold">{loginUser.displayName}</p>
                <p className="text-xs text-slate-600">{loginUser.email}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setProfileOpen(false);
                    router.replace("/auth/sign-in");
                  }}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-none border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-56px)] w-full" style={{ gridTemplateColumns: sidebarCollapsed ? "72px 1fr" : "248px 1fr" }}>
        <aside className="border-r border-slate-200 bg-[#f8f9fb] p-2">
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-none border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
              aria-label="사이드바 접기/펼치기"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? <path d="m7 4 6 6-6 6" /> : <path d="m13 4-6 6 6 6" />}
              </svg>
            </button>
          </div>

          <div className="h-[calc(100vh-125px)] overflow-auto rounded-none border border-slate-200 bg-white px-2 py-1.5">
            {SERVICE_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategory.id;
              const isCollapsed = collapsedCategories[category.id];

              return (
                <section key={category.id} className="mb-1.5 last:mb-0">
                  <div className="group relative flex items-center">
                    {isActive ? <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-none bg-[#1f67ff]" /> : null}
                    <button
                      type="button"
                      onClick={() => {
                        const readableService = category.services.find((service) =>
                          hasServicePermission(loginUser?.roles, category.id, service.id, "read")
                        );
                        if (!readableService) {
                          return;
                        }
                        setActiveCategoryId(category.id);
                        setActiveServiceId(readableService.id);
                        setCollapsedCategories((prev) => ({ ...prev, [category.id]: false }));
                      }}
                      className={`flex flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm font-semibold transition ${
                        isActive ? "text-[#145fd7]" : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <CategoryIcon id={category.id} />
                      {sidebarCollapsed ? null : category.label}
                    </button>

                    {!sidebarCollapsed ? (
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`${category.label} 하위 메뉴 접기/펼치기`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m7 4 6 6-6 6" />
                        </svg>
                      </button>
                    ) : null}
                  </div>

                  <ul className={`${sidebarCollapsed || isCollapsed ? "hidden" : "mt-0.5 space-y-0.5 pl-7"}`}>
                    {category.services.map((service) => {
                      const isServiceActive = isActive && activeService?.id === service.id;

                      return (
                        <li key={service.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!hasServicePermission(loginUser?.roles, category.id, service.id, "read")) {
                                return;
                              }
                              setActiveCategoryId(category.id);
                              setActiveServiceId(service.id);
                            }}
                            className={`relative w-full px-2 py-1.5 text-left text-[12px] font-medium transition ${
                              isServiceActive ? "text-[#145fd7]" : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {isServiceActive ? <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-none bg-[#1f67ff]" /> : null}
                            {service.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 bg-[#f3f4f7] p-4 md:p-6">
          <div
            className={`w-full rounded-none border border-slate-200/90 bg-white shadow-[0_26px_48px_-34px_rgba(15,23,42,0.48)] ${
              (isCreateMode || isConsoleMode || isOperateMode) ? "max-w-[1080px]" : ""
            } ${(isCreateMode || isOperateMode) ? "overflow-visible" : "overflow-hidden"}`}
          >
            <div className="border-b border-slate-100 bg-white px-5 py-4">
              <h1 className="font-[var(--font-sora)] text-[15px] font-semibold tracking-[0.01em] text-slate-900">
                <span className="text-slate-500">{activeCategory.label}</span>
                <span className="px-2 text-slate-300">/</span>
                {isCreateMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveToInstanceView("list")}
                      className="text-slate-500 transition hover:text-[#123b84]"
                    >
                      {activeService?.name ?? "서비스"}
                    </button>
                    <span className="px-2 text-slate-300">/</span>
                    <span>인스턴스 생성</span>
                  </>
                ) : isConsoleMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveToInstanceView("list")}
                      className="text-slate-500 transition hover:text-[#123b84]"
                    >
                      {activeService?.name ?? "서비스"}
                    </button>
                    <span className="px-2 text-slate-300">/</span>
                    <span>콘솔 연결</span>
                  </>
                ) : isOperateMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveToInstanceView("list")}
                      className="text-slate-500 transition hover:text-[#123b84]"
                    >
                      {activeService?.name ?? "서비스"}
                    </button>
                    <span className="px-2 text-slate-300">/</span>
                    <span>인스턴스 작업</span>
                  </>
                ) : (
                  <span>{activeService?.name ?? "서비스"}</span>
                )}
              </h1>
            </div>

            <div className={`relative ${isCreateMode || isConsoleMode || isOperateMode ? "overflow-visible" : "overflow-hidden"}`}>
            <div
              className={`flex transition-transform duration-300 ease-out ${
                isConsoleMode ? "w-full translate-x-0" : (isCreateMode || isOperateMode) ? "w-[200%] -translate-x-1/2" : "w-[200%] translate-x-0"
              }`}
            >
            <div
              className={`${isConsoleMode ? "hidden" : "w-1/2"} ${
                (isCreateMode || isOperateMode) && !isConsoleMode ? "pointer-events-none invisible" : ""
              }`}
            >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-5 pb-2 pt-6">
              <div className="relative w-[360px]">
                <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8.5" cy="8.5" r="5" />
                  <path d="m12 12 4 4" />
                </svg>
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  className="h-9 w-full rounded-none border border-slate-300/90 bg-white pl-9 pr-3 text-[12px] text-slate-700 placeholder:text-slate-400 transition focus:border-[#18499f] focus:outline-none focus:ring-2 focus:ring-[#18499f]/15"
                  placeholder="이름 또는 태그 검색"
                  aria-label="이름 또는 태그 검색"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-300/90 bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  aria-label="새로고침"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
                    <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {canExecuteService ? (
                  <button
                    type="button"
                    disabled={!canConsoleConnect}
                    onClick={() => {
                      // Switch to console view
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("category", "compute");
                      params.set("service", "server");
                      params.set("mode", "console");
                      router.push(`/console?${params.toString()}`);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300/90 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                  >
                    콘솔 연결
                  </button>
                ) : null}

                {canWriteService ? (
                  <div ref={operationDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setOperationDropdownOpen((prev) => !prev)}
                      disabled={!hasSelectedInstance}
                      className="inline-flex h-9 min-w-[190px] items-center justify-between gap-2 rounded-none border border-slate-300/90 bg-white px-3 text-[12px] font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                      aria-label="인스턴스 상태 드롭다운"
                      aria-haspopup="menu"
                      aria-expanded={operationDropdownOpen}
                    >
                      <span>인스턴스 상태</span>
                      <svg viewBox="0 0 20 20" className={`h-4 w-4 text-slate-500 transition ${operationDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="m5 7 5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {operationDropdownOpen && hasSelectedInstance ? (
                      <div className="absolute right-0 top-10 z-20 min-w-[190px] overflow-hidden rounded-none border border-slate-200 bg-white py-1 shadow-[0_18px_32px_-20px_rgba(15,23,42,0.45)]">
                        {[
                          { key: "stop", label: "인스턴스 중지", enabled: selectedInstance?.status === "RUNNING" },
                          { key: "restart", label: "인스턴스 재부팅", enabled: selectedInstance?.status === "STOPPED" },
                          { key: "terminate", label: "인스턴스 삭제", enabled: selectedInstance?.status === "STOPPED" }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            disabled={!item.enabled}
                            onClick={() => {
                              if (!item.enabled) return;
                              setOperationDropdownOpen(false);
                              (async () => {
                                if (!selectedInstance) return;
                                try {
                                  const id = selectedInstance.instanceId;
                                  if (item.key === "stop") {
                                    const key = stopKeys[id] ?? createIdempotencyKey();
                                    if (!stopKeys[id]) setStopKeys((prev) => ({ ...prev, [id]: key }));
                                    await stopInstanceApi(id, key);
                                  } else if (item.key === "restart") {
                                    const key = restartKeys[id] ?? createIdempotencyKey();
                                    if (!restartKeys[id]) setRestartKeys((prev) => ({ ...prev, [id]: key }));
                                    await restartInstanceApi(id, key);
                                  } else if (item.key === "terminate") {
                                    const key = terminateKeys[id] ?? createIdempotencyKey();
                                    if (!terminateKeys[id]) setTerminateKeys((prev) => ({ ...prev, [id]: key }));
                                    await terminateInstanceApi(id, key);
                                  }
                                  setReloadKey((k) => k + 1);
                                } catch {
                                  // Error toast handled globally in apiClient
                                }
                              })();
                            }}
                            className={`flex h-9 w-full items-center px-3 text-left text-[12px] transition ${
                              item.enabled
                                ? "text-slate-700 hover:bg-slate-50"
                                : "cursor-not-allowed text-slate-300"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {canWriteService ? (
                  <button
                    type="button"
                    disabled={!hasSelectedInstance || selectedInstance?.status !== "RUNNING"}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("category", "compute");
                      params.set("service", "server");
                      params.set("mode", "operate");
                      router.push(`/console?${params.toString()}`);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300/90 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                  >
                    인스턴스 작업
                  </button>
                ) : null}

                {canWriteService && isServerInstanceService ? (
                  <button
                    type="button"
                    onClick={() => moveToInstanceView("create")}
                    className="inline-flex h-9 items-center justify-center rounded-none border border-[#123b84] bg-[#123b84] px-3 text-[12px] font-semibold text-white shadow-[0_10px_18px_-14px_rgba(18,59,132,0.9)] transition hover:border-[#0f3170] hover:bg-[#0f3170]"
                  >
                    인스턴스 생성
                  </button>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto px-5 pb-1 pt-2">
              <table className="min-w-[1460px] w-full border-separate border-spacing-0 overflow-hidden rounded-none border border-slate-200/80 bg-white text-[12px] font-[var(--font-body)] text-slate-700">
              <thead className="bg-white text-slate-400">
                <tr>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">이름</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">상태</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">태그</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">OS 명</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">OS 버전</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em]">CPU Cores</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em]">Memory Size </th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em]">Storage Size (GB)</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">Public IP</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">Private IP</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">VPC 명</th>
                  <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">인스턴스 ID</th>
                </tr>
              </thead>
              <tbody>
                {pagedInstances.length > 0 ? (
                  pagedInstances.map((instance) => (
                  <tr
                    key={instance.instanceId}
                    onClick={() => setActiveRowId(instance.instanceId)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      activeRowId === instance.instanceId
                        ? "bg-[#f5f8ff] shadow-[inset_2px_0_0_#123b84]"
                        : "bg-white"
                    }`}
                  >
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-slate-800">{instance.name}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px]">
                      {(() => {
                        const s = instance.status;
                        const labelMap: Record<string, string> = {
                          PROVISIONING: "프로비저닝 중",
                          RESTARTING: "부팅 중",
                          RUNNING: "실행 중",
                          STOPPING: "중지 중",
                          STOPPED: "중지",
                          TERMINATING: "종료 중",
                          TERMINATED: "종료됨",
                          FAILED: "실패",
                          FAILE: "실패"
                        };
                        const colorClass =
                          s === "RUNNING"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : s === "STOPPED" || s === "TERMINATED"
                              ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              : s === "FAILED" || s === "FAILE"
                                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
                        return (
                          <span className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-[10px] font-semibold ${colorClass}`}>
                            {labelMap[s] ?? s}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px]">
                      {instance.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {instance.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-none border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.osName}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.osVersion}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[12px] text-slate-700">{instance.cpuCores}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[12px] text-slate-700">{instance.memorySize}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[12px] text-slate-700">{instance.storageSizeGb}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.publicIp}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.privateIp}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.vpcName}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.instanceId}</td>
                  </tr>
                ))) : (
                  <tr>
                    <td className="h-11 border-b border-slate-100 px-3 py-2 text-center text-[12px] text-slate-500" colSpan={12}>
                      {instancesLoading
                        ? "인스턴스 목록을 불러오는 중입니다..."
                        : instancesLoadError ?? "표시할 인스턴스가 없습니다."}
                    </td>
                  </tr>
                )}

                {Array.from({ length: emptyRowCount }).map((_, index) => (
                  <tr key={`empty-row-${index}`} className="bg-white">
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-slate-100 px-3 py-2" />
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end bg-white px-5 pb-6 pt-3">
              <div className="inline-flex items-center gap-1 rounded-none border border-slate-200 bg-slate-50/70 px-2 py-1 text-[12px] text-slate-600">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-none text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="이전 페이지"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 5-5 5 5 5" />
                  </svg>
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-none px-1 ${
                      page === currentPage
                        ? "bg-white font-semibold text-[#123b84] shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {totalPages > 2 ? <span className="px-0.5 text-slate-500">...</span> : null}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-none text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="다음 페이지"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m8 5 5 5-5 5" />
                  </svg>
                </button>
              </div>
            </div>
            </div>
            <div className={`${isConsoleMode ? "w-full" : "w-1/2"} bg-white p-5 pb-6 pt-6`}>
              {isConsoleMode ? (
                <div
                  className="flex min-h-[640px] h-[calc(100vh-220px)] flex-col"
                  onMouseMove={resetInactivity}
                  onKeyDown={resetInactivity}
                  tabIndex={0}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[12px] text-slate-600">
                      {selectedInstance ? (
                        <>
                          <span className="font-semibold text-slate-800">{selectedInstance.name}</span>
                          <span className="px-1 text-slate-400">·</span>
                          <span className="text-slate-500">{selectedInstance.instanceId}</span>
                        </>
                      ) : (
                        <span className="text-slate-500">인스턴스가 선택되지 않았습니다</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {wsReady ? (
                        <button
                          type="button"
                          onClick={() => {
                            sendCloseAndShutdown();
                          }}
                          className="inline-flex h-8 items-center justify-center rounded-none border border-rose-300 bg-white px-3 text-[12px] font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          연결 종료
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWsConnectKey((k) => k + 1)}
                          disabled={wsConnected}
                          className="inline-flex h-8 items-center justify-center rounded-none border border-emerald-300 bg-white px-3 text-[12px] font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          콘솔 연결
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          moveToInstanceView("list");
                          setReloadKey((k) => k + 1);
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        목록으로
                      </button>
                    </div>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-[12px] text-slate-600">
                    <div>
                      상태: {wsError ? (
                        <span className="font-semibold text-rose-700">에러 발생</span>
                      ) : wsClosed ? (
                        <span className="text-slate-700">연결 종료</span>
                      ) : wsReady ? (
                        <span className="text-emerald-700">연결됨</span>
                      ) : (
                        <span className="text-slate-600">연결 시도 중...</span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {String(Math.floor(remainSec / 60)).padStart(2, '0')}:{String(remainSec % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-none border border-slate-200 bg-black">
                    <div ref={termContainerRef} className="h-full w-full" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,680px)_340px]">
              {metaLoading ? (
                <div className="flex h-[320px] items-center justify-center rounded-none border border-dashed border-slate-300 text-[13px] text-slate-500">
                  인스턴스 생성 메타 정보를 불러오는 중입니다...
                </div>
              ) : metaLoadError ? (
                <div className="rounded-none border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">{metaLoadError}</div>
              ) : (
                <>
                  <div className="max-w-[680px] pr-2">
                    {isOperateMode ? (
                      <div className="mb-3">
                        <div className="flex items-end gap-1 border-b border-slate-200">
                          {[
                            { key: "info", label: "인스턴스 정보" },
                          { key: "ssh", label: "SSH Public Key" },
                          { key: "security", label: "보안 그룹" }
                          ].map((tab) => {
                            const active = operateTab === (tab.key as any);
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setOperateTab(tab.key as any)}
                                className={`inline-flex h-9 items-center justify-center rounded-t-md px-3 text-[12px] font-medium ${
                                  active
                                    ? "-mb-px border-x border-t border-slate-300 bg-white text-slate-900"
                                    : "border-transparent bg-transparent text-slate-600 hover:text-slate-800"
                                }`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {(!isOperateMode || operateTab === "info") ? (
                    <form
                      id="instance-create-form"
                      className="space-y-5"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        await handleCreateSubmit();
                      }}
                    >
                      <fieldset className="border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                        <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">기본 설정</legend>
                        <div className="space-y-4 pt-1">
                          <label className="space-y-1.5">
                            <span className="text-[12px] font-semibold text-slate-700">인스턴스 명</span>
                            <input
                              value={instanceName}
                              onChange={(event) => {
                                setInstanceName(event.target.value);
                                if (createFormErrors.instanceName) {
                                  setCreateFormErrors((prev) => ({ ...prev, instanceName: undefined }));
                                }
                              }}
                              required
                              disabled={isViewOnly}
                              className={`h-10 w-full rounded-none border px-3 text-[12px] text-slate-700 focus:border-[#18499f] focus:outline-none focus:ring-2 focus:ring-[#18499f]/15 ${
                                isViewOnly ? "cursor-not-allowed border-slate-300 bg-slate-50" : "border-slate-300 bg-white"
                              }`}
                              placeholder="예: web-prod-2"
                            />
                            {createFormErrors.instanceName ? (
                              <p className="text-[11px] text-rose-600">{createFormErrors.instanceName}</p>
                            ) : null}
                          </label>

                          <div className="space-y-1.5">
                            <span className="text-[12px] font-semibold text-slate-700">태그</span>
                            <div className="rounded-none border border-slate-300 bg-white px-2">
                              <div className="flex min-h-[40px] flex-wrap items-center gap-1.5">
                                {tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => removeTag(tag)}
                                      className="inline-flex h-4 w-4 items-center justify-center border border-slate-300 bg-white text-slate-400 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                                      aria-label={`${tag} 태그 제거`}
                                    >
                                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path d="M3 3L9 9M9 3L3 9" strokeLinecap="round" />
                                      </svg>
                                    </button>
                                  </span>
                                ))}
                                {canEditTags ? (
                                  <input
                                  value={tagInput}
                                  onChange={(event) => setTagInput(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      addTag(tagInput);
                                      setTagInput("");
                                      return;
                                    }
                                    if (event.key === "Backspace" && !tagInput && tags.length > 0) {
                                      removeTag(tags[tags.length - 1]);
                                    }
                                  }}
                                  className="h-10 min-w-[140px] flex-1 bg-transparent px-1 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                  placeholder={tags.length === 0 ? "태그 입력 후 Enter" : ""}
                                  />
                                ) : null}
                              </div>
                            </div>
                          </div>
                          {isOperateMode ? (
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={handleSaveBasic}
                                className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                              >
                                저장
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </fieldset>

                      <fieldset className="border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                        <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">이미지 및 사양</legend>
                        <div className="space-y-4 pt-1">
                          <div className="space-y-1.5">
                            <span className="text-[12px] font-semibold text-slate-700">OS 이미지</span>
                            <div className="flex flex-wrap gap-2">
                              {(
                                (isViewOnly
                                  ? instanceMeta?.osImageList.filter((img) => img.imageCode === selectedImageCode)
                                  : instanceMeta?.osImageList) || []
                              ).map((image) => {
                                const selected = selectedImageCode === image.imageCode;
                                const logoSrc = resolveOsLogo(image.imageCode, image.osName);
                                return (
                                  <label
                                    key={image.imageCode}
                                    className={`relative flex h-[116px] w-[106px] cursor-pointer flex-col border p-2 shadow-[0_8px_16px_-14px_rgba(15,23,42,0.6)] transition ${
                                      selected
                                        ? "border-[#1d4f99] bg-[#f6f9ff]"
                                        : "border-slate-300 bg-white hover:border-slate-400"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="os-image"
                                      checked={selected}
                                      onChange={() => setSelectedImageCode(image.imageCode)}
                                      disabled={isViewOnly}
                                      className={`absolute right-2 top-2 h-4 w-4 accent-[#123b84] ${
                                        isViewOnly ? "cursor-not-allowed" : ""
                                      }`}
                                    />
                                    <div className="mb-1.5 flex h-10 items-center justify-center border-b border-slate-200 pb-1.5">
                                      {logoSrc ? (
                                        <Image src={logoSrc} alt={`${image.osName} logo`} width={70} height={22} />
                                      ) : (
                                        <span className="text-[11px] font-semibold text-slate-600">{image.osName}</span>
                                      )}
                                    </div>
                                    <div className="pr-5">
                                      <p className="text-[11px] font-semibold leading-tight text-slate-800">{image.osName}</p>
                                      <p className="mt-0.5 text-[10px] text-slate-500">{image.osVersion}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {instanceMeta?.osImageList.find((item) => item.imageCode === selectedImageCode)?.description ?? ""}
                            </p>
                          </div>
                          <label className="space-y-1.5">
                            <span className="text-[12px] font-semibold text-slate-700">사양</span>
                            <select
                              value={selectedSpecCode}
                              onChange={(event) => setSelectedSpecCode(event.target.value)}
                              disabled={!canEditSpec}
                              className={`h-10 w-full rounded-none border px-3 text-[12px] text-slate-700 ${
                                !canEditSpec
                                  ? "cursor-not-allowed border-slate-300 bg-slate-50"
                                  : "border-slate-300 bg-white focus:border-[#18499f] focus:outline-none focus:ring-2 focus:ring-[#18499f]/15"
                              }`}
                            >
                              {instanceMeta?.specList.map((spec) => (
                                <option key={spec.specCode} value={spec.specCode}>
                                  {spec.specName} ({spec.description})
                                </option>
                              ))}
                            </select>
                          </label>
                          {isViewOnly ? (
                            <div className="grid gap-4 pt-1 md:grid-cols-2">
                              <label className="space-y-1.5">
                                <span className="text-[12px] font-semibold text-slate-700">스토리지 타입</span>
                                <select
                                  value={storageType}
                                  disabled
                                  className="h-10 w-full cursor-not-allowed rounded-none border border-slate-300 bg-slate-50 px-3 text-[12px] text-slate-700"
                                >
                                  <option value="HDD">HDD</option>
                                  <option value="SSD">SSD</option>
                                </select>
                              </label>
                              <label className="space-y-1.5">
                                <span className="text-[12px] font-semibold text-slate-700">스토리지 용량 (GB)</span>
                                <input
                                  value={storageSizeInput}
                                  disabled={!canEditStorageSize}
                                  type="text"
                                  inputMode="numeric"
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (/^\d*$/.test(v)) {
                                      setStorageSizeInput(v);
                                      if (v !== "") {
                                        const n = Number(v);
                                        if (Number.isFinite(n)) setStorageSize(Math.max(0, Math.trunc(n)));
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    const n = Number(storageSizeInput);
                                    const normalized = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : Math.max(0, Math.trunc(storageSize));
                                    setStorageSize(normalized);
                                    setStorageSizeInput(String(normalized));
                                  }}
                                  className={`h-10 w-full rounded-none border px-3 text-[12px] text-slate-700 ${
                                    !canEditStorageSize
                                      ? "cursor-not-allowed border-slate-300 bg-slate-50"
                                      : "border-slate-300 bg-white"
                                  }`}
                                />
                              </label>
                            </div>
                          ) : null}
                          {isOperateMode ? (
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={handleSaveSpecStorage}
                                className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                              >
                                저장
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </fieldset>

                      {isViewOnly ? null : (
                        <fieldset className="border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                          <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">스토리지</legend>
                          <div className="grid gap-4 pt-1 md:grid-cols-2">
                            <label className="space-y-1.5">
                              <span className="text-[12px] font-semibold text-slate-700">스토리지 타입</span>
                              <select
                                value={storageType}
                                disabled
                                className="h-10 w-full cursor-not-allowed rounded-none border border-slate-300 bg-slate-50 px-3 text-[12px] text-slate-700"
                              >
                                <option value="HDD">HDD</option>
                                <option value="SSD">SSD</option>
                              </select>
                            </label>
                            <label className="space-y-1.5">
                              <span className="text-[12px] font-semibold text-slate-700">스토리지 용량 (GB)</span>
                              <input
                                value={storageSize}
                                onChange={(event) => {
                                  const parsed = Number(event.target.value);
                                  const nextValue = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
                                  setStorageSize(nextValue);
                                  if (createFormErrors.storageSize) {
                                    setCreateFormErrors((prev) => ({ ...prev, storageSize: undefined }));
                                  }
                                }}
                                type="number"
                                min={0}
                                step={1}
                                disabled={isViewOnly}
                                className={`h-10 w-full rounded-none border px-3 text-[12px] text-slate-700 ${
                                  isViewOnly
                                    ? "cursor-not-allowed border-slate-300 bg-slate-50"
                                    : "border-slate-300 bg-white focus:border-[#18499f] focus:outline-none focus:ring-2 focus:ring-[#18499f]/15"
                                }`}
                              />
                              {createFormErrors.storageSize ? (
                                <p className="text-[11px] text-rose-600">{createFormErrors.storageSize}</p>
                              ) : null}
                            </label>
                          </div>
                        </fieldset>
                      )}

                      <fieldset className="border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                        <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">네트워크 설정</legend>
                        <div className="space-y-2 pt-1">
                          <label className="space-y-1.5">
                            <span className="text-[12px] font-medium text-slate-700">VPC 선택</span>
                            <select
                              value={selectedVpcCode}
                              onChange={(event) => setSelectedVpcCode(event.target.value)}
                              disabled={isViewOnly}
                              className={`h-10 w-full rounded-none border px-3 text-[12px] text-slate-700 ${
                                isViewOnly
                                  ? "cursor-not-allowed border-slate-300 bg-slate-50"
                                  : "border-slate-300 bg-white focus:border-[#18499f] focus:outline-none focus:ring-2 focus:ring-[#18499f]/15"
                              }`}
                            >
                              {instanceMeta?.vpcList.map((vpc) => (
                                <option key={vpc.vpcCode} value={vpc.vpcCode}>
                                  {vpc.vpcName}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="grid gap-x-4 gap-y-1 border border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-700 md:grid-cols-2">
                            <p>{selectedVpc?.description ?? "-"}</p>
                            <p></p>
                            <p>Network CIDR: {selectedVpc?.cidrBlock ?? "-"}</p>
                            <p></p>
                            <p>아웃바운드 보안 정책: {egressPolicyLabel ?? "-"}</p>
                            <p className="md:col-span-2">인바운드 보안 정책: {ingressPolicyLabel ?? "-"}</p>
                          </div>
                        </div>
                      </fieldset>

                      <div className="flex justify-end gap-2 xl:hidden">
                        <button
                          type="button"
                          onClick={() => moveToInstanceView("list")}
                          disabled={createRequesting}
                          className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          목록으로
                        </button>
                        {isViewOnly ? null : (
                          <button
                            type="submit"
                            disabled={createRequesting}
                            className="inline-flex h-9 items-center justify-center rounded-none border border-[#123b84] bg-[#123b84] px-3 text-[12px] font-semibold text-white shadow-[0_10px_18px_-14px_rgba(18,59,132,0.9)] transition hover:border-[#0f3170] hover:bg-[#0f3170]"
                          >
                            {createRequesting ? "생성 요청 중..." : "인스턴스 생성 요청"}
                          </button>
                        )}
                      </div>
                      
                    </form>
                    ) : null}

                    {isOperateMode && operateTab === "ssh" ? (
                      <fieldset className="border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                        <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">SSH Public Key</legend>
                        <div className="space-y-3 pt-1">
                          <label className="space-y-1.5">
                            <span className="text-[12px] font-semibold text-slate-700">키 이름</span>
                            <input className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-[12px] text-slate-700" placeholder="예: my-key" />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-[12px] font-semibold text-slate-700">Public Key</span>
                            <textarea className="min-h-[120px] w-full rounded-none border border-slate-300 bg-white p-3 text-[12px] text-slate-700" placeholder="ssh-ed25519 AAAAC3... user@host" />
                          </label>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleSaveSsh}
                              className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    ) : null}

                    {isOperateMode && operateTab === "security" ? (
                      <>
                        <fieldset className="border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                          <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">인바운드 규칙</legend>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[12px] text-slate-600">규칙이 없으면 모든 요청에 대해 차단됩니다.</span>
                            <button
                              type="button"
                              onClick={addInboundRule}
                              className="inline-flex h-7 items-center justify-center rounded-none border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            >
                              + 규칙 추가
                            </button>
                          </div>
                          <div className="space-y-2 text-[12px] text-slate-700">
                            {inboundRules.length > 0 ? (
                              inboundRules.map((rule, idx) => (
                                <div key={`inbound-${idx}`} className="grid grid-cols-[60px_100px_1fr_1fr_70px] items-center gap-2">
                                  <span className="inline-flex h-8 items-center justify-center border border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-700">TCP</span>
                                  <input value={rule.port} onChange={(e) => updateInboundRule(idx, { port: e.target.value })} placeholder="포트" className="h-8 w-[100px] rounded-none border border-slate-300 bg-white px-2" />
                                  <input value={rule.cidr} onChange={(e) => updateInboundRule(idx, { cidr: e.target.value })} placeholder="IP/CIDR (예: 0.0.0.0/0)" className="h-8 rounded-none border border-slate-300 bg-white px-2" />
                                  <input value={rule.name} onChange={(e) => updateInboundRule(idx, { name: e.target.value })} placeholder="규칙 이름" className="h-8 rounded-none border border-slate-300 bg-white px-2" />
                                  <div className="flex justify-end">
                                    <button type="button" onClick={() => removeInboundRule(idx)} className="inline-flex h-7 items-center justify-center rounded-none border border-slate-300 bg-white px-2 text-[11px] font-medium text-rose-700 hover:border-rose-300 hover:bg-rose-50">삭제</button>
                                  </div>
                                </div>
                              ))
                            ) : null}
                          </div>
                        </fieldset>

                        <fieldset className="mt-3 border border-slate-400 bg-white px-3 pb-3 pt-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]">
                          <legend className="px-1 text-[12px] font-semibold tracking-[0.02em] text-black">아웃바운드 규칙</legend>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[12px] text-slate-600">규칙이 없으면 모든 요청을 허용합니다.</span>
                            <button
                              type="button"
                              onClick={addOutboundRule}
                              className="inline-flex h-7 items-center justify-center rounded-none border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            >
                              + 규칙 추가
                            </button>
                          </div>
                          <div className="space-y-2 text-[12px] text-slate-700">
                            {outboundRules.length > 0 ? (
                              outboundRules.map((rule, idx) => (
                                <div key={`outbound-${idx}`} className="grid grid-cols-[60px_100px_1fr_1fr_70px] items-center gap-2">
                                  <span className="inline-flex h-8 items-center justify-center border border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-700">TCP</span>
                                  <input value={rule.port} onChange={(e) => updateOutboundRule(idx, { port: e.target.value })} placeholder="포트" className="h-8 w-[100px] rounded-none border border-slate-300 bg-white px-2" />
                                  <input value={rule.cidr} onChange={(e) => updateOutboundRule(idx, { cidr: e.target.value })} placeholder="IP/CIDR (예: 0.0.0.0/0)" className="h-8 rounded-none border border-slate-300 bg-white px-2" />
                                  <input value={rule.name} onChange={(e) => updateOutboundRule(idx, { name: e.target.value })} placeholder="규칙 이름" className="h-8 rounded-none border border-slate-300 bg-white px-2" />
                                  <div className="flex justify-end">
                                    <button type="button" onClick={() => removeOutboundRule(idx)} className="inline-flex h-7 items-center justify-center rounded-none border border-slate-300 bg-white px-2 text-[11px] font-medium text-rose-700 hover:border-rose-300 hover:bg-rose-50">삭제</button>
                                  </div>
                                </div>
                              ))
                            ) : null}
                          </div>
                        </fieldset>

                        <div className="mt-3 flex justify-end">
                          <button type="button" onClick={handleSaveSecurity} className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg- slate-50">
                            저장
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <aside className="self-start border border-slate-200 bg-white p-3 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] xl:sticky xl:top-[72px]">
                    <p className="mb-2 text-[12px] font-semibold text-slate-700">인스턴스 정보</p>
                    <div className="space-y-2 border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-700">
                      <p>
                        <span className="font-semibold text-slate-800">이름</span>: {generatedRequest.name || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">태그</span>: {generatedRequest.tags.length > 0 ? generatedRequest.tags.join(", ") : "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">OS 이미지</span>: {selectedImage ? `${selectedImage.osName} ${selectedImage.osVersion}` : "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">사양</span>: {selectedSpec?.specName ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">스토리지</span>: {generatedRequest.storageType} {generatedRequest.storageSize}GB
                      </p>
                      {isViewOnly ? (
                        <>
                          <p>
                            <span className="font-semibold text-slate-800">Public IP</span>: {operateInstance?.publicIp ?? "-"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Private IP</span>: {operateInstance?.privateIp ?? "-"}
                          </p>
                        </>
                      ) : null}
                      <p>
                        <span className="font-semibold text-slate-800">VPC</span>: {selectedVpc?.vpcName ?? "-"}
                      </p>
                    </div>
                    <div className="mt-3 hidden justify-end gap-2 xl:flex">
                      <button
                        type="button"
                        onClick={() => moveToInstanceView("list")}
                        disabled={createRequesting}
                        className="inline-flex h-9 items-center justify-center rounded-none border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        목록으로
                      </button>
                      {isViewOnly ? null : (
                        <button
                          type="submit"
                          form="instance-create-form"
                          disabled={createRequesting}
                          className="inline-flex h-9 items-center justify-center rounded-none border border-[#123b84] bg-[#123b84] px-3 text-[12px] font-semibold text-white shadow-[0_10px_18px_-14px_rgba(18,59,132,0.9)] transition hover:border-[#0f3170] hover:bg-[#0f3170]"
                        >
                          {createRequesting ? "생성 요청 중..." : "인스턴스 생성 요청"}
                        </button>
                      )}
                    </div>
                    {isViewOnly ? null : createRequestError ? (
                      <p className="mt-2 text-[11px] text-rose-600">{createRequestError}</p>
                    ) : null}
                  </aside>
                </>
              )}
              </div>
              )}
            </div>
            </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
