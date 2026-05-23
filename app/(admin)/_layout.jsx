import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const hidden = { href: null, headerShown: false };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
        tabBarStyle: {
          backgroundColor: COLORS.indigoDark,
          borderTopWidth: 0,
          paddingTop: 5,
          paddingBottom: insets.bottom || 6,
          height: 58 + (insets.bottom || 0),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 15,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: "Books",
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="add-book" options={hidden} />
      <Tabs.Screen name="edit-admin-profile" options={hidden} />
      <Tabs.Screen name="issue-book" options={hidden} />
      <Tabs.Screen name="return-book" options={hidden} />
      <Tabs.Screen name="send-notification" options={hidden} />
      <Tabs.Screen name="register-user" options={hidden} />
      <Tabs.Screen name="reports" options={hidden} />
      <Tabs.Screen name="security" options={hidden} />
      <Tabs.Screen name="book-detail" options={hidden} />
      <Tabs.Screen name="issued-records"   options={hidden} />
      <Tabs.Screen name="returned-records" options={hidden} />
      <Tabs.Screen name="admins-list"      options={hidden} />
    </Tabs>
  );
}
