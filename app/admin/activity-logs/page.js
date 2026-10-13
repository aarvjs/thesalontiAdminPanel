"use client";

import React, { useState, useMemo } from "react";
import { ClipboardList, Download, Info } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown from "../../../components/ui/FilterDropdown";
import Pagination from "../../../components/ui/Pagination";
import EmptyState from "../../../components/ui/EmptyState";
import { useAdmin } from "../../../context/AdminContext";
import { formatDateTime } from "../../../lib/utils";

export default function ActivityLogsPage() {
  const { logs, addToast } = useAdmin();

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        !search.trim() ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.target.toLowerCase().includes(search.toLowerCase()) ||
        l.actor.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase());

      const matchResult = resultFilter === "ALL" || l.result === resultFilter;

      return matchSearch && matchResult;
    });
  }, [logs, search, resultFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Activity Logs"
        subtitle="Chronological immutable audit trail of verification decisions, access revocations, and system events."
        actions={
          <button
            type="button"
            onClick={() => addToast("Exporting compliance audit log (JSON/CSV)...", "info")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#292824] bg-white border border-[#E9E4DB] rounded-xl hover:bg-[#F8F6F1] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail</span>
          </button>
        }
      />

      {/* Production Audit Notice */}
      <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DB] text-xs text-[#77746E] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#B96F45] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-[#292824] block mb-0.5">
            Compliance & Security Standard
          </span>
          In production, this log is written directly to append-only write-once storage (WORM) and cannot be tampered with or deleted by administrators, satisfying ISO/IEC 27001 audit compliance.
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by action, target entity, actor or description..."
            />
          </div>

          <FilterDropdown
            value={resultFilter}
            onChange={(val) => {
              setResultFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Audit Results" },
              { value: "Success", label: "Success" },
              { value: "Warning", label: "Warning" },
              { value: "Failed", label: "Failed" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E9E4DB] shadow-xs overflow-hidden">
        {paginatedLogs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No logs found"
            description="Adjust your search criteria to view recorded audit events."
            actionLabel="Reset"
            onAction={() => {
              setSearch("");
              setResultFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#77746E] font-semibold border-b border-[#E9E4DB]">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Action Event</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">Details & Notes</th>
                  <th className="px-5 py-3.5 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE8]">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-[#54514B]">
                      <div className="font-mono text-[#292824]">
                        {formatDateTime(log.timestamp)}
                      </div>
                      <div className="text-[10px] text-[#A09D96] font-mono mt-0.5">
                        {log.id}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[#292824]">{log.actor}</span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F8F6F1] border border-[#E9E4DB] text-[#292824]">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-semibold text-[#292824] block">
                        {log.target}
                      </span>
                      <span className="text-[10px] text-[#77746E]">
                        {log.targetType}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[#54514B] max-w-sm">
                      {log.details}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.result === "Success"
                            ? "bg-[#EBF5EE] text-[#2D6A4F] border border-[#C6E2D0]"
                            : log.result === "Warning"
                            ? "bg-[#FEF6E9] text-[#9A6700] border border-[#F7E1B5]"
                            : "bg-[#FDECEB] text-[#B3392E] border border-[#F7C2BE]"
                        }`}
                      >
                        {log.result === "Success" ? "● Success" : log.result === "Warning" ? "▲ Warning" : "✕ Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
