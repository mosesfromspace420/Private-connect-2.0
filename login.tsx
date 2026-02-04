import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await loginMutation.mutateAsync({ email, password });
      await refresh();
      router.replace("/(tabs)");
    } catch (error) {
      const err = error as any;
      setErrors({ submit: err?.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between">
          <View className="gap-8 pt-12">
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">Welcome Back</Text>
              <Text className="text-sm text-muted">Sign in to your PrivateConnect account</Text>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  style={{ color: colors.foreground }}
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  style={{ color: colors.foreground }}
                />
              </View>

              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center gap-2"
              >
                <View
                  className="w-5 h-5 rounded border-2 items-center justify-center"
                  style={{
                    borderColor: rememberMe ? colors.primary : colors.border,
                    backgroundColor: rememberMe ? colors.primary : "transparent",
                  }}
                >
                  {rememberMe && <Text className="text-xs text-background font-bold">✓</Text>}
                </View>
                <Text className="text-sm text-foreground">Remember me</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/auth/reset-password")}