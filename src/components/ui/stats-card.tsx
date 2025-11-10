import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "blue" | "green" | "orange" | "purple";
  description?: string;
  className?: string;
}

const colorClasses = {
  primary: {
    bg: "bg-blue-50",
    border: "border-blue-400", 
    text: "text-blue-600",
    icon: "text-blue-500"
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-600", 
    icon: "text-green-500"
  },
  warning: {
    bg: "bg-orange-50",
    border: "border-orange-400",
    text: "text-orange-600",
    icon: "text-orange-500"
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-400", 
    text: "text-red-600",
    icon: "text-red-500"
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-600",
    icon: "text-blue-500"
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-600",
    icon: "text-blue-500"
  },
  green: {
    bg: "bg-green-50", 
    border: "border-green-400",
    text: "text-green-600",
    icon: "text-green-500"
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-400",
    text: "text-orange-600",
    icon: "text-orange-500"
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-400", 
    text: "text-purple-600",
    icon: "text-purple-500"
  }
};

export const StatsCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = "primary", 
  description,
  className = ""
}: StatsCardProps) => {
  const colors = colorClasses[color];
  
  return (
    <div className={`p-4 ${colors.bg} rounded-lg border-l-4 ${colors.border} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-white/50 ${colors.icon}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};
