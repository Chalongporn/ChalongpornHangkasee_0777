import React, { useState } from "react";
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
import { sendPasswordResetEmail } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../data/firebaseConfig";
import { checkConnectionAndAlert } from "../data/networkCheck";

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลที่ใช้สมัครสมาชิก");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("แจ้งเตือน", "รูปแบบอีเมลไม่ถูกต้อง");
            return;
        }

        const isConnected = await checkConnectionAndAlert();
        if (!isConnected) return;

        setLoading(true);
        try {
            // ตรวจสอบว่ามีอีเมลในระบบหรือไม่ (C-002)
            const usersRef = collection(db, "Users");
            const q = query(usersRef, where("Email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert("ผิดพลาด", "ไม่พบอีเมลนี้ในระบบ");
                setLoading(false);
                return;
            }
            // ตั้งค่าภาษาไทย
            auth.languageCode = 'th';
            
            // ตั้งค่า Action URL เพื่อให้เด้งกลับมาที่แอป
            // หมายเหตุ: คุณต้องตั้งค่า URL นี้ใน Firebase Console -> Auth -> Settings -> Authorized Domains ด้วยนะครับ
            const actionCodeSettings = {
                // URL ปลายทางที่อัปเดตให้ตรงกับโปรเจกต์จริงของคุณ
                url: 'https://end-pro-max.firebaseapp.com/reset', 
                handleCodeInApp: true,
            };

            // ส่งลิงก์รีเซ็ตรหัสผ่าน
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            
            Alert.alert(
                "ส่งอีเมลสำเร็จ",
                "กรุณาตรวจสอบกล่องจดหมายของคุณ และกดลิงก์ในอีเมลเพื่อตั้งรหัสผ่านใหม่",
                [{ text: "ตกลง", onPress: () => navigation.navigate("Login") }]
            );
        } catch (error) {
            console.error(error);
            let errorMessage = "เกิดข้อผิดพลาด ไม่สามารถส่งอีเมลได้";
            if (error.code === "auth/user-not-found") {
                errorMessage = "ไม่พบอีเมลนี้ในระบบ";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
            }
            Alert.alert("ผิดพลาด", errorMessage);
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
                    {/* Back Button outside the card */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.innerContainer}>
                        <View style={styles.card}>
                            <View style={styles.titleContainer}>
                                {/* Outline 3D Shadow (Dark Red) */}
                                <Text style={[styles.titleText, { position: 'absolute', color: '#2c0000ae', top: 4 }]}>ลืมรหัสผ่าน</Text>

                                {/* Stroke Outline (Bright Red) */}
                                <Text style={[styles.titleText, { position: 'absolute', color: '#d00000ff', top: 1, left: 0 }]}>ลืมรหัสผ่าน</Text>

                                {/* Front Main White Text */}
                                <Text style={[styles.titleText, { color: '#fff' }]}>ลืมรหัสผ่าน</Text>
                            </View>

                            <Text style={styles.description}>
                                ไม่ต้องห่วง! เพียงแค่กรอกอีเมลของคุณ{"\n"}แล้วเราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>อีเมล :</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="example@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {loading ? (
                                <ActivityIndicator size="large" color="#ff0000ff" style={{ marginVertical: 20 }} />
                            ) : (
                                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                                    <Text style={styles.buttonText}>ยืนยัน</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.linkContainer}>
                                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                    <Text style={styles.subLink}>เข้าสู่ระบบที่นี่</Text>
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
    header: {
        position: "absolute",
        top: Platform.OS === "ios" ? 50 : 50,
        left: 25,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#3a3a3a",
        justifyContent: "center",
        alignItems: "center",
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
        alignItems: "center",
        justifyContent: "center",
    },
    titleText: {
        fontSize: 52, // ปรับให้ใหญ่เท่าหน้าอื่น (Login/Signup)
        fontWeight: "900",
        letterSpacing: 2, // ใส่ letterSpacing ให้เท่ากัน
        textAlign: "center",
    },
    description: {
        color: "#ccc",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 25,
        lineHeight: 24,
    },
    inputGroup: {
        width: "100%",
        marginBottom: 20,
    },
    label: {
        color: "#fff",
        fontSize: 16,
        marginBottom: 8,
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
    button: {
        backgroundColor: "#d00000ff",
        borderRadius: 15,
        width: "70%",
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        borderBottomWidth: 4,
        borderBottomColor: "#2c0000ae",
    },
    buttonText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    linkContainer: {
        marginTop: 15,
        alignItems: "center",
    },
    subLink: {
        color: "#00acc1",
        fontSize: 14,
        marginTop: 5,
    },
});