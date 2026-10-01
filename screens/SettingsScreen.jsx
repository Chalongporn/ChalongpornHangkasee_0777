import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  Alert,
  ScrollView,
  RefreshControl
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../data/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import HamburgerMenu from "../components/HamburgerMenu";
import { ThemeContext } from "../context/ThemeContext";
import { checkConnectionAndAlert } from "../data/networkCheck";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [showTrivia, setShowTrivia] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [newProfilePicUri, setNewProfilePicUri] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const ignoreUnsavedWarning = React.useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    try {
      const userRef = doc(db, "Users", currentUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userInfo = userSnap.data();
        const stored = await AsyncStorage.getItem("userData");
        const parsed = stored ? JSON.parse(stored) : {};

        const dbUsername = userInfo.Username || parsed.Username || "";
        const dbDisplayName = userInfo.DisplayName || parsed.DisplayName || "";
        const dbEmail = userInfo.Email || parsed.Email || "";
        const dbShowTrivia = userInfo.ShowTrivia ?? parsed.ShowTrivia ?? false;
        const dbProfilePic = userInfo.ProfilePic || userInfo.Profile_picture || parsed.ProfilePic || parsed.Profile_picture || null;

        if (initialData) {
          if (username === initialData.username) {
            setUsername(dbUsername);
          }
          if (displayName === initialData.displayName) {
            setDisplayName(dbDisplayName);
          }
          if (email === initialData.email) {
            setEmail(dbEmail);
          }
          if (showTrivia === initialData.showTrivia) {
            setShowTrivia(dbShowTrivia);
          }
          if (newProfilePicUri === null && profilePic === initialData.profilePic) {
            setProfilePic(dbProfilePic);
          }
        } else {
          setUsername(dbUsername);
          setDisplayName(dbDisplayName);
          setEmail(dbEmail);
          setShowTrivia(dbShowTrivia);
          setProfilePic(dbProfilePic);
        }

        setInitialData({
          username: dbUsername,
          displayName: dbDisplayName,
          email: dbEmail,
          showTrivia: dbShowTrivia,
          profilePic: dbProfilePic
        });

        if (stored) {
          parsed.Username = dbUsername;
          parsed.DisplayName = dbDisplayName;
          parsed.Email = dbEmail;
          parsed.ShowTrivia = dbShowTrivia;
          parsed.ProfilePic = dbProfilePic;
          parsed.Profile_picture = dbProfilePic;
          await AsyncStorage.setItem("userData", JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error("Error refreshing profile data:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const stored = await AsyncStorage.getItem("userData");
        if (stored) {
          const parsed = JSON.parse(stored);
          const userId = parsed?.UserID;

          if (userId) {
            const userRef = doc(db, "Users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userInfo = userSnap.data();
              const fetchedUsername = userInfo.Username || parsed.Username || "";
              const fetchedDisplayName = userInfo.DisplayName || parsed.DisplayName || "";
              const fetchedEmail = userInfo.Email || parsed.Email || "";
              const fetchedShowTrivia = userInfo.ShowTrivia ?? parsed.ShowTrivia ?? false;
              const fetchedProfilePic = userInfo.ProfilePic || userInfo.Profile_picture || parsed.ProfilePic || parsed.Profile_picture || null;

              setUsername(fetchedUsername);
              setDisplayName(fetchedDisplayName);
              setEmail(fetchedEmail);
              setShowTrivia(fetchedShowTrivia);
              setProfilePic(fetchedProfilePic);
              setCurrentUserId(userId);

              setInitialData({
                username: fetchedUsername,
                displayName: fetchedDisplayName,
                email: fetchedEmail,
                showTrivia: fetchedShowTrivia,
                profilePic: fetchedProfilePic
              });
            } else {
              setUsername(parsed.Username || "");
              setDisplayName(parsed.DisplayName || "");
              setEmail(parsed.Email || "");
            }
          } else {
            setUsername(parsed.Username || "");
            setDisplayName(parsed.DisplayName || "");
            setEmail(parsed.Email || "");
          }
        }
      } catch (e) {
        console.error("Error loading user data:", e);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const hasUnsavedChanges =
      initialData &&
      (username !== initialData.username ||
        displayName !== initialData.displayName ||
        email !== initialData.email ||
        showTrivia !== initialData.showTrivia ||
        newProfilePicUri !== null);

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
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, username, displayName, email, showTrivia, initialData]);

  const handleSave = async () => {
    const hasUnsavedChanges =
      initialData &&
      (username !== initialData.username ||
        displayName !== initialData.displayName ||
        email !== initialData.email ||
        showTrivia !== initialData.showTrivia ||
        newProfilePicUri !== null);

    if (!hasUnsavedChanges) {
      ignoreUnsavedWarning.current = true;
      navigation.navigate("Profile");
      return;
    }

    if (!currentUserId) return;

    const isConnected = await checkConnectionAndAlert();
    if (!isConnected) return;

    try {
      setIsSaving(true);

      // ตรวจสอบชื่อที่แสดงซ้ำกับชื่อผู้ใช้หรือชื่อที่แสดงของคนอื่นในระบบ
      const newDisplayName = displayName.trim();
      if (newDisplayName !== initialData.displayName) {
        if (!newDisplayName) {
          Alert.alert("ข้อผิดพลาด", "ชื่อที่แสดงห้ามว่าง");
          setIsSaving(false);
          return;
        }

        const qUsername = query(collection(db, "Users"), where("Username", "==", newDisplayName));
        const snapUsername = await getDocs(qUsername);
        const dupUsernames = snapUsername.docs.filter(d => d.id !== currentUserId);

        const qDisplayName = query(collection(db, "Users"), where("DisplayName", "==", newDisplayName));
        const snapDisplayName = await getDocs(qDisplayName);
        const dupDisplayNames = snapDisplayName.docs.filter(d => d.id !== currentUserId);

        if (dupUsernames.length > 0 || dupDisplayNames.length > 0) {
          Alert.alert("ชื่อที่แสดงซ้ำ", "ชื่อที่แสดงนี้ซ้ำกับชื่อผู้ใช้หรือชื่อที่แสดงของผู้อื่นในระบบแล้ว กรุณาเปลี่ยนชื่อใหม่");
          setIsSaving(false);
          return;
        }
      }

      let profilePicUrl = profilePic;

      if (newProfilePicUri) {
        // แทนที่จะอัปโหลดขึ้น Firebase Storage ให้ใช้ Base64 (Data URI) ไปบันทึกใน Firestore โดยตรง
        profilePicUrl = newProfilePicUri;
      }

      const userRef = doc(db, "Users", currentUserId);
      await updateDoc(userRef, {
        Username: username.trim(),
        DisplayName: displayName,
        Email: email,
        ShowTrivia: showTrivia,
        ...(profilePicUrl ? { ProfilePic: profilePicUrl, Profile_picture: profilePicUrl } : {})
      });

      // อัปเดตใน Score collection ด้วย (K-002)
      const scoreRef = doc(db, "Score", currentUserId);
      const scoreSnap = await getDoc(scoreRef);
      if (scoreSnap.exists()) {
        await updateDoc(scoreRef, {
          Username: username.trim()
        });
      }

      // Update AsyncStorage too
      const stored = await AsyncStorage.getItem("userData");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.Username = username.trim();
        parsed.DisplayName = displayName;
        parsed.Email = email;
        parsed.ShowTrivia = showTrivia;
        if (profilePicUrl) {
          parsed.ProfilePic = profilePicUrl;
          parsed.Profile_picture = profilePicUrl;
        }
        await AsyncStorage.setItem("userData", JSON.stringify(parsed));
      }

      // Update initial data so warning doesn't pop up after saving
      setInitialData({
        username: username.trim(),
        displayName,
        email,
        showTrivia,
        profilePic: profilePicUrl
      });
      setProfilePic(profilePicUrl);
      setNewProfilePicUri(null);

      ignoreUnsavedWarning.current = true;
      Alert.alert("บันทึกสำเร็จ", "ข้อมูลของคุณถูกอัปเดตแล้ว", [
        { text: "ตกลง", onPress: () => navigation.navigate("Profile") }
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setDisplayName(initialData.displayName);
      setEmail(initialData.email);
      setShowTrivia(initialData.showTrivia);
    }
    setNewProfilePicUri(null);
    ignoreUnsavedWarning.current = true;
    navigation.navigate("Profile");
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // ลดคุณภาพให้ไฟล์เล็กที่สุดเพื่อเก็บลง Firestore
      base64: true, // เปิดการแปลงเป็น Base64
    });

    if (!result.canceled) {
      // สร้างเป็น Data URI Link
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setNewProfilePicUri(base64Uri);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ใช้ HamburgerMenu แบบเดียวกับหน้าอื่นๆ */}
      <HamburgerMenu />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.text}
          />
        }
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
            <Ionicons name="chevron-back" size={24} color="#ccc" />
          </TouchableOpacity>
          <Text style={[styles.titleText, { color: theme.colors.text }]}>แก้ไขโปรไฟล์</Text>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={newProfilePicUri ? { uri: newProfilePicUri } : (profilePic ? { uri: profilePic } : require("../assets/DfProfile.jpg"))}
              style={styles.avatarImage}
            />
          </View>
          <View style={styles.editPicContainer}>
            <Text style={[styles.editPicLabel, { color: theme.colors.text }]}>รูปโปรไฟล์ :</Text>
            <TouchableOpacity style={styles.editPicBtn} onPress={handlePickImage}>
              <Text style={styles.editPicBtnText}>แก้ไข</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>ชื่อผู้ใช้ :</Text>
          <TextInput
            style={[
              styles.inputBox,
              { backgroundColor: theme.colors.inputBg, color: theme.colors.inputText },
              styles.disabledInputBox
            ]}
            value={username}
            onChangeText={setUsername}
            placeholderTextColor="#888"
            editable={false}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>ชื่อที่แสดง :</Text>
          <TextInput
            style={[styles.inputBox, { backgroundColor: theme.colors.inputBg, color: theme.colors.inputText }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#888"
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>อีเมล :</Text>
          <TextInput
            style={[styles.inputBox, { backgroundColor: theme.colors.inputBg, color: theme.colors.inputText }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#888"
          />

          {/* Toggle Section */}
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>แสดงเกร็ดความรู้หลังการเล่น</Text>
            <Switch
              value={showTrivia}
              onValueChange={setShowTrivia}
              trackColor={{ false: "#555", true: "#4cd964" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.actionBtnText}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.actionBtnText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleRow: {
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
  titleText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    marginRight: 20,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#444",
  },
  editPicContainer: {
    justifyContent: "center",
  },
  editPicLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },
  editPicBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 35,
    borderRadius: 5,
  },
  editPicBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: "#fff",
    color: "#000",
    height: 45,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  disabledInputBox: {
    backgroundColor: "#e0e0e0",
    color: "#555",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  toggleLabel: {
    color: "#ccc",
    fontSize: 16,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelBtn: {
    backgroundColor: "#a10000",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginRight: 15,
  },
  saveBtn: {
    backgroundColor: "#009900",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomBarContainer: {
    alignItems: "center",
    paddingBottom: 30,
    paddingTop: 10,
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
