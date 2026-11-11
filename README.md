# Tomorrow Desk Web

오늘 한 업무와 앞으로 할 업무를 기록하고, Agent와 대화해 내일의 계획을 정하는 JavaScript 프론트엔드입니다.

## 로컬 실행

Node.js 20 이상이 필요합니다. 외부 패키지는 사용하지 않습니다.

```bash
npm run dev
```

브라우저에서 `http://localhost:4173`으로 접속합니다. 기본 설정은 백엔드 없이 화면과 흐름을 확인할 수 있는 데모 모드입니다.

## 테스트 및 빌드

```bash
npm test
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

## API 연결

Netlify 환경 변수에 다음 값을 설정합니다.

- `API_BASE_URL`: FastAPI 백엔드의 공개 주소
- `DEMO_MODE`: 실제 API 사용 시 `false`

프론트엔드 코드나 환경 변수에 OpenAI API 키, Firebase 서비스 계정 등 비밀값을 넣지 않습니다.

현재 프론트엔드가 기대하는 API 계약은 다음과 같습니다.

- `POST /work-sessions`: 업무 목록 제출 및 대화 세션 시작
- `POST /work-sessions/{sessionId}/messages`: Agent와 대화
- `POST /work-sessions/{sessionId}/finalize`: 내일의 계획 확정

