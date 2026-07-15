import { useState, useEffect, CSSProperties } from "react";

/**
 * 홈 화면 설치 안내 버튼
 * - Android(Chrome): beforeinstallprompt 이벤트로 실제 네이티브 설치창을 띄움
 * - iOS(Safari): 자동 설치 API가 없으므로 "공유 → 홈 화면에 추가" 안내 모달을 띄움
 * - 이미 설치되어 있으면 버튼을 숨김
 */
export default function InstallPrompt() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null); // "ios" | "android" | null
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      setPlatform(null); // 이미 설치됨 → 버튼 숨김
      return;
    }

    if (isIOS) {
      setPlatform("ios");
      return;
    }

    // Android Chrome: 브라우저가 설치 가능하다고 판단하면 이 이벤트가 발생함
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 설치가 완료되면 버튼 숨김
    const handleAppInstalled = () => {
      setPlatform(null);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // 네이티브 설치 다이얼로그 표시
    const { outcome } = await deferredPrompt.userChoice; // "accepted" | "dismissed"
    console.log("설치 결과:", outcome);
    setDeferredPrompt(null);
    setPlatform(null);
  };

  if (!platform) return null;

  return (
    <>
      <button
        onClick={() =>
          platform === "ios" ? setShowIOSModal(true) : handleAndroidInstall()
        }
        style={styles.installButton}
      >
        앱처럼 설치하기
      </button>

      {showIOSModal && (
        <div
          style={styles.overlay}
          onClick={() => setShowIOSModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalTitle}>iPhone에 설치하는 방법</p>
            <div style={styles.step}>
              <span style={styles.stepNum}>1</span>
              <span>Safari 하단 공유 버튼을 탭하세요</span>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>2</span>
              <span>'홈 화면에 추가'를 찾아 탭하세요</span>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>3</span>
              <span>우측 상단 '추가'를 탭하면 완료</span>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              style={styles.closeButton}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  installButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    fontWeight: 500,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    maxWidth: "320px",
    width: "90%",
  },
  modalTitle: {
    fontWeight: 500,
    fontSize: "15px",
    marginBottom: "12px",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    fontSize: "13px",
    color: "#555",
  },
  stepNum: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#eef",
    color: "#33f",
    fontSize: "12px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeButton: {
    marginTop: "12px",
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#f5f5f5",
  },
};