import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingReports: number;
}

interface Report {
  id: number;
  reporterId: number;
  contentType: string;
  contentId: number;
  reportedUserId: number;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
}

interface AdminUser {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  lastSignedIn: Date;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "users" | "moderation">("overview");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const getStatsMutation = trpc.admin.getStats.useMutation();
  const getReportsMutation = trpc.moderation.getReports.useMutation();
  const getUsersMutation = trpc.admin.getUsers.useMutation();
  const resolveReportMutation = trpc.moderation.resolveReport.useMutation();
  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      Alert.alert("Access Denied", "You do not have admin privileges.");
      router.back();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [statsData, reportsData, usersData] = await Promise.all([
        getStatsMutation.mutateAsync(),
        getReportsMutation.mutateAsync({ status: "pending", limit: 50, offset: 0 }),
        getUsersMutation.mutateAsync({ limit: 50, offset: 0 }),
      ]);
      setStats(statsData);
      setReports(reportsData as Report[]);
      setUsers(usersData as AdminUser[]);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleResolveReport = async (reportId: number, resolution: "warning" | "content_removed" | "user_suspended" | "user_banned" | "no_action") => {
    try {
      await resolveReportMutation.mutateAsync({
        reportId,
        resolution,
        notes: `Resolved by admin ${user?.name || user?.email}`,
      });
      Alert.alert("Success", "Report resolved successfully");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to resolve report");
    }
  };

  const handleToggleAdmin = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserRoleMutation.mutateAsync({ userId, role: newRole });
      Alert.alert("Success", `User role updated to ${newRole}`);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to update user role");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground text-lg">Access Denied</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="p-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground">Admin Dashboard</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-border">
          {(["overview", "reports", "users", "moderation"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-3 items-center ${activeTab === tab ? "border-b-2 border-primary" : ""}`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`capitalize ${activeTab === tab ? "text-primary font-semibold" : "text-muted"}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <View className="p-4">
            <Text className="text-lg font-bold text-foreground mb-4">Platform Statistics</Text>
            
            <View className="flex-row flex-wrap gap-4">
              <View className="bg-surface rounded-xl p-4 flex-1 min-w-[140px]">
                <Text className="text-muted text-sm">Total Users</Text>
                <Text className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</Text>
              </View>
              
              <View className="bg-surface rounded-xl p-4 flex-1 min-w-[140px]">
                <Text className="text-muted text-sm">Total Posts</Text>
                <Text className="text-2xl font-bold text-foreground">{stats?.totalPosts || 0}</Text>
              </View>
              
              <View className="bg-surface rounded-xl p-4 flex-1 min-w-[140px]">
                <Text className="text-muted text-sm">Total Reports</Text>
                <Text className="text-2xl font-bold text-foreground">{stats?.totalReports || 0}</Text>
              </View>
              
              <View className="bg-surface rounded-xl p-4 flex-1 min-w-[140px]">
                <Text className="text-muted text-sm">Pending Reports</Text>
                <Text className="text-2xl font-bold text-error">{stats?.pendingReports || 0}</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <Text className="text-lg font-bold text-foreground mt-6 mb-4">Quick Actions</Text>
            <View className="gap-3">
              <TouchableOpacity
                className="bg-primary rounded-xl p-4 flex-row items-center"
                onPress={() => setActiveTab("reports")}
              >
                <Text className="text-background font-semibold flex-1">Review Pending Reports</Text>
                <Text className="text-background font-bold">{stats?.pendingReports || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-surface rounded-xl p-4 flex-row items-center"
                onPress={() => setActiveTab("users")}
              >
                <Text className="text-foreground font-semibold flex-1">Manage Users</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <View className="p-4">
            <Text className="text-lg font-bold text-foreground mb-4">
              Pending Reports ({reports.length})
            </Text>
            
            {reports.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 items-center">
                <Text className="text-success text-lg font-semibold">All Clear!</Text>
                <Text className="text-muted mt-2">No pending reports to review</Text>
              </View>
            ) : (
              <View className="gap-4">
                {reports.map((report) => (
                  <View key={report.id} className="bg-surface rounded-xl p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">
                          {report.contentType.toUpperCase()} #{report.contentId}
                        </Text>
                        <Text className="text-error text-sm font-medium mt-1">
                          Reason: {report.reason.replace("_", " ")}
                        </Text>
                      </View>
                      <View className="bg-warning/20 px-2 py-1 rounded">
                        <Text className="text-warning text-xs font-semibold">{report.status}</Text>
                      </View>
                    </View>
                    
                    {report.description && (
                      <Text className="text-muted text-sm mb-3">{report.description}</Text>
                    )}
                    
                    <Text className="text-muted text-xs mb-3">
                      Reported User ID: {report.reportedUserId} • Reporter ID: {report.reporterId}
                    </Text>
                    
                    <View className="flex-row gap-2 flex-wrap">
                      <TouchableOpacity
                        className="bg-error/20 px-3 py-2 rounded-lg"
                        onPress={() => handleResolveReport(report.id, "content_removed")}
                      >
                        <Text className="text-error text-sm font-medium">Remove Content</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="bg-warning/20 px-3 py-2 rounded-lg"
                        onPress={() => handleResolveReport(report.id, "warning")}
                      >
                        <Text className="text-warning text-sm font-medium">Warn User</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="bg-muted/20 px-3 py-2 rounded-lg"
                        onPress={() => handleResolveReport(report.id, "no_action")}
                      >
                        <Text className="text-muted text-sm font-medium">Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <View className="p-4">
            <Text className="text-lg font-bold text-foreground mb-4">
              User Management ({users.length})
            </Text>
            
            <View className="gap-3">
              {users.map((u) => (
                <View key={u.id} className="bg-surface rounded-xl p-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        {u.name || "No Name"}
                      </Text>
                      <Text className="text-muted text-sm">{u.email}</Text>
                      <Text className="text-muted text-xs mt-1">
                        Joined: {new Date(u.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View className="items-end">
                      <View className={`px-2 py-1 rounded mb-2 ${u.role === "admin" ? "bg-primary/20" : "bg-muted/20"}`}>
                        <Text className={`text-xs font-semibold ${u.role === "admin" ? "text-primary" : "text-muted"}`}>
                          {u.role.toUpperCase()}
                        </Text>
                      </View>
                      
                      {u.id !== user?.id && (
                        <TouchableOpacity
                          className="bg-surface border border-border px-3 py-1 rounded"
                          onPress={() => handleToggleAdmin(u.id, u.role)}
                        >
                          <Text className="text-foreground text-xs">
                            {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Moderation Tab */}
        {activeTab === "moderation" && (
          <View className="p-4">
            <Text className="text-lg font-bold text-foreground mb-4">Moderation Tools</Text>
            
            <View className="gap-4">
              <View className="bg-surface rounded-xl p-4">
                <Text className="text-foreground font-semibold mb-2">Auto-Moderation Rules</Text>
                <Text className="text-muted text-sm mb-3">
                  Configure automatic content filtering and flagging rules.
                </Text>
                <View className="gap-2">
                  <View className="flex-row justify-between items-center py-2 border-b border-border">
                    <Text className="text-foreground">Profanity Filter</Text>
                    <View className="bg-success/20 px-2 py-1 rounded">
                      <Text className="text-success text-xs">Active</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-b border-border">
                    <Text className="text-foreground">Spam Detection</Text>
                    <View className="bg-success/20 px-2 py-1 rounded">
                      <Text className="text-success text-xs">Active</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-foreground">Image Moderation</Text>
                    <View className="bg-warning/20 px-2 py-1 rounded">
                      <Text className="text-warning text-xs">Coming Soon</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View className="bg-surface rounded-xl p-4">
                <Text className="text-foreground font-semibold mb-2">Kindness Leaderboard</Text>
                <Text className="text-muted text-sm mb-3">
                  Users with the highest positive interaction scores.
                </Text>
                <TouchableOpacity className="bg-primary/20 rounded-lg p-3">
                  <Text className="text-primary text-center font-medium">View Leaderboard</Text>
                </TouchableOpacity>
              </View>
              
              <View className="bg-surface rounded-xl p-4">
                <Text className="text-foreground font-semibold mb-2">Community Guidelines</Text>
                <Text className="text-muted text-sm mb-3">
                  Manage and update community guidelines and terms of service.
                </Text>
                <TouchableOpacity className="bg-muted/20 rounded-lg p-3">
                  <Text className="text-foreground text-center font-medium">Edit Guidelines</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
