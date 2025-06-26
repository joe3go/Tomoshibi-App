
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor: string;
  className?: string;
}

export default function StatCard({ icon: Icon, value, label, iconColor, className = "" }: StatCardProps) {
  return (
    <Card className={`stat-card ${className}`}>
      <CardContent className="stat-content">
        <div className="stat-icon">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="stat-details">
          <p className="stat-value">{value}</p>
          <p className="stat-label">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
