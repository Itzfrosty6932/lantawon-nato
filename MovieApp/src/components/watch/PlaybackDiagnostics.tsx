"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldAlert,
  Wifi,
  Smartphone,
  BarChart2,
  Activity,
  Server,
  Cpu,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";
import { NetworkGuard } from "@/lib/utils/network-guard";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import type { PlayerMetrics } from "@/types/stream";

interface PlaybackDiagnosticsProps {
  metrics: PlayerMetrics;
  activeServer: string;
  dataUsedMb: number;
  onSelectServer?: (serverId: string) => void;
}

interface StatCellProps {
  label: string;
  value: string;
  accent?: "green" | "amber" | "red" | "cyan" | "default";
  icon?: React.ReactNode;
}

function StatCell({ label, value, accent = "default", icon }: StatCellProps) {
  const colorMap: Record<string, string> = {
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    cyan: "text-cyan-400",
    default: "text-white",
  };
  return (
    <div className="rounded-xl bg-[#18191a] p-3 border border-zinc-800 space-y-1">
      <div className="text-[10px] text-zinc-500 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className={`font-mono font-bold text-sm ${colorMap[accent]}`}>
        {value}
      </div>
    </div>
  );
}

export function PlaybackDiagnostics({
  metrics,
  activeServer,
  dataUsedMb,
  onSelectServer,
}: PlaybackDiagnosticsProps) {
  const { showToast } = useToast();
  const [dataSaver, setDataSaver] = useState(false);
  const [dataLimitMb, setDataLimitMb] = useState(1000);
  const [netStatus, setNetStatus] = useState({
    isCellular: false,
    effectiveType: "4g",
    estimatedMbps: 0,
  });
  const [activeTab, setActiveTab] = useState<"data" | "stream">("data");

  useEffect(() => {
    const status = NetworkGuard.getNetworkStatus();
    setDataSaver(status.isDataSaver);
    setNetStatus({
      isCellular: status.isCellular,
      effectiveType: status.effectiveType,
      estimatedMbps: Math.round((status.estimatedKbps / 1000) * 10) / 10,
    });
    setDataLimitMb(NetworkGuard.getDataLimitMb());
  }, []);

  const handleToggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaver(next);
    NetworkGuard.setDataSaver(next);
    audioFX.playPop();
    showToast(
      next
        ? "⚡ Stream Data Saver ON · Lower bitrate selected"
        : "Stream Data Saver OFF · High-bitrate profile restored",
      "info"
    );
  };

  const handleChangeLimit = (val: number) => {
    setDataLimitMb(val);
    NetworkGuard.setDataLimitMb(val);
    audioFX.playClick();
    showToast(`Data alert limit set to ${val} MB`, "info");
  };

  const qoeColor: "green" | "amber" | "red" =
    (metrics.qoeScore ?? 0) >= 90 ? "green" : (metrics.qoeScore ?? 0) >= 70 ? "amber" : "red";
  const bandwidthMbps = ((metrics.bandwidthKbps ?? 0) / 1000).toFixed(1);
  const activeServerObj = STREAM_SERVERS.find((s) => s.id === activeServer);

  return (
    <div className="space-y-3">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl bg-[#18191a] p-1 border border-zinc-800 text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === "data" ? "bg-[#E50914] text-white shadow" : "text-zinc-400 hover:text-white"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Data Guard
        </button>
        <button
          onClick={() => setActiveTab("stream")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === "stream" ? "bg-[#E50914] text-white shadow" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> Stream Diagnostics
        </button>
      </div>

      {/* Panel: Data Guard */}
      {activeTab === "data" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Data Saver Toggle */}
            <div className="rounded-xl bg-[#18191a] p-3 border border-zinc-700/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className={`h-3.5 w-3.5 ${dataSaver ? "text-amber-400 fill-amber-400" : "text-zinc-400"}`} />
                  Stream Data Saver
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {dataSaver ? "Saves up to 60% video bandwidth" : "Standard High-Bitrate Profile"}
                </p>
              </div>
              <button
                onClick={handleToggleDataSaver}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  dataSaver ? "bg-amber-500 text-zinc-950 shadow-md" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {dataSaver ? "ACTIVE" : "OFF"}
              </button>
            </div>

            {/* Session Data Used */}
            <div className="rounded-xl bg-[#18191a] p-3 border border-zinc-700/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
                  Session Data Used
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Estimated transfer this session</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xl font-black text-emerald-400">{dataUsedMb}</span>
                <span className="text-[10px] font-mono text-zinc-400 ml-1">MB</span>
              </div>
            </div>

            {/* Data Alert Limit */}
            <div className="rounded-xl bg-[#18191a] p-3 border border-zinc-700/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
                  Alert Limit
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Warn before reaching this limit</p>
              </div>
              <select
                value={dataLimitMb}
                onChange={(e) => handleChangeLimit(parseInt(e.target.value, 10))}
                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value={300}>300 MB</option>
                <option value={500}>500 MB</option>
                <option value={1000}>1 GB</option>
                <option value={2000}>2 GB</option>
                <option value={5000}>5 GB</option>
              </select>
            </div>
          </div>

          {/* Network status card */}
          <div className="rounded-xl bg-[#18191a] p-3 border border-zinc-800 flex items-center gap-3">
            {netStatus.isCellular ? (
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="h-4 w-4 text-amber-400" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Wifi className="h-4 w-4 text-emerald-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">
                {netStatus.isCellular
                  ? `Cellular Network · ${netStatus.effectiveType.toUpperCase()}`
                  : "Wi-Fi / High-Speed Network"}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {netStatus.isCellular
                  ? "⚠️ Mobile data active. Data Saver recommended to reduce costs."
                  : "Fast network detected. Full quality streaming available."}
              </div>
            </div>
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${netStatus.isCellular ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          </div>

          <div className="rounded-xl bg-[#18191a] p-3 border border-zinc-800 text-xs text-zinc-400">
            <span className="text-white font-semibold">📊 Estimated hourly usage:</span>{" "}
            {dataSaver ? "~260 MB/hr (360p Data Saver mode)" : "~2,000 MB/hr (720p Standard)"}
          </div>
        </div>
      )}

      {/* Panel: Stream Diagnostics */}
      {activeTab === "stream" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCell label="QoE Score" value={`${metrics.qoeScore ?? 0} / 100`} accent={qoeColor} icon={<CheckCircle2 className="h-3 w-3" />} />
            <StatCell label="Bandwidth" value={`${bandwidthMbps} Mbps`} accent="green" icon={<Radio className="h-3 w-3" />} />
            <StatCell label="Buffer Ahead" value={`${(metrics.bufferedSeconds ?? 0).toFixed(1)}s`} accent="cyan" icon={<Clock className="h-3 w-3" />} />
            <StatCell
              label="A/V Sync Drift"
              value={`${(metrics.avDriftMs ?? 0).toFixed(2)} ms`}
              accent={(metrics.avDriftMs ?? 0) < 10 ? "green" : (metrics.avDriftMs ?? 0) < 50 ? "amber" : "red"}
              icon={<Activity className="h-3 w-3" />}
            />
            <StatCell label="Decoded Frames" value={`${(metrics.decodedFrames ?? 0).toLocaleString()}`} icon={<Cpu className="h-3 w-3" />} />
            <StatCell label="Dropped Frames" value={`${metrics.droppedFrames ?? 0}`} accent={(metrics.droppedFrames ?? 0) === 0 ? "green" : "amber"} icon={<AlertTriangle className="h-3 w-3" />} />
            <StatCell label="Rebuffer Events" value={`${metrics.rebufferCount ?? 0}×`} accent={(metrics.rebufferCount ?? 0) === 0 ? "green" : "red"} icon={<Activity className="h-3 w-3" />} />
            <StatCell label="Active Mirror" value={activeServerObj?.name ?? activeServer} icon={<Server className="h-3 w-3" />} />
          </div>

          {/* Network type info row */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 px-1">
            {netStatus.isCellular ? (
              <Smartphone className="h-3 w-3 text-amber-400" />
            ) : (
              <Wifi className="h-3 w-3 text-emerald-400" />
            )}
            <span>
              Network:{" "}
              <span className="text-zinc-300 font-mono">
                {netStatus.isCellular ? `Cellular (${netStatus.effectiveType.toUpperCase()})` : "High-Speed Network"}
              </span>
            </span>
          </div>

          {/* Server switcher pills */}
          {onSelectServer && (
            <div className="space-y-2">
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest px-1">
                Switch Stream Mirror
              </div>
              <div className="flex flex-wrap gap-2">
                {STREAM_SERVERS.slice(0, 8).map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      audioFX.playClick();
                      onSelectServer(server.id);
                      showToast(`Switched to ${server.name}`, "info");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                      activeServer === server.id
                        ? "bg-[#E50914] text-white border-[#E50914]"
                        : "bg-[#18191a] text-zinc-300 border-zinc-700/80 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
