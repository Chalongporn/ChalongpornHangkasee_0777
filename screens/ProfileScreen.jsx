import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../data/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import HeaderWithSidebar from "../components/HamburgerMenu";
import { ThemeContext } from "../context/ThemeContext";

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("userData");
          let userId = route?.params?.userId || "";

          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userId = parsedUser?.UserID || userId;
          }

          if (!userId) {
            console.log("ไม่พบ userId");
            setLoading(false);
            return;
          }

          //ดึงข้อมูลจาก Users
          const userRef = doc(db, "Users", userId);
          const userSnap = await getDoc(userRef);

          //ดึงข้อมูลจาก Score โดยใช้ where("UserID", "==", userId)
          const scoreQuery = query(collection(db, "Score"), where("UserID", "==", userId));
          const scoreSnapshot = await getDocs(scoreQuery);

          let scoreInfo = { round: 0, score: 0 };
          if (!scoreSnapshot.empty) {
            scoreInfo = scoreSnapshot.docs[0].data();
          }

          if (userSnap.exists()) {
            const userInfo = userSnap.data();
            setUserData({
              ...userInfo,
              round: scoreInfo.Round ?? 0,
              score: scoreInfo.Score ?? 0,
            });
          } else {
            console.log("ไม่พบข้อมูลผู้ใช้ใน Firestore");
          }
        } catch (error) {
          console.error("โหลดข้อมูลไม่สำเร็จ:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [route?.params?.userId])
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderWithSidebar showProfileAvatar={false} />

      {/* Title Row */}
      <View style={styles.titleRow}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.colors.card }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.titleText, { color: theme.colors.text }]}>โปรไฟล์ของฉัน</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 100 }} />
        ) : (
          <>
            <View style={[styles.avatarWrapper, { backgroundColor: theme.colors.background }]}>
              <Image 
                source={(userData?.ProfilePic || userData?.Profile_picture) ? { uri: userData.ProfilePic || userData.Profile_picture } : require('../assets/DfProfile.jpg')} 
                style={styles.bigAvatar} 
              />
            </View>

            <Text style={[styles.nameText, { color: theme.colors.text }]}>ชื่อ : {userData?.DisplayName || "Unknown"}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>รอบ</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{userData?.round ?? 0}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>คะแนน</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{userData?.score ?? 0}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBarContainer}>
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.bottomBar }]}>
          <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
            <Ionicons name="home" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GameMode')}>
            <Ionicons name="game-controller" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Scoreboard')}>
            <Ionicons name="podium" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="person" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginTop: 40,
    borderRadius: 75,
    backgroundColor: '#1c1c1c', // ต้องใส่สีพื้นหลังเพื่อให้เงาใน Android เป็นวงกลม
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 10,
  },
  bigAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  nameText: {
    color: '#fff',
    fontSize: 20,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 60,
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  statLabel: {
    color: '#ddd',
    fontSize: 18,
    marginBottom: 15,
  },
  statValue: {
    color: '#fff',
    fontSize: 65,
    fontWeight: '300', // Thin font to match design
  },
  bottomBarContainer: {
    alignItems: 'center',
    paddingBottom: 30
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '85%',
    backgroundColor: '#2d2d2d',
    paddingVertical: 15,
    borderRadius: 35,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 }
  },
});
