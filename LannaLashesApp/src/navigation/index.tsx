/**
 * Root Navigation
 * Bottom tab navigator + nested stack navigators for each section
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ShopScreen       from '../screens/ShopScreen';
import AcademyScreen    from '../screens/AcademyScreen';
import CommunityScreen  from '../screens/CommunityScreen';
import ProfileScreen    from '../screens/ProfileScreen';

// Lazy imports for detail screens (keep bundle lean)
const ProductDetailScreen  = React.lazy(() => import('../screens/ProductDetailScreen'));
const CartScreen           = React.lazy(() => import('../screens/CartScreen'));
const CourseDetailScreen   = React.lazy(() => import('../screens/CourseDetailScreen'));
const CoursePlayerScreen   = React.lazy(() => import('../screens/CoursePlayerScreen'));
const CourseCheckoutScreen = React.lazy(() => import('../screens/CourseCheckoutScreen'));
const PostDetailScreen     = React.lazy(() => import('../screens/PostDetailScreen'));
const NewPostScreen        = React.lazy(() => import('../screens/NewPostScreen'));
const AuthScreen           = React.lazy(() => import('../screens/AuthScreen'));
const EditProfileScreen    = React.lazy(() => import('../screens/EditProfileScreen'));
const OrdersScreen         = React.lazy(() => import('../screens/OrdersScreen'));

import { Colors, Typography, Spacing } from '../theme';
import { useCartStore } from '../store/cartStore';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab bar icon component ───────────────────────────────────────────────────

type TabIconProps = { label: string; focused: boolean; icon: string };

function TabIcon({ label, focused, icon }: TabIconProps) {
  return (
    <View style={tabStyles.wrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{icon}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3, paddingTop: 6 },
  icon: { fontSize: 20, color: Colors.light },
  iconActive: { color: Colors.black },
  label: {
    fontFamily: 'InterTight-Medium', fontSize: 9,
    letterSpacing: 0.1, color: Colors.light, textTransform: 'uppercase',
  },
  labelActive: { color: Colors.black },
});

// ─── Individual stack navigators ─────────────────────────────────────────────

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopHome" component={ShopScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen as any} options={{ presentation: 'card' }} />
      <Stack.Screen name="Cart" component={CartScreen as any} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function AcademyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AcademyHome"    component={AcademyScreen} />
      <Stack.Screen name="CourseDetail"   component={CourseDetailScreen   as any} />
      <Stack.Screen name="CoursePlayer"   component={CoursePlayerScreen   as any} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="CourseCheckout" component={CourseCheckoutScreen as any} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityHome" component={CommunityScreen} />
      <Stack.Screen name="PostDetail"    component={PostDetailScreen as any} />
      <Stack.Screen name="NewPost"       component={NewPostScreen    as any} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome"   component={ProfileScreen} />
      <Stack.Screen name="Auth"          component={AuthScreen          as any} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditProfile"   component={EditProfileScreen   as any} />
      <Stack.Screen name="Orders"        component={OrdersScreen        as any} />
      <Stack.Screen name="MyCourses"     component={AcademyScreen} />
      <Stack.Screen name="Certificates"  component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={ProfileScreen} />
      <Stack.Screen name="PaymentMethods"component={ProfileScreen} />
      <Stack.Screen name="Privacy"       component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// ─── Root tab navigator ───────────────────────────────────────────────────────

function RootTabs() {
  const totalItems = useCartStore(s => s.totalItems());

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Shop"
        component={ShopStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Shop" focused={focused} icon="⊡" />
          ),
        }}
      />
      <Tab.Screen
        name="Academy"
        component={AcademyStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Academy" focused={focused} icon="◈" />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Community" focused={focused} icon="◎" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" focused={focused} icon="◌" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── App entry ────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootTabs />
    </NavigationContainer>
  );
}
