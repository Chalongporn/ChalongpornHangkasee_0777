import React, { useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../data/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import HeaderWithSidebar from "../components/HamburgerMenu";
import { ThemeContext } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function ScoreboardScreen({ navigation }) {
  const { theme } = useContext(ThemeContext); // ดึงค่าสีพื้นหลังและสีตัวอักษร
  const [players, setPlayers] = useState([]); // State สำหรับเก็บข้อมูลผู้เล่นและคะแนนทั้งหมด
  const [loading, setLoading] = useState(true); // State ควบคุมการแสดงสัญลักษณ์กำลังโหลด (ActivityIndicator)
  const [refreshing, setRefreshing] = useState(false); // State ควบคุมการดึงเพื่อรีเฟรช

  const fetchScoresData = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    try {
      const snapshot = await getDocs(collection(db, "Score"));
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          username: d.Username || "Unknown",
          totalScore: d.Score ?? 0,
        };
      });

      // เรียงลำดับข้อมูลจากคะแนนมากไปน้อย (descending)
      const sortedData = data.sort((a, b) => b.totalScore - a.totalScore);

      setPlayers(sortedData); // อัปเดตข้อมูลผู้เล่นที่เรียงลำดับแล้วลงใน State
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchScoresData(true);
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScoresData(false);
    setRefreshing(false);
  };

  // ฟังก์ชันคำนวณและแสดงเหรียญรางวัลสำหรับอันดับ 2 เป็นต้นไป
  const renderRankBadge = (index) => {
    const actualRank = index + 2; // +2 เพราะคนแรก (อันดับ 1) ถูกแยกไปแสดงในการ์ด Champion แล้ว

    // ตกแต่งป้ายอันดับ 2 (เหรียญเงิน)
    if (actualRank === 2) {
      return (
        <View style={[styles.rankBadge, { backgroundColor: '#e0e0e0' }]}>
          <Text style={[styles.rankNumber, { color: '#777' }]}>2</Text>
        </View>
      );
    }
    if (actualRank === 3) {
      return (
        <View style={[styles.rankBadge, { backgroundColor: '#cd7f32' }]}>
          <Text style={[styles.rankNumber, { color: '#6b3e0c' }]}>3</Text>
        </View>
      );
    }
    return (
      <View style={styles.rankNoBadge}>
        <Text style={[styles.rankNumberTextOnly, { color: '#555' }]}>{actualRank}</Text>
      </View>
    );
  };

  // ฟังก์ชันสร้าง UI ให้กับผู้เล่นในรายการของ FlatList
  const renderItem = ({ item, index }) => (
    <View style={styles.scoreItem}>
      {renderRankBadge(index)}
      <View style={styles.playerBlock}>
        <Text style={styles.playerName}>{item.username}</Text>
        <Text style={styles.playerScore}>คะแนน : {item.totalScore}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderWithSidebar />

      {/* Title Row */}
      <View style={styles.titleRow}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.colors.card }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.titleText, { color: theme.colors.text }]}>กระดานคะแนน</Text>
      </View>

      {/* กระดานคะแนนหลัก */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 100 }} />
      ) : (
        <View style={styles.boardWrapper}>

          {/* การ์ดแชมป์เปี้ยน (อันดับ 1) จะแสดงเฉพาะเมื่อมีผู้เล่นมากกว่า 0 คน */}
          {players.length > 0 && (
            <View style={styles.championCard}>
              <View style={styles.championBadge}>
                <Text style={styles.championBadgeText}>1</Text>
              </View>
              <View style={styles.championInfo}>
                <Text style={styles.championName}>{players[0].username || "Champion"}</Text>
                <Text style={styles.championScore}>คะแนน : {players[0].totalScore}</Text>
              </View>
            </View>
          )}

          {/* รายการกระดานอันดับที่ 2 เป็นต้นไป (กล่องสีเทา) */}
          <View style={styles.greyBackground}>
            <FlatList
              data={players.slice(1)} // ข้ามข้อมูลคนแรกไป (อันดับ 1)
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.text}
                />
              }
            />
          </View>

        </View>
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBarContainer}>
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.bottomBar }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Ionicons name="home" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GameMode')}>
            <Ionicons name="game-controller" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="podium" size={28} color={theme.colors.icon} />
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
  boardWrapper: {
    flex: 1,
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 100,
  },
  championCard: {
    backgroundColor: '#ffb000',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 8,
  },
  championBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffcc00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e69900',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 1, height: 2 },
    elevation: 5,
  },
  championBadgeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#d60000',
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  championInfo: {
    flex: 1,
  },
  championName: {
    fontSize: 18,
    color: '#222',
    fontWeight: '600',
  },
  championScore: {
    fontSize: 16,
    color: '#222',
    marginTop: 2,
  },
  greyBackground: {
    backgroundColor: '#d9d9d9',
    width: '97%',
    alignSelf: 'center',
    flexShrink: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -15,
    paddingTop: 25,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rankBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 3,
    elevation: 4,
  },
  rankNoBadge: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  rankNumberTextOnly: {
    fontSize: 30,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerBlock: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  playerScore: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
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
