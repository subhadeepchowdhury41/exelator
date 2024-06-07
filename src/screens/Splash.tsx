/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Colors } from "../utils/Theme";
import { sendGet } from "../utils/ApiRequest";
import ExelatorLogo from "../assets/exelator.png";

const Splash = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await sendGet("me")
        .then((res) => {
          if (res.status !== 200) {
            navigate("/login");
          } else {
            navigate("/dashboard");
          }
        })
        .catch(() => {
          navigate("/login");
        });
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        backgroundColor: Colors.background,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        color: Colors.primary,
        fontWeight: "bold",
        fontSize: 45,
      }}
    >
      <img
        src={ExelatorLogo}
        style={{
          width: "100px",
          height: "100px",
          marginRight: '1em'
        }}
      />
      Exelator
    </div>
  );
};

export default Splash;
