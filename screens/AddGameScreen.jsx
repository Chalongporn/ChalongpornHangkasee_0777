import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../data/firebaseConfig";
import { ThemeContext } from "../context/ThemeContext";
import HamburgerMenu from "../components/HamburgerMenu";
import { checkConnectionAndAlert } from "../data/networkCheck";

const { width } = Dimensions.get("window");

export default function AddGameScreen({ route }) {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(false);
  const [fetchingConfig, setFetchingConfig] = useState(true);

  const gameData = route?.params?.gameData;
  const isEditing = !!gameData;

  const ignoreUnsavedWarning = React.useRef(false);

  // Form states
  const [imageUri, setImageUri] = useState(gameData?.PosterUrl || gameData?.posterUrl || null);
  const [gameId, setGameId] = useState(gameData?.GameID || "");
  const [title, setTitle] = useState(gameData?.Title || "");
  const [category, setCategory] = useState(gameData?.Category || "เลือกหมวดหมู่");
  
  const initialHints = gameData?.Hints ? (Array.isArray(gameData.Hints) ? gameData.Hints : Object.values(gameData.Hints)) : ["", ""];
  const [hints, setHints] = useState(initialHints.length > 0 ? initialHints : ["", ""]);
  const [info, setInfo] = useState(gameData?.info || "");

  // Categories Dropdown State
  const [categories, setCategories] = useState(["ทั้งหมด"]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // New Category Modal State
  const [isNewCategoryModal, setIsNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInitialData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchInitialData = async () => {
    setFetchingConfig(true);
    try {
      // 1. ดึง GameID ล่าสุด (เฉพาะตอนเพิ่มเกมใหม่)
      if (!isEditing) {
        const gameSnapshot = await getDocs(collection(db, "Game"));
        const gamesData = gameSnapshot.docs.map((doc) => doc.data());
        
        let maxId = 0;
        gamesData.forEach((game) => {
          if (game.GameID && game.GameID.startsWith("g")) {
            const numPart = parseInt(game.GameID.substring(1), 10);
            if (!isNaN(numPart) && numPart > maxId) {
              maxId = numPart;
            }
          }
        });
        const nextId = "g" + String(maxId + 1).padStart(3, "0");
        setGameId(nextId);
      }

      // 2. ดึงหมวดหมู่จากคอลเลกชัน Categories โดยตรง
      const catSnapshot = await getDocs(collection(db, "Categories"));
      const catData = catSnapshot.docs.map((doc) => doc.data().Name);

      const finalCategories = [
        "เลือกหมวดหมู่",
        ...catData,
      ];
      setCategories(finalCategories);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      Alert.alert("Error", "ไม่สามารถดึงข้อมูลเริ่มต้นได้");
    } finally {
      setFetchingConfig(false);
    }
  };

  useEffect(() => {
    const initialHintsArr = gameData?.Hints ? (Array.isArray(gameData.Hints) ? gameData.Hints : Object.values(gameData.Hints)) : ["", ""];
    const hintsChanged = hints.some((h, index) => h !== (initialHintsArr[index] || ""));

    const hasUnsavedChanges =
      title !== (gameData?.Title || "") ||
      category !== (gameData?.Category || "เลือกหมวดหมู่") ||
      info !== (gameData?.info || "") ||
      imageUri !== (gameData?.PosterUrl || gameData?.posterUrl || null) ||
      hintsChanged;

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChanges || ignoreUnsavedWarning.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "ข้อมูลยังไม่ถูกบันทึก",
        "คุณมีข้อมูลที่ถูกแก้ไขแต่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้โดยไม่บันทึกหรือไม่?",
        [
          { text: "อยู่ต่อ", style: "cancel", onPress: () => { } },
          {
            text: "ออกจากหน้านี้",
            style: "destructive",
            onPress: () => {
              ignoreUnsavedWarning.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, title, category, info, imageUri, hints]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // บังคับตัดเป็นสี่เหลี่ยมจัตุรัส 1:1
        quality: 0.2, // ลดคุณภาพเพื่อให้ไฟล์เล็กสำหรับเก็บใน Firestore
        base64: true,
      });

      if (!result.canceled) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImageUri(base64Uri);
      }
    } catch (error) {
      Alert.alert("Error", "ไม่สามารถเลือกรูปภาพได้");
    }
  };

  const handleHintChange = (index, value) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const handleSaveGame = async () => {
    if (!title) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อเกม");
      return;
    }
    if (category === "เลือกหมวดหมู่" || !category) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกหรือเพิ่มหมวดหมู่");
      return;
    }

    const isConnected = await checkConnectionAndAlert();
    if (!isConnected) return;

    setLoading(true);
    try {
      let downloadUrl = imageUri || "";

      // ไม่ใช้ Firebase Storage แล้ว เพราะต้องการเก็บเป็น Base64 ใน Firestore โดยตรง
      // (ตามแนวทางของหน้าแก้ไขโปรไฟล์)
      
      // สร้างข้อมูลเกม
      const newGameData = {
        GameID: gameId,
        Title: title,
        Category: category,
        Hints: hints.filter((h) => h.trim() !== ""),
        info: info,
        PosterUrl: downloadUrl,
      };

      if (isEditing) {
        const gameRef = doc(db, "Game", gameData.id);
        await updateDoc(gameRef, newGameData);
        ignoreUnsavedWarning.current = true;
        Alert.alert("สำเร็จ", "แก้ไขข้อมูลเกมเรียบร้อยแล้ว", [
          { text: "ตกลง", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addDoc(collection(db, "Game"), newGameData);
        ignoreUnsavedWarning.current = true;
        Alert.alert("สำเร็จ", "เพิ่มเกมใหม่เรียบร้อยแล้ว", [
          { text: "ตกลง", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    setCategory(newCategoryName.trim());
    if (!categories.includes(newCategoryName.trim())) {
      setCategories([...categories, newCategoryName.trim()]);
    }
    setNewCategoryName("");
    setIsNewCategoryModal(false);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <HamburgerMenu />
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? "แก้ไขเกม" : "เพิ่มเกมใหม่"}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {fetchingConfig ? (
          <ActivityIndicator size="large" color="#0088cc" style={{ marginTop: 50 }} />
        ) : (
          <View>
            {/* Image Section */}
            <View style={styles.imageSection}>
              <View style={styles.imagePlaceholder}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} />
                ) : null}
              </View>
              <View style={styles.imageControls}>
                <Text style={styles.label}>รูป :</Text>
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                  <Text style={styles.addImageText}>เพิ่ม</Text>
                </TouchableOpacity>
                {imageUri ? (
                  <TouchableOpacity style={[styles.addImageBtn, { backgroundColor: "#ff3333", marginTop: 10 }]} onPress={() => setImageUri(null)}>
                    <Text style={styles.addImageText}>ลบรูป</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Game ID */}
            <Text style={styles.label}>เกมไอดี :</Text>
            <TextInput
              style={[styles.input, { backgroundColor: "#ffffff", color: "#333" }]}
              value={gameId}
              editable={false}
            />

            {/* Title */}
            <Text style={styles.label}>ชื่อ :</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category */}
            <Text style={styles.label}>หมวดหมู่ :</Text>
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={() => setIsDropdownOpen(true)}
              >
                <Text style={styles.pickerText}>{category}</Text>
                <Ionicons name="chevron-down" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newCategoryBtn}
                onPress={() => navigation.navigate("CategoryManagement")}
              >
                <Text style={styles.newCategoryText}>ใหม่</Text>
              </TouchableOpacity>
            </View>

            {/* Hints */}
            <Text style={styles.label}>คำใบ้ :</Text>
            <TextInput
              style={styles.input}
              value={hints[0]}
              onChangeText={(text) => handleHintChange(0, text)}
              placeholder="คำใบ้ที่ 1..."
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={hints[1]}
              onChangeText={(text) => handleHintChange(1, text)}
              placeholder="คำใบ้ที่ 2..."
              placeholderTextColor="#999"
            />

            {/* Info */}
            <Text style={styles.label}>ข้อมูล :</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={info}
              onChangeText={setInfo}
              multiline
              textAlignVertical="top"
              placeholder="กรอกข้อมูลเพิ่มเติมเกี่ยวกับเกม..."
              placeholderTextColor="#999"
            />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.actionBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn]}
                onPress={handleSaveGame}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

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
                    setCategory(item);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      category === item && { fontWeight: "bold", color: "#0088cc" },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Category Modal */}
      <Modal visible={isNewCategoryModal} transparent animationType="fade">
        <View style={styles.dropdownOverlay}>
          <View style={styles.newCategoryBox}>
            <Text style={styles.newCategoryTitle}>เพิ่มหมวดหมู่ใหม่</Text>
            <TextInput
              style={styles.newCategoryInput}
              placeholder="กรอกชื่อหมวดหมู่..."
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <View style={styles.newCategoryActions}>
              <TouchableOpacity
                style={[styles.ncBtn, styles.ncCancel]}
                onPress={() => {
                  setIsNewCategoryModal(false);
                  setNewCategoryName("");
                }}
              >
                <Text style={styles.ncBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ncBtn, styles.ncSave]} onPress={handleAddNewCategory}>
                <Text style={styles.ncBtnText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomBarContainer}>
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.bottomBar }]}>
          <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
            <Ionicons name="home" size={28} color={theme.colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("GameMode")}>
            <Ionicons name="game-controller" size={28} color={theme.colors.icon} />
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
  imageSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 15,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageControls: {
    justifyContent: "center",
  },
  addImageBtn: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 5,
  },
  addImageText: {
    color: "#fff",
    fontWeight: "bold",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 10,
    color: "#000",
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 10,
  },
  pickerText: {
    color: "#000",
    fontSize: 14,
  },
  newCategoryBtn: {
    backgroundColor: "#007BFF",
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  newCategoryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    marginBottom: 20,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginHorizontal: 10,
    minWidth: 100,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#990000",
  },
  saveBtn: {
    backgroundColor: "#009900",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Dropdown Modal Styles
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
  // New Category Modal Styles
  newCategoryBox: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 20,
  },
  newCategoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  newCategoryInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  newCategoryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ncBtn: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  ncCancel: {
    backgroundColor: "#ccc",
  },
  ncSave: {
    backgroundColor: "#007BFF",
  },
  ncBtnText: {
    color: "#fff",
    fontWeight: "bold",
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
