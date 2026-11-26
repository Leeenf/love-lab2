# LOVE LAB v1.0

모바일 우선 커플 심리 게임 웹앱입니다. HTML/CSS/JavaScript와 Firebase Authentication(익명 인증), Cloud Firestore를 사용합니다.

## 파일
- `index.html`: 화면 구조
- `style.css`: 네온 연구소 UI
- `app.js`: 게임 로직 및 Firebase 연결
- `firestore.rules`: Firestore 보안 규칙
- `firebase.json`: Firebase CLI 배포 설정

## 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 에서 프로젝트를 생성합니다.
2. 프로젝트 설정 > 내 앱 > 웹 앱을 추가하고 Firebase 설정 객체를 복사합니다.
3. `app.js`의 `firebaseConfig`에 실제 값을 입력합니다.
4. Firebase Authentication > Sign-in method에서 **Anonymous** 로그인을 활성화합니다.
5. Firestore Database를 생성합니다.
6. Firestore > Rules에서 `firestore.rules` 내용을 게시합니다.

## 2. Firestore 구조
컬렉션 `rooms`, 문서 ID는 6자리 초대 코드입니다.

```text
rooms/{ROOM_CODE}
  code: string
  status: "waiting" | "ready" | "active"
  host: { uid, name, mbti }
  guest: { uid, name, mbti } | null
  duration: string
  completed: string[]
  answers: {
    telepathy: { "0": { host: {...}, guest: {...} } },
    manual: {...},
    scenario: {...},
    balance: {...},
    court: {...},
    cipher: {...}
  }
  createdAt: timestamp
  expiresAt: number
```

## 3. 로컬에서 실행
ES module과 Firebase CDN을 사용하므로 `file://`로 직접 열지 말고 로컬 웹서버를 사용하세요.

Python이 설치되어 있다면 프로젝트 폴더에서:
```bash
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속.

Firebase 설정을 넣지 않은 상태에서는 홈 화면의 데모 미리보기만 사용할 수 있습니다. 데모는 두 기기 간 동기화가 되지 않습니다.

## 4. GitHub Pages 배포
1. GitHub에 새 공개 저장소를 생성합니다.
2. `index.html`, `style.css`, `app.js`를 저장소 루트에 업로드합니다.
3. Settings > Pages > Deploy from a branch > `main` / `/root` 선택.
4. 발급된 `https://계정명.github.io/저장소명/` 주소로 접속합니다.
5. Firebase Authentication의 승인된 도메인(Authorized domains)에 `계정명.github.io`를 추가합니다.

## 5. Firebase Hosting 배포(선택)
Firebase CLI 설치 후:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```
초기화 질문에서 현재 폴더를 public directory로 지정하고, SPA 설정은 No로 선택해도 됩니다. `firebase.json`은 기본 설정 예시입니다.

## 6. 보안과 운영 주의
- Firestore 규칙은 방의 host/guest만 읽을 수 있도록 제한합니다.
- 초대 코드는 6자리이며 방 생성 시 충돌을 확인합니다. 운영 서비스라면 더 긴 랜덤 코드와 서버 측 생성(Cloud Functions)을 권장합니다.
- `expiresAt`은 자동 삭제를 수행하지 않습니다. Firestore TTL 정책을 별도로 설정하거나 Cloud Functions로 정리해야 합니다.
- 익명 인증은 브라우저 데이터 삭제/기기 변경 시 동일 사용자로 복구되지 않을 수 있습니다.
- 현재 버전은 사용자 입력과 응답의 기본 흐름을 제공하는 MVP입니다. 상용 공개 전에는 서버 측 검증, 중복 제출 방지, 진행 상태 잠금, 오류/재접속 처리, 개인정보 처리방침을 보강하세요.
- MBTI 및 결과 해석은 오락용입니다. 임상적·과학적 심리 진단으로 표현하지 마세요.

## 7. 현재 MVP 범위와 알려진 제한
- 두 명이 별도 기기에서 초대 코드로 접속하고 Firestore 실시간 리스너로 상태를 공유합니다.
- 모든 게임은 기본 질문 뱅크를 사용합니다.
- adaptive는 현재 단계별 문항 순서와 질문 묶음 구조를 지원하는 초기 버전입니다. 고도화하려면 답변 점수에 따라 다음 질문을 고르는 공통 규칙을 추가해야 합니다.
- 암호 해독은 기본 추리 UI입니다. 실제 정답 검증은 후속 개발 항목입니다.
- 결과 리포트는 수집된 일부 응답으로 산출하며, 모든 실험을 완료하지 않아도 열 수 있는 초기 MVP입니다.
