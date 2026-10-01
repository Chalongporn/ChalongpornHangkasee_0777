import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Modal,
    TouchableWithoutFeedback,
    Animated,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import HamburgerMenu from '../components/HamburgerMenu';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function GameModeScreen({ navigation }) {
    const { theme } = useContext(ThemeContext);
    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HamburgerMenu />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ปุ่มกดกลับและชื่อหน้า */}
                <View style={styles.subHeader}>
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.card }]} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.icon} />
                    </TouchableOpacity>
                    <Text style={[styles.pageTitle, { color: theme.colors.text }]}>เกมโหมด</Text>
                </View>

                {/* ส่วนของตัวเลือกความยากของเกม */}
                <View style={styles.cardsContainer}>
                    {/* ปุ่มเข้าโหมดง่าย */}
                    <View style={styles.cardWrapper}>
                        <TouchableOpacity style={styles.modeCard} onPress={() => navigation.navigate('Easy')}>
                            <Image source={require('../assets/Easy.png')} style={styles.bannerImage} />
                        </TouchableOpacity>
                        <Text style={[styles.cardSubTitle, { color: theme.colors.text }]}>ง่าย</Text>
                    </View>

                    {/* Normal Mode */}
                    <View style={styles.cardWrapper}>
                        <TouchableOpacity style={styles.modeCard} onPress={() => navigation.navigate('Normal')}>
                            <Image source={require('../assets/Normal.png')} style={styles.bannerImage} />
                        </TouchableOpacity>
                        <Text style={[styles.cardSubTitle, { color: theme.colors.text }]}>ปกติ</Text>
                    </View>

                    {/* Hard Mode */}
                    <View style={styles.cardWrapper}>
                        <TouchableOpacity style={styles.modeCard} onPress={() => navigation.navigate('Hard')}>
                            <Image source={require('../assets/Hard.png')} style={styles.bannerImage} />
                        </TouchableOpacity>
                        <Text style={[styles.cardSubTitle, { color: theme.colors.text }]}>ยาก</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Tab Bar */}
            <View style={styles.bottomBarContainer}>
                <View style={[styles.bottomBar, { backgroundColor: theme.colors.bottomBar }]}>
                    <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                        <Ionicons name="home" size={28} color={theme.colors.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity>
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
    container: { flex: 1, backgroundColor: '#1c1c1c' },

    scrollContent: {
        paddingBottom: 20,
    },

    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
        position: 'relative'
    },
    backButton: {
        position: 'absolute',
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3a3a3a',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    pageTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },

    cardsContainer: {
        alignItems: 'center',
    },
    cardWrapper: {
        marginBottom: 25,
        width: width * 0.9,
    },
    modeCard: {
        width: '100%',
        aspectRatio: 1456 / 600,
        borderRadius: 15,
        overflow: 'hidden'
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    cardSubTitle: {
        color: '#ccc',
        fontSize: 16,
        marginTop: 8,
        fontWeight: '500',
        marginLeft: 5
    },

    // Bottom Tab Bar Styles
    bottomBarContainer: { alignItems: 'center', paddingBottom: 30, paddingTop: 10 },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '85%',
        backgroundColor: '#2d2d2d',
        paddingVertical: 15,
        borderRadius: 35,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 5 }
    }
});
