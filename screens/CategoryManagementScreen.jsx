import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../data/firebaseConfig";
import { ThemeContext } from "../context/ThemeContext";
import HamburgerMenu from "../components/HamburgerMenu";

const { width } = Dimensions.get("window");

export default function CategoryManagementScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Categories"));
      const catData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ถ้าในคอลเลกชัน Categories ยังไม่มีข้อมูล ให้ลองดึงจาก Game มาตั้งต้นให้ก่อน
      if (catData.length === 0) {
        const gameSnapshot = await getDocs(collection(db, "Game"));
        const games = gameSnapshot.docs.map((d) => d.data());
        const uniqueCats = [...new Set(games.map((g) => g.Category).filter(Boolean))];
        
        // บันทึกลง Categories เพื่อใช้ถาวร
        for (const catName of uniqueCats) {
          await addDoc(collection(db, "Categories"), { Name: catName });
        }
        
        // ดึงใหม่อีกครั้งหลังจาก seed ข้อมูล
        const retrySnapshot = await getDocs(collection(db, "Categories"));
        const finalData = retrySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(finalData);
      } else {
        setCategories(catData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "ไม่สามารถโหลดข้อมูลหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "Categories"), {
        Name: newCategory.trim(),
      });
      setCategories([...categories, { id: docRef.id, Name: newCategory.trim() }]);
      setNewCategory("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "ไม่สามารถเพิ่มหมวดหมู่ได้");
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingName.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    try {
      const oldName = categories.find(c => c.id === id)?.Name;
      const catRef = doc(db, "Categories", id);
      await updateDoc(catRef, { Name: editingName.trim() });

      // อัปเดตใน State
      setCategories(
        categories.map((cat) =>
          cat.id === id ? { ...cat, Name: editingName.trim() } : cat
        )
      );

      // (ทางเลือก) อัปเดตหมวดหมู่ในคอลเลกชัน Game ด้วยถ้าชื่อเปลี่ยน
      // ในแผนนี้เราเน้นแค่การจัดการรายชื่อหมวดหมู่ก่อน
      
      setEditingId(null);
      setEditingName("");
      Alert.alert("สำเร็จ", "แก้ไขหมวดหมู่เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error updating category:", error);
      Alert.alert("Error", "ไม่สามารถแก้ไขหมวดหมู่ได้");
    }
  };

  const handleDeleteCategory = async (id, name) => {
    // 1. ตรวจสอบว่ามีเกมใช้งานหมวดหมู่นี้อยู่หรือไม่
    try {
      const q = query(collection(db, "Game"), where("Category", "==", name));
      const gameSnapshot = await getDocs(q);

      if (!gameSnapshot.empty) {
        Alert.alert(
          "ไม่สามารถลบได้",
          `หมวดหมู่ "${name}" กำลังถูกใช้งานโดยเกม ${gameSnapshot.size} เกม กรุณาเปลี่ยนหมวดหมู่ของเกมเหล่านั้นก่อนลบ`
        );
        return;
      }

      // 2. ยืนยันการลบ
      Alert.alert("ยืนยันการลบ", `คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่?`, [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "Categories", id));
            setCategories(categories.filter((cat) => cat.id !== id));
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting category:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
    }
  };

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <HamburgerMenu />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#ccc" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            หมวดหมู่
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.label, { color: theme.colors.text }]}>หมวดหมู่ :</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0088cc" style={{ marginTop: 20 }} />
          ) : (
            <View>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.catItemRow}>
                  {editingId === cat.id ? (
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      value={editingName}
                      onChangeText={setEditingName}
                      autoFocus
                    />
                  ) : (
                    <View style={styles.catNameBox}>
                      <Text style={styles.catNameText}>{cat.Name}</Text>
                    </View>
                  )}

                  <View style={styles.actionIcons}>
                    {editingId === cat.id ? (
                      <>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: "#009900" }]}
                          onPress={() => handleUpdateCategory(cat.id)}
                        >
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: "#990000" }]}
                          onPress={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: "#007BFF" }]}
                          onPress={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.Name);
                          }}
                        >
                          <Ionicons name="pencil" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: "#FF0000" }]}
                          onPress={() => handleDeleteCategory(cat.id, cat.Name)}
                        >
                          <Ionicons name="trash" size={20} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}

              {/* Add New Category Row */}
              {isAdding ? (
                <View style={styles.addContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="ป้อนหมวดหมู่"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    autoFocus
                  />
                  <View style={styles.addBtnRow}>
                    <TouchableOpacity
                      style={[styles.mainActionBtn, styles.cancelBtn]}
                      onPress={() => {
                        setIsAdding(false);
                        setNewCategory("");
                      }}
                    >
                      <Text style={styles.btnText}>ยกเลิก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.mainActionBtn, styles.saveBtn]}
                      onPress={handleAddCategory}
                    >
                      <Text style={styles.btnText}>บันทึก</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.plusBtn}
                  onPress={() => setIsAdding(true)}
                >
                  <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomBarContainer}>
          <View
            style={[styles.bottomBar, { backgroundColor: theme.colors.bottomBar }]}
          >
            <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
              <Ionicons name="home" size={28} color={theme.colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("GameMode")}>
              <Ionicons
                name="game-controller"
                size={28}
                color={theme.colors.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Scoreboard")}>
              <Ionicons name="podium" size={28} color={theme.colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Ionicons name="person" size={28} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 30,
    paddingHorizontal: 20,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    left: 20,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 10,
  },
  catItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  catNameBox: {
    flex: 1,
    backgroundColor: "#fff",
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  catNameText: {
    fontSize: 16,
    color: "#000",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 15,
    color: "#000",
    fontSize: 16,
    marginBottom: 15,
  },
  actionIcons: {
    flexDirection: "row",
    marginLeft: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  plusBtn: {
    backgroundColor: "#444",
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  addContainer: {
    marginTop: 10,
  },
  addBtnRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  mainActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginHorizontal: 10,
    minWidth: 120,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#990000",
  },
  saveBtn: {
    backgroundColor: "#009900",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Bottom Navigation
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
});
