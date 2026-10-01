import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from "../data/firebaseConfig";
import { ThemeContext } from "../context/ThemeContext";
import { checkConnectionAndAlert } from "../data/networkCheck";

const { width } = Dimensions.get("window");

export default function GameScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const isFocused = useIsFocused();
  const [allGames, setAllGames] = useState([]);
  const [categoryGames, setCategoryGames] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const [playedGames, setPlayedGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);

  const [tiles, setTiles] = useState(Array(49).fill(false)); // 7x7 = 49
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(1000);
  const [hintCount, setHintCount] = useState(0);
  const [hintText, setHintText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  // Timer & Modals
  const [timeLeft, setTimeLeft] = useState(600); // 10:00
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const insets = useSafeAreaInsets();
  const paddingTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 45);

  // Modals visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isKnowledgeModalVisible, setIsKnowledgeModalVisible] = useState(false);
  const [hideKnowledge, setHideKnowledge] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUserId(parsedUser.UserID);
          setHideKnowledge(parsedUser.ShowTrivia === false);
        }
      } catch (err) {
        console.error("โหลด Settings ไม่สำเร็จ:", err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchGames = async () => {
      const isConnected = await checkConnectionAndAlert();
      if (!isConnected) {
        navigation.navigate("Menu");
        return;
      }
      try {
        const querySnapshot = await getDocs(collection(db, "Game"));
        const data = querySnapshot.docs.map((doc) => doc.data());
        setAllGames(data);
        restartGame(data);
      } catch (error) {
        Alert.alert("Error", "ไม่สามารถโหลดข้อมูลจาก Firebase ได้");
        console.error(error);
      }
    };
    fetchGames();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isFocused || isPaused || isGameOver || isKnowledgeModalVisible || !currentGame) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleLose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isFocused, isPaused, isGameOver, isKnowledgeModalVisible, currentGame]);

  // Check Game Over by tiles opened
  useEffect(() => {
    const openedCount = tiles.filter((v) => v).length;
    if (openedCount >= 48) { // 48 out of 49
      handleLose();
    }
  }, [tiles]);

  const updateScoreData = async (finalScore) => {
    if (!currentUserId) return;
    try {
      const q = query(
        collection(db, "Score"),
        where("UserID", "==", currentUserId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const data = querySnapshot.docs[0].data();
        const scoreToAdd = finalScore <= 0 ? 0 : finalScore;
        const newScore = (data.Score || 0) + scoreToAdd;
        const newRound = (data.Round || 0) + 1;
        await updateDoc(docRef, { Score: newScore, Round: newRound });
      }
    } catch (error) {
      console.error("อัปเดตข้อมูล Score ไม่สำเร็จ:", error);
    }
  };

  const handleLose = async () => {
    setIsGameOver(true);
    await updateScoreData(score);
  };

  const restartGame = (data = allGames) => {
    if (data.length === 0) return;

    // Group by category
    const categories = [...new Set(data.map(g => g.Category).filter(Boolean))];
    if (categories.length === 0) return;

    // Pick a random category
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const gamesInCat = data.filter(g => g.Category === randomCat);

    setCurrentCategory(randomCat);
    setCategoryGames(gamesInCat);
    setPlayedGames([]);
    setScore(1000);
    setTimeLeft(600);
    setIsGameOver(false);
    setIsPaused(false);
    setIsKnowledgeModalVisible(false);

    nextLevel(gamesInCat, []);
  };

  const nextLevel = (gamesInCat, played) => {
    const unplayedGames = gamesInCat.filter(g => !played.includes(g.Title));

    // If all games in category played, game over!
    if (unplayedGames.length === 0) {
      handleLose();
      return;
    }

    const randomGame = unplayedGames[Math.floor(Math.random() * unplayedGames.length)];
    setCurrentGame(randomGame);
    setTiles(Array(49).fill(false));
    const randomIndex = Math.floor(Math.random() * 49);
    setTiles((prev) => prev.map((v, i) => (i === randomIndex ? true : false)));
    setAnswer("");
    setHintText("");
    setHintCount(0);
  };

  const openRandomTile = () => {
    const closedTiles = tiles
      .map((open, index) => (!open ? index : null))
      .filter((v) => v !== null);
    if (closedTiles.length === 0) return;
    const randomTile = closedTiles[Math.floor(Math.random() * closedTiles.length)];
    setTiles((prev) => prev.map((open, i) => (i === randomTile ? true : open)));
  };

  const handleSubmit = () => {
    if (!currentGame) return;

    if (answer.trim().toUpperCase() === (currentGame.Title || "").toUpperCase()) {
      setTimeLeft((prev) => prev + 30); // Add 30 seconds

      const newPlayed = [...playedGames, currentGame.Title];
      setPlayedGames(newPlayed);

      if (currentGame.info && !hideKnowledge) {
        setIsKnowledgeModalVisible(true);
      } else {
        Alert.alert("ถูกต้อง!", "รับโบนัสเวลา +30 วินาที");
        nextLevel(categoryGames, newPlayed);
      }
    } else {
      Alert.alert("ผิด!", "ลองใหม่อีกครั้ง -100 คะแนน");
      setScore((prev) => {
        const nextScore = prev - 100;
        if (nextScore <= 0) handleLose();
        return nextScore;
      });
      openRandomTile();
    }
  };

  const requestHintFromAI = () => {
    if (hintCount >= 2) {
      Alert.alert("หมดสิทธิ์!", "ไม่สามารถขอคำใบ้เพิ่มได้แล้ว (สูงสุด 2 ครั้ง)");
      return;
    }
    if (!currentGame || !currentGame.Hints) {
      Alert.alert("ไม่มีคำใบ้", "เกมนี้ยังไม่มีคำใบ้ในระบบ");
      return;
    }
    const hintsArray = Object.values(currentGame.Hints);
    if (hintsArray.length === 0) {
      Alert.alert("ไม่มีคำใบ้", "เกมนี้ยังไม่มีคำใบ้ในระบบ");
      return;
    }

    setHintCount((prev) => prev + 1);
    setScore((prev) => {
      const nextScore = prev - 150;
      if (nextScore <= 0) handleLose();
      return nextScore;
    });
    const hint = hintsArray[hintCount] || hintsArray[hintsArray.length - 1];
    setHintText(hint);
  };

  const handleOpenTile = () => {
    setScore((prev) => {
      const nextScore = prev - 100;
      if (nextScore <= 0) handleLose();
      return nextScore;
    });
    openRandomTile();
  };



  const toggleHideKnowledge = async () => {
    const newValue = !hideKnowledge;
    setHideKnowledge(newValue);
    try {
      const storedUser = await AsyncStorage.getItem("userData");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.ShowTrivia = !newValue;
        await AsyncStorage.setItem("userData", JSON.stringify(parsedUser));
      }
      if (currentUserId) {
        await updateDoc(doc(db, "Users", currentUserId), {
          ShowTrivia: !newValue,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeKnowledgeModal = () => {
    setIsKnowledgeModalVisible(false);
    nextLevel(categoryGames, playedGames);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleWhiteOutline}>หยุดเกม</Text>
            <Text style={styles.modalSubTitle}>เกมหยุดชั่วคราวแล้ว</Text>
            <TouchableOpacity style={styles.modalGreenBtn} onPress={() => setIsPaused(false)}>
              <Text style={styles.modalBtnText}>กลับคืน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalRedBtn} onPress={() => { setIsPaused(false); navigation.navigate("Menu"); }}>
              <Text style={styles.modalBtnText}>เมนูหลัก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleRedOutline}>จบเกมแล้ว</Text>
            <Text style={styles.modalSubTitleScore}>คะแนนที่ได้รับ{"\n"}: {score <= 0 ? 0 : score}</Text>
            <TouchableOpacity style={styles.modalGreenBtn} onPress={() => restartGame(allGames)}>
              <Text style={styles.modalBtnText}>เริ่มใหม่อีกครั้ง</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalRedBtn} onPress={() => { setIsGameOver(false); navigation.navigate("Menu"); }}>
              <Text style={styles.modalBtnText}>กลับสู่เมนู</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isKnowledgeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.knowledgeContent}>
            <Text style={styles.knowledgeHeader}>เกร็ดความรู้</Text>
            {currentGame && (
              <>
                <Image source={{ uri: currentGame.PosterUrl || currentGame.posterUrl }} style={styles.knowledgeImage} />
                <Text style={styles.knowledgeTitle}>{currentGame.Title}</Text>

                <ScrollView style={styles.knowledgeScrollView}>
                  <Text style={styles.knowledgeInfo}>{currentGame.info || "ไม่มีข้อมูล"}</Text>
                </ScrollView>
              </>
            )}

            <View style={styles.knowledgeFooterRow}>
              <TouchableOpacity style={styles.checkboxRow} onPress={toggleHideKnowledge}>
                <View style={[styles.checkbox, hideKnowledge && styles.checkboxChecked]}>
                  {hideKnowledge && <Ionicons name="checkmark" size={16} color="#000" />}
                </View>
                <Text style={styles.checkboxLabel}>ไม่แสดงอีก</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.knowledgeCloseBtn} onPress={closeKnowledgeModal}>
                <Text style={styles.knowledgeCloseBtnText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isDropdownOpen} transparent animationType="none">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.dropdownList}>
            <FlatList
              data={categoryGames}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setAnswer(item.Title || "");
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.Title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Top Bar with Pause */}
      <View style={[styles.topRow, { backgroundColor: theme.colors.headerBackground, paddingTop: paddingTop + 10 }]}>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
          <Ionicons name="pause" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Score and Timer Bar */}
      <View style={[styles.scoreTimerBar, { backgroundColor: theme.colors.card }]}>
        <View style={styles.scoreLeft}>
          <Ionicons name="star" size={26} color="#FFD700" />
          <Text style={[styles.scoreText, { color: theme.isDarkMode ? '#FFD700' : '#FF8C00' }]}> : {score}</Text>
        </View>
        <Text style={[styles.timerText, { color: theme.colors.text }]}>{formatTime(timeLeft)}</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.imageBox}>
          {currentGame && (
            <View style={styles.gridContainer}>
              <Image
                source={{
                  uri: currentGame.PosterUrl || currentGame.posterUrl || "https://via.placeholder.com/300",
                }}
                style={styles.fullImage}
              />
              {Array.from({ length: 49 }).map((_, i) => {
                const row = Math.floor(i / 7);
                const col = i % 7;
                if (tiles[i]) return null;
                return (
                  <View
                    key={i}
                    style={[
                      styles.coverTile,
                      { top: `${row * 14.285}%`, left: `${col * 14.285}%` },
                    ]}
                  />
                );
              })}
            </View>
          )}
          <Text style={styles.gameTitle}>รูปนี้คืออะไร?</Text>
        </View>

        {/* Dropdown for Answer */}
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsDropdownOpen(true)}>
          <Text style={[styles.dropdownBtnText, answer ? { color: '#000' } : null]}>
            {answer || "เลือกคำตอบ"}
          </Text>
          <Ionicons name="chevron-down" size={28} color="#000" />
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity style={styles.greenBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>ยืนยันคำตอบ</Text>
        </TouchableOpacity>

        {/* Hint Box */}
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>คำใบ้ : {hintText}</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.blueBtn} onPress={requestHintFromAI}>
            <Text style={styles.btnTextSmall}>ขอคำใบ้</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.brownBtn} onPress={handleOpenTile}>
            <Text style={styles.btnTextSmall}>สุ่มเปิดป้าย</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#212121", width: "100%" },
  topRow: { paddingHorizontal: 20, paddingBottom: 10, width: "100%", alignItems: "flex-start" },
  pauseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#444", justifyContent: "center", alignItems: "center" },

  scoreTimerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#333", marginHorizontal: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginBottom: 15 },
  scoreLeft: { flexDirection: "row", alignItems: "center" },
  scoreText: { fontSize: 24, fontWeight: "500", marginLeft: 5 },
  timerText: { fontSize: 24, fontWeight: "400" },

  imageBox: { backgroundColor: "#fff", borderRadius: 10, padding: 15, alignItems: "center", width: width * 0.85 },
  gridContainer: { width: "100%", aspectRatio: 1, position: "relative", overflow: "hidden", borderRadius: 5, backgroundColor: '#000' },
  fullImage: { width: "100%", height: "100%", resizeMode: "cover" },
  coverTile: { position: "absolute", width: "14.4%", height: "14.4%", backgroundColor: "#333", borderWidth: 1, borderColor: "#111" },
  gameTitle: { color: "#000", marginTop: 15, fontSize: 18, fontWeight: "500" },

  dropdownBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ddd", width: width * 0.85, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, marginTop: 15, borderWidth: 3, borderColor: '#00CC44' },
  dropdownBtnText: { color: "#888", fontSize: 20 },

  greenBtn: { backgroundColor: "#00CC44", width: width * 0.85, paddingVertical: 15, borderRadius: 15, marginTop: 15, alignItems: "center" },

  hintBox: { marginTop: 15, backgroundColor: "#FAD689", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 20, width: width * 0.85, minHeight: 60, justifyContent: "center" },
  hintText: { color: "#000", fontSize: 18, fontWeight: "500" },

  actionRow: { flexDirection: "row", justifyContent: "space-between", width: width * 0.85, marginTop: 15 },
  blueBtn: { backgroundColor: "#007BCC", width: "48%", paddingVertical: 15, borderRadius: 15, alignItems: "center" },
  brownBtn: { backgroundColor: "#A04A00", width: "48%", paddingVertical: 15, borderRadius: 15, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  btnTextSmall: { color: "#fff", fontSize: 18, fontWeight: "500" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#3a3a3a", width: width * 0.85, borderRadius: 20, padding: 30, alignItems: "center" },
  modalTitleWhiteOutline: { color: "#fff", fontSize: 36, fontWeight: "900", textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3, marginBottom: 20, letterSpacing: 1 },
  modalTitleRedOutline: { color: "#f00", fontSize: 36, fontWeight: "900", textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3, marginBottom: 20, letterSpacing: 1 },
  modalSubTitle: { color: "#fff", fontSize: 22, marginBottom: 30, textAlign: "center", fontWeight: "600" },
  modalSubTitleScore: { color: "#fff", fontSize: 24, marginBottom: 30, textAlign: "center", fontWeight: "bold" },
  modalGreenBtn: { backgroundColor: "#00CC44", width: "100%", paddingVertical: 15, borderRadius: 10, alignItems: "center", marginBottom: 15 },
  modalRedBtn: { backgroundColor: "#CC0000", width: "100%", paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  // Knowledge Modal
  knowledgeContent: { backgroundColor: "#333", width: width * 0.85, borderRadius: 15, padding: 20, alignItems: "center", maxHeight: '80%' },
  knowledgeHeader: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  knowledgeImage: { width: "100%", height: 200, resizeMode: "contain", borderRadius: 10, marginBottom: 15 },
  knowledgeTitle: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  knowledgeScrollView: { width: "100%", marginBottom: 15 },
  knowledgeInfo: { color: "#ddd", fontSize: 16, lineHeight: 24 },
  knowledgeFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 22, height: 22, backgroundColor: "#ccc", borderRadius: 4, justifyContent: "center", alignItems: "center", marginRight: 8 },
  checkboxChecked: { backgroundColor: "#fff" },
  checkboxLabel: { color: "#ddd", fontSize: 16 },
  knowledgeCloseBtn: { backgroundColor: "#007BCC", paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
  knowledgeCloseBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // Dropdown List Modal
  dropdownOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  dropdownList: { backgroundColor: "#fff", width: width * 0.8, maxHeight: 400, borderRadius: 10, paddingVertical: 10 },
  dropdownItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dropdownItemText: { fontSize: 18, color: "#000" },
});
