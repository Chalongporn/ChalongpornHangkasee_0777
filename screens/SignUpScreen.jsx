import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../data/firebaseConfig";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons"; // สำหรับไอคอนลูกตาในช่องรหัสผ่าน
import { checkConnectionAndAlert } from "../data/networkCheck";

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (loading) return;

    if (!username) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อผู้ใช้");
      return;
    }
    if (!email) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมล");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("แจ้งเตือน", "รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    if (!password) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกรหัสผ่าน");
      return;
    }
    
    if (password.length < 6) {
      Alert.alert("แจ้งเตือน", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (!confirmPassword) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกยืนยันรหัสผ่าน");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณากรอกใหม่อีกครั้ง");
      return;
    }

    const isConnected = await checkConnectionAndAlert();
    if (!isConnected) return;

    setLoading(true);
    try {
      // ตรวจสอบชื่อผู้ใช้ซ้ำกับ Username หรือ DisplayName ในระบบ
      const usersRef = collection(db, "Users");
      const q1 = query(usersRef, where("Username", "==", username));
      const q2 = query(usersRef, where("DisplayName", "==", username));
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      if (!snap1.empty || !snap2.empty) {
        Alert.alert("ชื่อผู้ใช้ซ้ำ", "ชื่อผู้ใช้นี้ถูกใช้งานหรือซ้ำกับชื่อที่แสดงในระบบแล้ว กรุณาเปลี่ยนชื่อใหม่");
        setLoading(false);
        return;
      }

      // ตรวจสอบอีเมลซ้ำ
      const emailQ = query(usersRef, where("Email", "==", email));
      const emailSnapshot = await getDocs(emailQ);
      if (!emailSnapshot.empty) {
        Alert.alert("อีเมลซ้ำ", "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น");
        setLoading(false);
        return;
      }

      // ลงทะเบียนผ่าน Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // บันทึกข้อมูลลง Users collection โดยใช้ uid
      await setDoc(doc(db, "Users", user.uid), {
        UserID: user.uid,
        Username: username, // อ้างอิงจากตัวแปร useState ไม่ใช่ object user
        DisplayName: username, // เพิ่ม DisplayName ตามที่ผู้ใช้ระบุ
        Email: email,       // อ้างอิงจากตัวแปร useState
        Password: password, // อ้างอิงจากตัวแปร useState
        ProfilePic: "",
        Profile_picture: "",
        Status: "user"
      });

      // บันทึกข้อมูลลง Score collection พร้อมกันโดยใช้ uid เดียวกัน
      await setDoc(doc(db, "Score", user.uid), {
        UserID: user.uid,
        Username: username,
        ScoreID: user.uid,
        Round: 0,
        Score: 0,
      });

      Alert.alert("ลงทะเบียนสำเร็จ", "คุณสามารถเข้าสู่ระบบได้แล้ว");
      navigation.replace("Login");
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("อีเมลซ้ำ", "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น");
      } else {
        Alert.alert("เกิดข้อผิดพลาด", error.message);
      }
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
                {/* Outline 3D Shadow (Dark Green) */}
                <Text style={[styles.titleText, { position: 'absolute', color: '#008a36', top: 4 }]}>ลงทะเบียน</Text>

                {/* Stroke Outline (Bright Green) */}
                <Text style={[styles.titleText, { position: 'absolute', color: '#00C84F', top: 1, left: 0 }]}>ลงทะเบียน</Text>

                {/* Front Main White Text */}
                <Text style={[styles.titleText, { color: '#fff' }]}>ลงทะเบียน</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ชื่อผู้ใช้ :</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ใส่ชื่อผู้ใช้"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>อีเมล :</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ใส่อีเมล"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
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
                    placeholder="ใส่รหัสผ่าน"
                    placeholderTextColor="#999"
                    secureTextEntry={showPwd}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeIcon}>
                    <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={24} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ยืนยันรหัสผ่าน :</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.inputFull}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="ยืนยันรหัสผ่าน"
                    placeholderTextColor="#999"
                    secureTextEntry={showPwd}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeIcon}>
                    <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={24} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && { opacity: 0.7 }]} 
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}</Text>
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.subLink}>เข้าสู่ระบบที่นี่</Text>
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
    borderRadius: 30,
    padding: 30,
    width: "88%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 52, // ปรับขนาดให้เท่ากับหน้า Login/Forgot
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "#ffffffff",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#ffffffff",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    color: "#000",
    fontSize: 16,
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
    color: "#000",
    fontSize: 16,
  },
  eyeIcon: {
    paddingRight: 15,
  },
  button: {
    backgroundColor: "#00C84F",
    borderRadius: 15,
    width: "70%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    borderBottomWidth: 4,
    borderBottomColor: "#008a36",
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  subLink: {
    color: "#00acc1",
    fontSize: 14,
    marginBottom: 8,
    textDecorationLine: "none",
  },
});