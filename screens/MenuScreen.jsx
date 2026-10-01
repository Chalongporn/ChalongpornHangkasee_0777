import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import HamburgerMenu from '../components/HamburgerMenu';

const { width } = Dimensions.get('window');

export default function MenuScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [isAdmin, setIsAdmin] = useState(false); // เช็คว่า User ที่เข้าสู่ระบบเป็น Admin หรือไม่

  useEffect(() => {
    // ฟังก์ชันสำหรับตรวจสถานะ Admin จาก Storage
    const checkAdmin = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("userData");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser.Status === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error checking admin status", error);
      }
    };
    checkAdmin();
  }, []);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HamburgerMenu />

      <View style={styles.content}>
        {/* เมนูจัดการข้อมูล: จะแสดงก็ต่อเมื่อเป็น Admin เท่านั้น */}
        {isAdmin && (
          <TouchableOpacity style={styles.gameCard} onPress={() => navigation.navigate('EditMode')}>
            <Image source={require('../assets/Edit_Mode.png')} style={styles.bannerImage} />
            <Text style={[styles.cardSubTitle, { color: theme.colors.text }]}>จัดการข้อมูล</Text>
          </TouchableOpacity>
        )}

        {/* เมนูเกม (ปุ่มสำหรับเข้าไปหน้าเลือกโหมดเกม) */}
        <TouchableOpacity style={styles.gameCard} onPress={() => navigation.navigate('GameMode')}>
          <Image source={require('../assets/Game.png')} style={styles.bannerImage} />
          <Text style={[styles.cardSubTitle, { color: theme.colors.text }]}>เกม</Text>
        </TouchableOpacity>

        {/* เมนูกระดานคะแนน (Scoreboard) */}
        <TouchableOpacity style={styles.scoreCard} onPress={() => navigation.navigate('Scoreboard')}>
          <Image source={require('../assets/Score.png')} style={styles.bannerImage} />
          <Text style={[styles.cardSubTitle, { color: theme.colors.text }]}>กระดานคะแนน</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBarContainer}>
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.bottomBar }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Ionicons name="home" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GameMode')}>
            <Ionicons name="game-controller" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Scoreboard')}
          ><Ionicons name="podium" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1c' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 80,
    backgroundColor: '#2d2d2d', // สีพื้นหลังแถบข้างบนให้เป็นบล็อกหนาตามรูป

    // จัดให้แสงเงาตกกระทบนิดหน่อยเพื่อความสวยงาม
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  smallAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#444' },
  content: { flex: 1, alignItems: 'center', paddingTop: 30 },

  // ดีไซน์ปุ่ม Game
  gameCard: { width: width * 0.9, aspectRatio: 1467 / 627, marginBottom: 50 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 15, resizeMode: 'contain' },

  // ดีไซน์ปุ่ม Score
  scoreCard: { width: width * 0.9, aspectRatio: 1456 / 600 },
  cardSubTitle: { color: '#fff', fontSize: 16, marginTop: 8, fontWeight: '600' },

  // Bottom Tab Bar Styles
  bottomBarContainer: { alignItems: 'center', paddingBottom: 30 },
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
  }
});