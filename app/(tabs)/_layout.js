import { Tabs } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import DiaryScreen from './diary'; // Make sure the path is correct

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "home",
          tabBarLabelStyle: { color: "#0047AB" },
          headerShown:false,
          tabBarIcon:({focused}) =>
            focused ? (
                <AntDesign name="home" size={24} color="#0047AB" />
            ) : (
                <AntDesign name="home" size={24} color="#000000" />
            )
        }}
        />
        <Tabs.Screen
        name="calendar"
        options={{
          tabBarLabel: "calendar",
          tabBarLabelStyle: { color: "#0047AB" },
          headerShown:false,
          tabBarIcon:({focused}) =>
            focused ? (
                <AntDesign name="calendar" size={24} color="#0047AB" />
            ) : (
                <AntDesign name="calendar" size={24} color="#000000" />
            )
        }}
        />
        <Tabs.Screen
        name="diary"
        options={{
          tabBarLabel: " My Diary",
          tabBarLabelStyle: { color: "#0047AB" },
          headerShown:false,
          tabBarIcon:({focused}) =>
            focused ? (
              <SimpleLineIcons name="notebook" size={24} color="#0047AB" />
            ) : (
              <SimpleLineIcons name="notebook" size={24} color="#000000" />
            )
        }}
        />
        <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "profile",
          tabBarLabelStyle: { color: "#0047AB" },
          headerShown:false,
          tabBarIcon:({focused}) =>
            focused ? (
                <MaterialCommunityIcons name="account-details" size={24} color="#0047AB" />
            ) : (
                <MaterialCommunityIcons name="account-details" size={24} color="#000000" />
            )
        }}
        />
        
    </Tabs>
  );
}

//<uses-permission android:name="android.permission.INTERNET" />
//<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
