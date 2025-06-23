import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  MapPin,
} from "lucide-react";
import type { ActivityWithRelations } from "@/types";

interface RecentActivitiesProps {
  activities: ActivityWithRelations[];
}

const activityIcons = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  MEETING: Calendar,
  VISIT: MapPin,
  FOLLOW_UP: Users,
  PRESENTATION: Users,
  OTHER: Users,
  SAMPLE_DROP: Users,
  ORDER_COLLECTION: Users,
};

const activityColors = {
  CALL: "bg-blue-100 text-blue-800",
  EMAIL: "bg-green-100 text-green-800",
  WHATSAPP: "bg-emerald-100 text-emerald-800",
  MEETING: "bg-purple-100 text-purple-800",
  VISIT: "bg-orange-100 text-orange-800",
  FOLLOW_UP: "bg-yellow-100 text-yellow-800",
  PRESENTATION: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-gray-100 text-gray-800",
  SAMPLE_DROP: "bg-gray-100 text-gray-800",
  ORDER_COLLECTION: "bg-gray-100 text-gray-800",
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No recent activities
          </p>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={activity.user.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback className="text-xs">
                    {activity.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={activityColors[activity.type]}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {activity.type.toLowerCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{activity.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    with {activity.prospect.name}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
