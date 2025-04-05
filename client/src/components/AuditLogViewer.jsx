import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const API = "http://localhost:5000/api";

export default function AuditLogViewer({ token }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) fetchLogs();
  }, [token]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE":
        return "text-green-500";
      case "UPDATE":
        return "text-blue-500";
      case "DELETE":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDetails = (action, details) => {
    try {
      const parsedDetails = JSON.parse(details);
      switch (action) {
        case "CREATE":
          return `Created todo: "${parsedDetails.title}"`;
        case "UPDATE":
          return Object.entries(parsedDetails)
            .map(([key, value]) => {
              if (key === "completed") {
                return `Status changed from ${value.from ? "completed" : "active"} to ${
                  value.to ? "completed" : "active"
                }`;
              }
              return `${key} changed from "${value.from}" to "${value.to}"`;
            })
            .join(", ");
        case "DELETE":
          return `Deleted todo: "${parsedDetails.title}"`;
        default:
          return details;
      }
    } catch (err) {
      return details;
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No activity yet</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      log.action === "CREATE"
                        ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
                        : log.action === "UPDATE"
                        ? "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-l-red-500 bg-red-50 dark:bg-red-900/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {formatDetails(log.action, log.details)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          getActionColor(log.action)
                        )}
                      >
                        {log.action}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 