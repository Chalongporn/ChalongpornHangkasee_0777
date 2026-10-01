import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    Animated,
    Platform,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from "firebase/firestore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from "../data/firebaseConfig";
import { signOut } from "firebase/auth";
import { ThemeContext } from "../context/ThemeContext";

export default function HeaderWithSidebar({ showProfileAvatar = true }) {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const slideAnim = React.useRef(new Animated.Value(-350)).current;
    const [username, setUsername] = useState("User Name");
    const [profilePic, setProfilePic] = useState(null);

    const [userId, setUserId] = useState(null);

    const insets = useSafeAreaInsets();
    const paddingTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 45);
    const headerHeight = 60 + paddingTop;

    useEffect(() => {
        const initUser = async () => {
            try {
                const stored = await AsyncStorage.getItem("userData");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed) {
                        if (parsed.UserID) setUserId(parsed.UserID);
                        if (parsed.Username) setUsername(parsed.Username);
                        if (parsed.ProfilePic || parsed.Profile_picture) setProfilePic(parsed.ProfilePic || parsed.Profile_picture);
                    }
                }
            } catch (e) {
                console.error("Error fetching user", e);
            }
        };
        initUser();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const userRef = doc(db, "Users", userId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.Username) setUsername(data.Username);
                if (data.ProfilePic || data.Profile_picture) setProfilePic(data.ProfilePic || data.Profile_picture);
            }
        });

        return () => unsubscribe();
    }, [userId]);

    const openMenu = () => {
        setIsMenuOpen(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeMenu = () => {
        Animated.timing(slideAnim, {
            toValue: -350,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setIsMenuOpen(false));
    };

    return (
        <>
            {/* Header Bar */}
            <View style={[styles.headerBar, { backgroundColor: theme.colors.headerBackground, paddingTop, height: headerHeight }]}>
                <TouchableOpacity onPress={openMenu}>
                    <Ionicons name="menu" size={40} color={theme.colors.icon} />
                </TouchableOpacity>
                {showProfileAvatar ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <Image source={profilePic ? { uri: profilePic } : require('../assets/DfProfile.jpg')} style={styles.smallAvatar} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 45, height: 45 }} /> // Placeholder to balance flex-between if needed, or just let it align left. Actually, if space-between is used, it needs a right element to keep the menu icon on the left.
                )}
            </View>

            {/* Sidebar Modal */}
            <Modal transparent={true} visible={isMenuOpen} animationType="none" onRequestClose={closeMenu}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={closeMenu}>
                        <View style={styles.modalBackground} />
                    </TouchableWithoutFeedback>
                    <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }], backgroundColor: theme.colors.card }]}>
                        <View style={[styles.sidebarHeader, { paddingTop, height: headerHeight }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', height: '100%' }}>
                                <Image source={profilePic ? { uri: profilePic } : require('../assets/DfProfile.jpg')} style={styles.sidebarAvatar} />
                                <Text style={[styles.sidebarUser, { color: theme.colors.text }]}>{username}</Text>
                                <View style={{ flex: 1 }} />
                                <TouchableOpacity onPress={closeMenu}>
                                    <Ionicons name="menu" size={40} color={theme.colors.icon} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.sidebarList}>
                            <TouchableOpacity style={styles.sidebarItem} onPress={() => { closeMenu(); navigation.navigate('Settings'); }}>
                                <Ionicons name="settings" size={22} color={theme.colors.text} />
                                <Text style={[styles.sidebarText, { color: theme.colors.text }]}>ตั้งค่า</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sidebarItem} onPress={() => { closeMenu(); navigation.navigate('Scoreboard'); }}>
                                <Ionicons name="stats-chart" size={22} color={theme.colors.text} />
                                <Text style={[styles.sidebarText, { color: theme.colors.text }]}>กระดานคะแนน</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
                            try {
                                await signOut(auth);
                            } catch (e) {
                                console.error("Error signing out from Firebase Auth:", e);
                            }
                            await AsyncStorage.removeItem("userData");
                            closeMenu();
                            navigation.replace("Login");
                        }}>
                            <Ionicons name="log-out" size={24} color={theme.colors.text} />
                            <Text style={[styles.sidebarText, { color: theme.colors.text }]}>ออกจากระบบ</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#2d2d2d',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 3 },
        elevation: 15,
        zIndex: 999,
    },
    smallAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#444' },
    modalOverlay: { flex: 1 },
    modalBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebarContainer: { width: 300, backgroundColor: '#333333', height: '100%', elevation: 10, position: 'absolute', left: 0 },
    sidebarHeader: { paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#444' },
    sidebarAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#555', marginRight: 15 },
    sidebarUser: { color: '#fff', fontSize: 16, fontWeight: '500' },
    sidebarList: { flex: 1, paddingTop: 10 },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 25 },
    sidebarText: { color: '#fff', fontSize: 16, marginLeft: 20 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 25, paddingHorizontal: 25, borderTopWidth: 1, borderTopColor: '#444', marginTop: 'auto', marginBottom: 20 },
});
