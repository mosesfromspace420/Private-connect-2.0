import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { trpc } from "@/lib/trpc";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "undetermined">("undetermined");
  
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  
  const registerTokenMutation = trpc.pushNotifications.registerToken.useMutation();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Register token with backend
        const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
        registerTokenMutation.mutate({ token, platform });
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationResponse = (data: Record<string, unknown>) => {
    // Handle navigation based on notification type
    const type = data.type as string;
    const targetId = data.targetId as number;
    
    // Navigation will be handled by the app based on type
    // Types: follow, like, comment, message, mention, group, system
    console.log("Notification tapped:", type, targetId);
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status === "granted" ? "granted" : "denied");
    
    if (status === "granted") {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
        registerTokenMutation.mutate({ token, platform });
      }
    }
    
    return status === "granted";
  };

  return {
    expoPushToken,
    notification,
    permissionStatus,
    requestPermission,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0a7ea4",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }
    
    try {
      // Get Expo push token - projectId is optional in development
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined,
      });
      token = tokenData.data;
    } catch (error) {
      console.log("Error getting push token:", error);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

// Helper to schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  seconds = 1
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: seconds > 0 ? { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
      seconds,
    } : null,
  });
}
