const express = require("express");
const session = require("express-session");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");
const mysql2 = require("mysql2/promise"); // 추가
const axios = require("axios"); // 추가
const xml2js = require("xml2js"); // 추가
const PORT = 4000;

// MySQL 연결 설정
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1111",
  database: "db23208",
});

//세션
app.use(
  session({
    secret: "ksh202326008?!", // 세션 데이터 암호화에 사용될 키
    resave: false,
    saveUninitialized: true,
  })
);

// 미들웨어 설정
app.use(cors()); // CORS 설정
app.use(bodyParser.json()); // 요청 본문 파싱

//11/2 추가
/*
// API 호출 및 MySQL 연결 설정
const API_URL =
  "http://openapi.seoul.go.kr:8088/764a66547061726d3338484c595154/json/ListExhibitionOfSeoulMOAInfo/1/3/";
const DATABASE_CONFIG = {
  host: "localhost",
  user: "root",
  password: "1111",
  database: "db23208",
  charset: "utf8", // 또는 'utf8mb4'
};

async function fetchAndStoreData() {
  try {
    const apiResponse = await axios.get(API_URL);
    //const dataToSave = apiResponse.data;
    const dataToSave = apiResponse.data.ListExhibitionOfSeoulMOAInfo.row;
    for (const item of dataToSave) {
      // 각 필드에 대한 데이터가 있는지 확인하고 데이터가 없으면 null 또는 기본값을 할당
      const ART_NUM = item.DP_SEQ || null; // 전시별식별번호
      const ART_NAME = item.DP_NAME || null; // 전시명
      const ART_EXPLAIN = item.DP_VIEWPOINT || null; // 전시 설명
      const ART_START = item.DP_START || null; // 전시 시작기간
      const ART_END = item.DP_END || null; // 전시 마감기간
      const ART_TIME = item.DP_VIEWTIME || null; // 전시 관람 시간
      const ART_PLACE = item.DP_PLACE || null; // 전시 장소
      const ART_ADDR = item.DP_HOMEPAGE || null; // 전시 주소
      const ART_PRICE = item.DP_VIEWCHARGE || null; // 전시 가격
      const ART_SITE = item.DP_LNK || null; // 전시 사이트
      const ART_ARTIST = item.DP_ARTIST || null; // 전시 아티스트
      const ART_PREFER = item.DP_ART_PART || null; // 전시 장르
      const ART_BACK = item.DP_INFO || null; //전시 배경 지식
      const ART_PICTURE = item.DP_MAIN_IMG || null;
      //const ART_PICTURE = item.DP_MAIN_IMG ? await getImageBase64(item.DP_MAIN_IMG) : null; // 전시 사진

      //console.log(ART_PICTURE);

      const connection = await mysql2.createConnection(DATABASE_CONFIG);
      await connection.execute(
        "INSERT INTO exhibition (ART_NUM, ART_NAME, ART_PICTURE, ART_EXPLAIN, ART_START, ART_END, ART_TIME, ART_CLOSED, ART_PLACE, ART_ADDR, ART_PRICE, ART_CALL, ART_SITE, ART_ARTIST, ART_PREFER, ART_BACK) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          ART_NUM,
          ART_NAME,
          ART_PICTURE,
          ART_EXPLAIN,
          ART_START,
          ART_END,
          ART_TIME,
          "", // 전시 휴관 요일 - API 데이터에 없으므로 null 또는 ''로 설정(나중에 변경)
          ART_PLACE,
          ART_ADDR,
          ART_PRICE,
          "", // 전시 전화번호 - API 데이터에 없으므로 null 또는 ''로 설정(나중에 변경)
          ART_SITE,
          ART_ARTIST,
          ART_PREFER,
          ART_BACK,
        ]
      );
      await connection.end();
      console.log("데이터 초기화 및 저장 완료");
    }
  } catch (error) {
    console.error("데이터 초기화 중 오류 발생:", error);
  }
}
// 서버 시작 시 데이터 초기화
fetchAndStoreData();
*/
app.get("/", (req, res) => res.send("Hello world!!!"));

//로그인
app.post("/LogIn", (req, res) => {
  const user_id = req.body.username;
  const user_pw = req.body.password;

  // 데이터베이스에서 사용자 정보 조회
  const sql = "SELECT * FROM user WHERE user_id = ?";
  con.query(sql, [user_id], (err, results) => {
    if (err) {
      console.log("에러 발생");
      return res.status(500).json({ error: "로그인 실패 : 에러 발생", err });
    }

    // 사용자 정보가 조회되지 않으면 로그인 실패
    if (results.length === 0) {
      console.log("사용자 정보가 없음");
      return res.status(401).json({ error: "로그인 실패 : 사용자 정보 조회X" });
    }

    const user = results[0];

    // 비밀번호 비교
    if (user.USER_PW === user_pw) {
      // 로그인 성공
      console.log("로그인 성공");
      req.session.username = user.USER_ID;
      console.log(req.session.username);
      console.log(user); // 유저 아이디를 콘솔에 출력
      res.status(200).json({
        user: user,
      }); //사용자 정보를 응답에 포함
    } else {
      // 로그인 실패
      console.log("로그인 실패");
      console.log(user_id);
      console.log("비밀번호 오류");
      console.log(user);
    }
  });
});

// POST - 회원가입 요청 처리
app.post("/Register", (req, res) => {
  const user_id = req.body.username;
  const user_pw = req.body.password;
  const user_name = req.body.name;
  const user_mail = req.body.email;

  // 필수 필드 누락 확인
  if (!user_id || !user_pw || !user_name || !user_mail) {
    return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
  }

  const sql =
    "INSERT INTO user (user_id, user_pw, user_name, user_mail) VALUES (?, ?, ?, ?)";

  con.query(
    sql,
    [user_id, user_pw, user_name, user_mail],
    function (err, result) {
      if (err) {
        console.log("회원가입 실패");
        console.log(err);
        return res.status(500).json({ error: "회원가입 실패" });
      } else {
        const user = {
          user_id: user_id,
          user_name: user_name,
          user_mail: user_mail,
        };
        console.log("회원가입 성공");
        res.status(200).json({ user: user });
      }
    }
  );
});

// 로그아웃
app.post("/Logout", (req, res) => {
  // 세션 제거
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "세션 제거 실패" });
    } else {
      // 로그아웃 성공 후 클라이언트에게 리디렉션할 주소 전달
      console.log("로그아웃!!");
      res.status(200).json({ redirectTo: "../pages/Home" });
    }
  });
});

// check api 로그인 완료 retrun       수정 11/1
app.get("/welcome", (req, res) => {
  // 예전
  if (req.session.username) {
    // 세션에 사용자 이름이 존재하면 로그인된 상태
    const user = {
      username: req.session.username, // 현재 로그인한 사용자의 이름 또는 아이디
      // 여기에서 다른 사용자 정보를 필요에 따라 세션에서 읽어올 수 있습니다.
    };
    res.status(200).json(user);
    console.log("유저 정보");
  } else {
    // 세션에 사용자 이름이 없으면 로그인되지 않은 상태
    res.status(401).json({ error: "로그인되지 않음" });
  }
  /*
  const user_id = req.query.username; //쿼리라 {username : id} 이런 형태
  const username = user_id.username; // id값만 추출
  console.log(req.session);
  // 여기에서 사용자 상태 확인 또는 필요한 데이터를 응답할 수 있습니다.
  const check = "SELECT * FROM user WHERE user_id = ?";
  con.query(check, [username], (err, results) => {
    if (err) {
      console.error("Error in database query:", err);
      res.status(500).json({ message: "데이터베이스 오류" });
    } else {
      if (results.length > 0) {
        // 사용자 정보를 찾았을 때
        const user = results[0];
        res.json({
          message: "환영합니다",
          username: user.USER_ID,
          password: user.USER_PW,
          name: user.USER_NAME,
          user_mail: user.USER_MAIL,
        });
      } else {
        // 사용자 정보를 찾지 못했을 때
        console.log("사용자 정보를 못 찾음");
        res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
    }
  });*/
});

// 회원가입 완료
app.get("/SignUpComplete", (req, res) => {
  console.log("회원가입 끝");
  res.json({ message: "회원가입 환영" });
});

// 아이디 찾기
app.post("/FindID", (req, res) => {
  const user_name = req.body.name;
  const user_mail = req.body.email;

  // 데이터베이스에서 해당 이름과 이메일로 유저 아이디 조회
  const sql = "SELECT user_id FROM user WHERE user_name = ? AND user_mail = ?";
  con.query(sql, [user_name, user_mail], (err, results) => {
    if (err) {
      console.log("에러 발생");
      console.log(err);
      return res.status(500).json({ error: "아이디 찾기 실패" });
    }

    // 사용자 정보가 조회되지 않으면 아이디 찾기 실패
    if (results.length === 0) {
      console.log("사용자 정보가 없음");
      return res.status(404).json({ error: "일치하는 사용자 정보 없음" });
    }

    const user = results[0];

    // 아이디 찾기 성공
    console.log("아이디 찾기 성공:", user.user_id);
    res.status(200).json({ userId: user.user_id }); // 유저 아이디를 응답에 포함
  });
});

// 비밀번호 찾기
app.post("/FindPW", (req, res) => {
  const user_id = req.body.username;
  const user_mail = req.body.email;

  // 데이터베이스에서 해당 아이디와 이메일로 유저 비밀번호 조회
  const sql = "SELECT user_pw FROM user WHERE user_id = ? AND user_mail = ?";
  con.query(sql, [user_id, user_mail], (err, results) => {
    if (err) {
      console.log("에러 발생");
      console.log(err);
      return res.status(500).json({ error: "비밀번호 찾기 실패" });
    }

    // 사용자 정보가 조회되지 않으면 비밀번호 찾기 실패
    if (results.length === 0) {
      console.log("사용자 정보가 없음");
      return res.status(404).json({ error: "일치하는 사용자 정보 없음" });
    }

    const user = results[0];
    //const userPW = user.user_pw.toString(); - 필요할 경우 문자열, 숫자 변환용
    // 비밀번호 찾기 성공
    console.log("비밀번호 찾기 성공:", user.user_pw);
    res.status(200).json({ userPW: user.user_pw }); // 유저 비밀번호를 응답에 포함
  });
});

//사용자 정보 조회
app.get("/mypage", (req, res) => {
  if (req.session.username) {
    const username = req.session.username; // 세션에서 사용자 이름 가져오기
    // 데이터베이스에서 사용자 정보 조회
    const sql = "SELECT * FROM user WHERE USER_ID = ?";
    con.query(sql, [username], (err, results) => {
      if (err) {
        console.log("에러 발생");
        console.log(err);
        return res.status(500).json({ error: "데이터베이스 오류" });
      }
      // 사용자 정보가 조회되지 않으면 오류 응답
      if (results.length === 0) {
        console.log("사용자 정보가 없음");
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      const user = results[0]; // 데이터베이스에서 조회한 사용자 정보
      console.log(user);
      // 여기에서 필요한 사용자 정보를 클라이언트에게 응답할 수 있습니다.
      const mypage = {
        username: user.USER_ID,
        name: user.USER_NAME,
        email: user.USER_MAIL,
        // 기타 사용자 정보 추가
      };
      res.status(200).json(mypage); // 사용자 정보 응답
    });
  } else {
    // 세션에 사용자 이름이 없으면 로그인되지 않은 상태
    res.status(401).json({ error: "로그인되지 않음" });
  }
});

//사용자 정보 수정
app.post("/updateMy", (req, res) => {
  if (req.session.username) {
    const username = req.session.username; // 세션에서 사용자 이름 가져오기
    const updateFields = {}; // 변경할 필드를 저장할 빈 객체 생성

    // 클라이언트에서 전송한 변경된 필드가 있는지 확인하고 객체에 추가
    if (req.body.name) {
      updateFields.USER_NAME = req.body.name;
    }
    if (req.body.email) {
      updateFields.USER_MAIL = req.body.email;
    }
    if (req.body.newPassword) {
      updateFields.USER_PW = req.body.newPassword;
    }

    if (Object.keys(updateFields).length === 0) {
      // 변경된 필드가 없는 경우
      return res.status(400).json({ message: "변경된 필드가 없습니다." });
    }
    // 데이터베이스에서 사용자 정보 업데이트
    const updateSql = "UPDATE user SET ? WHERE USER_ID = ?";
    con.query(updateSql, [updateFields, username], (err, result) => {
      if (err) {
        console.error("Failed to update user info:", err);
        res.status(500).json({ message: "Failed to update user info" });
      } else {
        console.log("User info updated successfully");
        res.status(200).json({ message: "User info updated successfully" });
      }
    });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// 탈퇴 요청 처리
app.delete("/deleteAccount", (req, res) => {
  if (req.session.username) {
    const username = req.session.username; // 세션에서 사용자 이름 가져오기

    // 데이터베이스에서 사용자 삭제
    const deleteSql = "DELETE FROM user WHERE USER_ID = ?";
    con.query(deleteSql, [username], (err, result) => {
      if (err) {
        console.error("Failed to delete user:", err);
        res.status(500).json({ message: "Failed to delete user" });
      } else {
        console.log("User deleted successfully");
        req.session.destroy(); // 세션 파기
        res.status(200).json({ message: "User deleted successfully" });
      }
    });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

//전시
// API로부터 모든 전시회 정보를 가져와 클라이언트에게 제공
app.get("/AllExhibitions", (req, res) => {
  const sql = "SELECT * FROM exhibition"; // exhibition 테이블에서 모든 정보를 가져오는 SQL 쿼리
  con.query(sql, (err, results) => {
    if (err) {
      console.log("에러 발생");
      console.log(err);
      return res.status(500).json({
        error: "데이터베이스에서 전시회 정보를 가져오는 중 에러가 발생했습니다",
      });
    }

    // 결과를 클라이언트에게 응답
    res.status(200).json(results);
    //console.log(results)
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server run : http://localhost:${PORT}/`);
});
