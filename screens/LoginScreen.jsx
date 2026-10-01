import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../data/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { checkConnectionAndAlert } from "../data/networkCheck";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(true);

  // ตรวจสอบสถานะการล็อกอินค้างไว้
  useEffect(() => {
    const checkLogin = async () => {
      const savedUser = await AsyncStorage.getItem("userData");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        navigation.replace("Menu", { user: parsedUser });
      }
    };
    checkLogin();
  }, []);

  const handleLogin = async () => {
    if (!username) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อผู้ใช้");
      return;
    }
    if (!password) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกรหัสผ่าน");
      return;
    }

    const isConnected = await checkConnectionAndAlert();
    if (!isConnected) return;

    setLoading(true);
    try {
      // Query หา User จากชื่อผู้ใช้ (Username ตัวพิมพ์ใหญ่ตามฐานข้อมูลของคุณ)
      const q = query(collection(db, "Users"), where("Username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("ผิดพลาด", "ไม่พบชื่อผู้ใช้นี้ในระบบ");
        setLoading(false);
        return;
      }

      let userData = null;
      querySnapshot.forEach((doc) => {
        userData = doc.data();
      });

      // ตรวจสอบรหัสผ่าน (แบบตรวจสอบตรงๆ ตามโครงสร้างที่คุณเก็บ Password ใน Firestore)
      if (userData.Password === password) {
        // เพิ่มการล็อกอินผ่าน Firebase Auth เพื่อให้สิทธิ์ใน Storage ถูกต้อง
        try {
          if (userData.Email) {
            await signInWithEmailAndPassword(auth, userData.Email, password);
          }
        } catch (authError) {
          console.error("Firebase Auth Error:", authError);
          // หากล็อกอิน Auth ไม่สำเร็จ แต่อยากให้เข้าใช้งานส่วนอื่นได้อยู่ ก็อาจจะไม่ throw
          // แต่ถ้าอยากให้สิทธิ์ Storage ถูกต้อง ต้องล็อกอินให้สำเร็จ
        }

        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        navigation.replace("Menu", { user: userData });
      } else {
        Alert.alert("ผิดพลาด", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.innerContainer}>
            <View style={styles.card}>
              <View style={styles.titleContainer}>
                {/* Outline 3D Shadow (Dark Cyan) */}
                <Text style={[styles.titleText, { position: 'absolute', color: '#007c91', top: 4 }]}>เข้าสู่ระบบ</Text>

                {/* Stroke Outline (Bright Cyan) */}
                <Text style={[styles.titleText, { position: 'absolute', color: '#00E5FF', top: 1, left: 0 }]}>เข้าสู่ระบบ</Text>

                {/* Front Main White Text */}
                <Text style={[styles.titleText, { color: '#fff' }]}>เข้าสู่ระบบ</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ชื่อผู้ใช้ :</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ใส่ชื่อผู้ใช้"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>รหัสผ่าน :</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.inputFull}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={showPwd}
                    placeholder="ใส่รหัสผ่าน"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeIcon}>
                    <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={22} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#00acc1" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
                </TouchableOpacity>
              )}

              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                  <Text style={styles.subLink}>สมัครสมาชิกที่นี่</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.subLink}>ลืมรหัสผ่านใช่ไหม</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 40,
  },
  card: {
    backgroundColor: "#2d2d2d",
    borderRadius: 25,
    padding: 30,
    width: "85%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 52, // ปรับขนาดใหญ่ขึ้น
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
  input: {
    backgroundColor: "#dcdcdc",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
  },
  passwordWrapper: {
    flexDirection: "row",
    backgroundColor: "#dcdcdc",
    borderRadius: 12,
    alignItems: "center",
  },
  inputFull: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    paddingRight: 15,
  },
  button: {
    backgroundColor: "#00acc1", // สีฟ้าสดตามดีไซน์
    borderRadius: 15,
    width: "70%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    borderBottomWidth: 4,
    borderBottomColor: "#007c91",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  subLink: {
    color: "#00acc1",
    fontSize: 14,
    marginBottom: 10,
  },
});