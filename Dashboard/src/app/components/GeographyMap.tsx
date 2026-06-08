"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@texnomart/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@texnomart/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@texnomart/ui/toggle-group";
import { Button } from "@texnomart/ui/button";
import { Skeleton } from "@texnomart/ui/skeleton";
import { cn } from "@texnomart/ui/utils";

type ViewMode = "regions" | "branches" | "both";

interface RegionData {
  id: string;
  name: string;
  applications: number;
  branches: number;
  path: string; // SVG path data
}

interface BranchData {
  id: string;
  name: string;
  applications: number;
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  regionId: string;
}

// Mock data for 14 regions of Uzbekistan
const mockRegions: RegionData[] = [
  { id: "tashkent-city", name: "Ташкент город", applications: 2847, branches: 15, path: "M 520 180 L 540 180 L 540 200 L 520 200 Z" },
  { id: "tashkent-region", name: "Ташкентская область", applications: 1247, branches: 12, path: "M 480 160 L 580 160 L 580 220 L 540 220 L 540 200 L 520 200 L 520 180 L 480 180 Z" },
  { id: "samarkand", name: "Самаркандская область", applications: 1156, branches: 8, path: "M 380 240 L 480 240 L 480 300 L 380 300 Z" },
  { id: "bukhara", name: "Бухарская область", applications: 892, branches: 6, path: "M 280 260 L 380 260 L 380 340 L 280 340 Z" },
  { id: "andijan", name: "Андижанская область", applications: 1034, branches: 7, path: "M 620 140 L 680 140 L 680 200 L 620 200 Z" },
  { id: "fergana", name: "Ферганская область", applications: 978, branches: 9, path: "M 580 120 L 640 120 L 640 180 L 580 180 Z" },
  { id: "namangan", name: "Наманганская область", applications: 867, branches: 6, path: "M 580 80 L 640 80 L 640 140 L 580 140 Z" },
  { id: "kashkadarya", name: "Кашкадарьинская область", applications: 743, branches: 5, path: "M 340 340 L 440 340 L 440 420 L 340 420 Z" },
  { id: "surkhandarya", name: "Сурхандарьинская область", applications: 612, branches: 4, path: "M 380 420 L 480 420 L 480 500 L 380 500 Z" },
  { id: "khorezm", name: "Хорезмская область", applications: 534, branches: 4, path: "M 120 180 L 200 180 L 200 260 L 120 260 Z" },
  { id: "karakalpakstan", name: "Каракалпакстан", applications: 423, branches: 3, path: "M 60 40 L 220 40 L 220 180 L 60 180 Z" },
  { id: "navoi", name: "Навоийская область", applications: 398, branches: 3, path: "M 220 200 L 340 200 L 340 300 L 220 300 Z" },
  { id: "jizzakh", name: "Джизакская область", applications: 589, branches: 4, path: "M 440 180 L 540 180 L 540 240 L 440 240 Z" },
  { id: "syrdarya", name: "Сырдарьинская область", applications: 456, branches: 3, path: "M 420 140 L 500 140 L 500 200 L 420 200 Z" },
];

// Mock data for 10 branches
const mockBranches: BranchData[] = [
  { id: "1", name: "ТЦ Малика", applications: 482, x: 530, y: 190, regionId: "tashkent-city" },
  { id: "2", name: "Чорсу", applications: 421, x: 525, y: 185, regionId: "tashkent-city" },
  { id: "3", name: "Самарканд центр", applications: 367, x: 430, y: 270, regionId: "samarkand" },
  { id: "4", name: "Бухара филиал", applications: 312, x: 330, y: 300, regionId: "bukhara" },
  { id: "5", name: "Андижан-1", applications: 287, x: 650, y: 170, regionId: "andijan" },
  { id: "6", name: "Фергана-парк", applications: 268, x: 610, y: 150, regionId: "fergana" },
  { id: "7", name: "Наманган центр", applications: 241, x: 610, y: 110, regionId: "namangan" },
  { id: "8", name: "Карши главный", applications: 219, x: 390, y: 380, regionId: "kashkadarya" },
  { id: "9", name: "Термез", applications: 187, x: 430, y: 460, regionId: "surkhandarya" },
  { id: "10", name: "Нукус-плаза", applications: 156, x: 140, y: 110, regionId: "karakalpakstan" },
];

// Heat color scale
const HEAT_COLORS = {
  1: "#FFF7C2", // Lightest
  2: "#FFE680",
  3: "#FFD60A", // Primary
  4: "#E6A609",
  5: "#8C5800", // Darkest
};

function getHeatColor(applications: number): string {
  if (applications >= 2000) return HEAT_COLORS[5];
  if (applications >= 1000) return HEAT_COLORS[4];
  if (applications >= 600) return HEAT_COLORS[3];
  if (applications >= 400) return HEAT_COLORS[2];
  return HEAT_COLORS[1];
}

interface GeographyMapProps {
  loading?: boolean;
}

export function GeographyMap({ loading = false }: GeographyMapProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("both");
  const [hoveredRegion, setHoveredRegion] = React.useState<string | null>(null);
  const [hoveredBranch, setHoveredBranch] = React.useState<string | null>(null);

  const handleRegionClick = (regionId: string) => {
    console.log(`Navigate to /analytics?region=${regionId}`);
    // In real app: router.push(`/analytics?region=${regionId}`)
  };

  if (loading) {
    return (
      <Card className="col-span-12">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-8 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[480px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const showRegions = viewMode === "regions" || viewMode === "both";
  const showBranches = viewMode === "branches" || viewMode === "both";

  return (
    <Card className="col-span-12">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">География заявок</CardTitle>
            <CardDescription className="text-xs text-gray-700 mt-1">
              Тепловая карта по регионам и расположение филиалов
            </CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="h-8"
          >
            <ToggleGroupItem value="regions" className="text-xs px-3 h-8">
              Регионы
            </ToggleGroupItem>
            <ToggleGroupItem value="branches" className="text-xs px-3 h-8">
              Филиалы
            </ToggleGroupItem>
            <ToggleGroupItem value="both" className="text-xs px-3 h-8">
              Оба
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[480px] w-full bg-gray-50 rounded-lg overflow-hidden">
          {/* TODO: replace SVG with Yandex Maps API integration when API key is available */}
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Regions */}
            {showRegions && mockRegions.map((region) => (
              <Tooltip key={region.id}>
                <TooltipTrigger asChild>
                  <path
                    d={region.path}
                    fill={getHeatColor(region.applications)}
                    stroke={hoveredRegion === region.id ? "#FFD60A" : "#E5E7EB"}
                    strokeWidth={hoveredRegion === region.id ? 2 : 1}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter: hoveredRegion === region.id ? "brightness(1.1)" : "none",
                    }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => handleRegionClick(region.id)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <span className="font-semibold">{region.name}</span>
                    {" · "}
                    {region.applications.toLocaleString("ru-RU")} заявок
                    {" · "}
                    {region.branches} филиалов
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Branch pins */}
            {showBranches && mockBranches.map((branch) => (
              <Popover key={branch.id}>
                <PopoverTrigger asChild>
                  <g
                    className="cursor-pointer transition-transform duration-200"
                    style={{
                      transform: hoveredBranch === branch.id ? "scale(1.2)" : "scale(1)",
                      transformOrigin: `${branch.x}px ${branch.y}px`,
                    }}
                    onMouseEnter={() => setHoveredBranch(branch.id)}
                    onMouseLeave={() => setHoveredBranch(null)}
                  >
                    <circle
                      cx={branch.x}
                      cy={branch.y}
                      r="8"
                      fill="#FFD60A"
                      stroke="#000"
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                    />
                    <circle
                      cx={branch.x}
                      cy={branch.y}
                      r="3"
                      fill="#000"
                    />
                  </g>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">{branch.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {branch.applications.toLocaleString("ru-RU")} заявок
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => console.log(`Navigate to /branches/${branch.id}`)}
                    >
                      Открыть филиал
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 right-4">
            <Card className="shadow-md p-3">
              <div className="space-y-2">
                {/* Heatmap gradient */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                    <span>Меньше</span>
                    <span>Больше</span>
                  </div>
                  <div className="h-2 w-[200px] rounded-full overflow-hidden flex">
                    {Object.values(HEAT_COLORS).map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                {/* Branch indicator */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="size-3 rounded-full bg-primary border border-black" />
                  <span className="text-xs text-gray-700">Филиал</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
