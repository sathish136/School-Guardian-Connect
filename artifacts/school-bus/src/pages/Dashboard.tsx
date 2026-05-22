import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Users, Bus, Map, Activity, AlertTriangle, ShieldCheck, CheckCircle2, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 10 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live monitoring and fleet status</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-slate-600 font-medium">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Students On Buses</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-3xl font-bold text-slate-900" data-testid="stat-students-on-bus">{stats?.studentsOnBus ?? 0}</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Trips</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-3xl font-bold text-slate-900" data-testid="stat-active-trips">{stats?.activeTrips ?? 0}</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Today's Scans</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-3xl font-bold text-slate-900" data-testid="stat-today-scans">{stats?.todayScans ?? 0}</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">SMS Delivered</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-3xl font-bold text-slate-900" data-testid="stat-sms-sent">{stats?.smsSentToday ?? 0}</p>
                  {stats?.smsFailedToday ? (
                    <span className="ml-2 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" /> {stats.smsFailedToday} failed
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
            <Radio className="h-5 w-5 mr-2 text-slate-500" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activityLoading ? (
            <div className="p-8 text-center text-slate-500" data-testid="activity-loading">Loading recent activity...</div>
          ) : activity && activity.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activity.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center" data-testid={`activity-item-${item.id}`}>
                  <div className={`p-2 rounded-full mr-4 ${item.scanType === 'board' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.scanType === 'board' ? <ShieldCheck className="h-5 w-5" /> : <Map className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {item.studentName} <span className="font-normal text-slate-500">scanned to</span> <span className="font-semibold text-slate-700">{item.scanType === 'board' ? 'board' : 'alight'}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                      <Bus className="h-3 w-3 mr-1" /> Bus {item.busNumber}
                      <span className="mx-2">•</span>
                      {format(new Date(item.scannedAt), "h:mm:ss a")}
                    </p>
                  </div>
                  {item.smsSent && (
                    <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> SMS Sent
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No activity recorded today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
