"use client";

import * as React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Badge } from "@texnomart/ui/badge";
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications-mock-data";

interface KanbanViewProps {
  applications: Application[];
  onStatusChange?: (applicationId: string, newStatus: ApplicationStatus) => void;
  onApplicationClick?: (applicationId: string) => void;
}

const KANBAN_STATUSES: ApplicationStatus[] = [
  "new",
  "scoring",
  "in_progress",
  "awaiting_docs",
  "approved",
  "rejected",
];

export function KanbanView({
  applications,
  onStatusChange,
  onApplicationClick,
}: KanbanViewProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-6 gap-3 h-[calc(100vh-280px)] min-h-[500px]">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={applications.filter((app) => app.status === status)}
            onStatusChange={onStatusChange}
            onApplicationClick={onApplicationClick}
          />
        ))}
      </div>
    </DndProvider>
  );
}

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  onStatusChange?: (applicationId: string, newStatus: ApplicationStatus) => void;
  onApplicationClick?: (applicationId: string) => void;
}

function KanbanColumn({
  status,
  applications,
  onStatusChange,
  onApplicationClick,
}: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "APPLICATION_CARD",
    drop: (item: { id: string }) => {
      if (onStatusChange) {
        onStatusChange(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`flex flex-col bg-gray-50 rounded-md ${
        isOver ? "bg-blue-50" : ""
      } transition-colors`}
    >
      {/* Column Header */}
      <div className="p-2 border-b bg-white rounded-t-md">
        <div className="flex items-center justify-between gap-1">
          <Badge
            className={`${APPLICATION_STATUSES[status].bg} ${
              APPLICATION_STATUSES[status].text
            } border-0 text-[10px] px-1.5 py-0.5`}
          >
            {APPLICATION_STATUSES[status].label}
          </Badge>
          <span className="text-xs text-gray-600 font-medium">{applications.length}</span>
        </div>
      </div>

      {/* Column Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onClick={() => onApplicationClick?.(app.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "APPLICATION_CARD",
    item: { id: application.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded p-2 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* ID */}
      <div className="font-mono text-[10px] text-gray-600 mb-1">{application.id}</div>

      {/* Client */}
      <div className="text-xs font-medium truncate mb-1 text-gray-900">
        {application.client.name}
      </div>

      {/* Amount */}
      <div className="text-xs font-semibold tabular-nums text-gray-700 mb-1">
        {(application.amount / 1000000).toFixed(1)}M
      </div>

      {/* Partner - compact */}
      <div className="text-[10px] text-gray-600 truncate">
        {application.partners[0]?.name}
        {application.partners.length > 1 && ` +${application.partners.length - 1}`}
      </div>
    </div>
  );
}
