import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../data/firebaseConfig";
import { ThemeContext } from "../context/ThemeContext";
import HamburgerMenu from "../components/HamburgerMenu";

export default function EditModeScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext); // ดึงค่าสีจาก Theme

  // State สำหรับเก็บข้อมูล
  const [games, setGames] = useState([]); // เก็บรายการเกมทั้งหมด
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด"); // หมวดหมู่ที่กำลังเลือกดู
  const [categories, setCategories] = useState(["ทั้งหมด"]); // ตัวเลือกหมวดหมู่ที่มีในระบบ
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // ควบคุมการเปิดปิดกล่อง Dropdown
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGames(true);
  }, []);

  // ฟังก์ชันดึงข้อมูลเกมทั้งหมดจาก Firebase Firestore
  const fetchGames = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    try {
      // ดึงข้อมูลจาก Collection "Game"
      const querySnapshot = await getDocs(collection(db, "Game"));
      const gamesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Extract unique categories
      const uniqueCategories = ["ทั้งหมด", ...new Set(gamesData.map((g) => g.Category).filter(Boolean))];

      setGames(gamesData);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching games:", error);
      Alert.alert("Error", "ไม่สามารถดึงข้อมูลเกมได้");
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGames(false);
    setRefreshing(false);
  };

  // ฟังก์ชันลบเกมออกจากฐานข้อมูล
  const handleDelete = (id, title) => {
    Alert.alert(
      "ยืนยันการลบ",
      `คุณต้องการลบเกม "${title}" ใช่หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "Game", id));
              setGames(games.filter((g) => g.id !== id));
              Alert.alert("สำเร็จ", "ลบข้อมูลเกมเรียบร้อยแล้ว");
            } catch (error) {
              console.error("Error deleting game:", error);
              Alert.alert("Error", "ไม่สามารถลบข้อมูลได้");
            }
          },
        },
      ]
    );
  };

  // ฟังก์ชันแก้ไขข้อมูล (รอการพัฒนา)
  const handleEdit = (item) => {
    navigation.navigate("AddGame", { gameData: item });
  };

  const handleAddGame = () => {
    navigation.navigate("AddGame");
  };

  // กรองรายชื่อเกมตามหมวดหมู่ที่เลือก
  const filteredGames = selectedCategory === "ทั้งหมด"
    ? games
    : games.filter((g) => g.Category === selectedCategory);

  // ส่วนแสดงผลของการ์ดเกมแต่ละอัน (รูปภาพ, ชื่อ, หมวดหมู่, และปุ่มลบ/แก้ไข)
  const renderGameItem = ({ item }) => (
    <TouchableOpacity style={styles.gameCard} onPress={() => handleEdit(item)}>
      <Image
        source={{ uri: item.PosterUrl || item.posterUrl || "https://via.placeholder.com/150" }}
        style={styles.gameImage}
      />
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle} numberOfLines={1}>{item.Title || "ไม่มีชื่อ"}</Text>
        <Text style={styles.gameDetail}>หมวดหมู่ : {item.Category || "-"}</Text>
        <Text style={styles.gameDetail}>ID : {item.GameID || "-"}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
            <Ionicons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.Title)}>
            <Ionicons name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HamburgerMenu />

      <View style={styles.content}>
        {/* Header Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#ccc" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>เกมทั้งหมด</Text>
        </View>

        {/* Filter & Add Button Row */}
        <View style={styles.filterRow}>
          <View style={styles.categoryPickerContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.text }]}>หมวดหมู่ :</Text>
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={() => setIsDropdownOpen(true)}
            >
              <Text style={styles.pickerText}>{selectedCategory}</Text>
              <Ionicons name="chevron-down" size={16} color="#000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddGame}>
            <Text style={styles.addBtnText}>เพิ่มเกมใหม่</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.listLabel, { color: theme.colors.text }]}>เกม :</Text>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            renderItem={renderGameItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>ไม่พบข้อมูลเกม</Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.text}
              />
            }
          />
        )}
      </View>

      {/* Category Dropdown Modal */}
      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownList}>
            <FlatList
              data={categories}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCategory(item);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedCategory === item && { fontWeight: 'bold', color: '#0088cc' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
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
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ============================
  // โครงสร้างหน้าจอหลัก (Main Layout)
  // ============================
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 15,
  },

  // ============================
  // แถบหัวเรื่อง (Header Section)
  // ============================
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 30,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3a3a3a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },

  // ============================
  // ส่วนตัวกรองและปุ่มเพิ่ม (Filter & Add Button)
  // ============================
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  categoryPickerContainer: {
    flex: 1,
    marginRight: 15,
  },
  filterLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
  },
  pickerBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    color: "#000",
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: "#0088cc",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  listLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },

  // ============================
  // รูปแบบรายการเกมแต่ละการ์ด (Game Card Item)
  // ============================
  gameCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  gameImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 15,
    resizeMode: "cover",
  },
  gameInfo: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  gameDetail: {
    fontSize: 13,
    color: "#444",
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: "row",
    position: "absolute",
    bottom: -5,
    right: 0,
  },
  editBtn: {
    backgroundColor: "#0088cc",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  deleteBtn: {
    backgroundColor: "#ff0000",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },

  // ============================
  // แถบเมนูด้านล่าง (Bottom Navigation)
  // ============================
  bottomBarContainer: {
    alignItems: "center",
    paddingBottom: 30,
    paddingTop: 5,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "85%",
    backgroundColor: "#2d2d2d",
    paddingVertical: 15,
    borderRadius: 35,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
  },

  // ============================
  // ส่วนของ Modal กล่องเลือกหมวดหมู่ (Dropdown Modal)
  // ============================
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownList: {
    backgroundColor: "#fff",
    width: "80%",
    maxHeight: 300,
    borderRadius: 10,
    paddingVertical: 10,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#000",
  },
});
