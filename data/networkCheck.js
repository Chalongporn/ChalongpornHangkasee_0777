import { Alert } from "react-native";

export async function checkInternetConnection() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    const response = await fetch("https://clients3.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(id);
    return response.status === 204 || response.ok;
  } catch (e) {
    return false;
  }
}

export async function checkConnectionAndAlert() {
  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    Alert.alert("เกิดข้อผิดพลาด", "อินเตอร์เน็ตมีปัญหา กรุณาตรวจสอบการเชื่อมต่อ");
    return false;
  }
  return true;
}
