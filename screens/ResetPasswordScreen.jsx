import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"; 
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "../data/firebaseConfig";

export default function ResetPasswordScreen({ route, navigation }) {
    const { oobCode } = route?.params || {};
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPwd1, setShowPwd1] = useState(true);
    const [showPwd2, setShowPwd2] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกรหัสผ่านให้ครบถ้วน");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("ผิดพลาด", "รหัสผ่านไม่ตรงกัน กรุณาลองใหม่");
            return;
        }

        if (!oobCode) {
            Alert.alert("ผิดพลาด", "ไม่พบรหัสยืนยัน (oobCode) กรุณากดลิงก์สำหรับรีเซ็ตรหัสผ่านจากอีเมลอีกครั้ง");
            return;
        }

        setLoading(true);
        try {
            // 1. ตรวจสอบอีเมลจาก oobCode
            const email = await verifyPasswordResetCode(auth, oobCode);

            // 2. ทำการเปลี่ยนรหัสผ่านใน Firebase Auth
            await confirmPasswordReset(auth, oobCode, newPassword);

            // 3. อัปเดตรหัสผ่านใน Firestore
            const q = query(collection(db, "Users"), where("Email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, "Users", userDoc.id), {
                    Password: newPassword
                });
            }

            Alert.alert("สำเร็จ!", "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว", [
                { text: "ตกลง", onPress: () => navigation.navigate("Login") }
            ]);
        } catch (error) {
            console.error("Reset Error:", error);
            let errMsg = "ไม่สามารถเปลี่ยนรหัสผ่านได้";
            if (error.code === 'auth/expired-action-code') errMsg = "ลิงก์หมดอายุ กรุณาขอลิงก์ใหม่";
            if (error.code === 'auth/invalid-action-code') errMsg = "ลิงก์ไม่ถูกต้อง หรือถูกใช้งานไปแล้ว";
            Alert.alert("ผิดพลาด", errMsg);
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
                                {/* Outline 3D Shadow (Dark Red) */}
                                <Text style={[styles.titleText, { position: 'absolute', color: '#4a0000', top: 4 }]}>รีเซ็ตรหัสผ่านของคุณ</Text>

                                {/* Stroke Outline (Bright Red) */}
                                <Text style={[styles.titleText, { position: 'absolute', color: '#ff0000', top: 1, left: 0 }]}>รีเซ็ตรหัสผ่านของคุณ</Text>

                                {/* Front Main White Text */}
                                <Text style={[styles.titleText, { color: '#fff' }]}>รีเซ็ตรหัสผ่านของคุณ</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>รหัสผ่านใหม่ :</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={styles.inputFull}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="ใส่รหัสผ่านใหม่"
                                        placeholderTextColor="#999"
                                        secureTextEntry={showPwd1}
                                        />
                                    <TouchableOpacity onPress={() => setShowPwd1(!showPwd1)} style={styles.eyeIcon}>
                                        <Ionicons name={showPwd1 ? "eye-off-outline" : "eye-outline"} size={22} color="#555" />
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
                                        placeholder="ยืนยันรหัสผ่านใหม่"
                                        placeholderTextColor="#999"
                                        secureTextEntry={showPwd2}
                                        />
                                    <TouchableOpacity onPress={() => setShowPwd2(!showPwd2)} style={styles.eyeIcon}>
                                        <Ionicons name={showPwd2 ? "eye-off-outline" : "eye-outline"} size={22} color="#555" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="large" color="#d00000" style={{ marginVertical: 20 }} />
                            ) : (
                                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                                    <Text style={styles.buttonText}>รีเซ็ตรหัสผ่าน</Text>
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
        width: "88%",
        alignItems: "center",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    titleContainer: {
        marginBottom: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    titleText: {
        fontSize: 42,
        fontWeight: "900",
        letterSpacing: 1,
        textAlign: "center",
    },
    inputGroup: {
        width: "100%",
        marginBottom: 20,
    },
    label: {
        color: "#ccc",
        fontSize: 14,
        marginBottom: 8,
        alignSelf: "flex-start",
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
        backgroundColor: "#b70000",
        borderRadius: 15,
        width: "80%",
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15,
        borderBottomWidth: 4,
        borderBottomColor: "#6a0000",
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
        fontSize: 16,
    },
});
