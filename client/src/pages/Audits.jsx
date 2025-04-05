import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowUpDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuditLogs } from "@/mocks/auditLogs";

export default function Audits() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await getAuditLogs(token);
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setError("Failed to fetch audit logs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const filteredAndSortedLogs = useMemo(() => {
    let filteredLogs = [...logs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.action?.toLowerCase().includes(query) ||
          log.user?.toLowerCase().includes(query) ||
          log.resource?.toLowerCase().includes(query) ||
          log.details?.toLowerCase().includes(query)
      );
    }

    // Apply action filter
    if (actionFilter !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.action?.toLowerCase() === actionFilter.toLowerCase()
      );
    }

    // Apply user filter
    if (userFilter !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.user?.toLowerCase() === userFilter.toLowerCase()
      );
    }

    // Apply sorting
    filteredLogs.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === "timestamp") {
        return sortConfig.direction === "asc"
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filteredLogs;
  }, [logs, searchQuery, actionFilter, userFilter, sortConfig]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action).filter(Boolean));
    return ["all", ...Array.from(actions)];
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    const users = new Set(logs.map((log) => log.user).filter(Boolean));
    return ["all", ...Array.from(users)];
  }, [logs]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white dark:bg-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {error}
                </h3>
                <Button
                  onClick={fetchLogs}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white dark:bg-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueActions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action === "all" ? "All Actions" : action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Filter by user" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user === "all" ? "All Users" : user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("timestamp")}
                        className="flex items-center gap-1"
                      >
                        Timestamp
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("action")}
                        className="flex items-center gap-1"
                      >
                        Action
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("user")}
                        className="flex items-center gap-1"
                      >
                        User
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-slate-500 dark:text-slate-400"
                      >
                        No logs found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>{truncateText(log.action)}</TableCell>
                        <TableCell>{truncateText(log.user)}</TableCell>
                        <TableCell>{truncateText(log.resource)}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getStatusColor(log.status)
                            )}
                          >
                            {log.status || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={log.details}>
                            {truncateText(log.details, 100)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 