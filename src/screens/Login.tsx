import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Colors } from "../utils/Theme";
import { sendPost } from "../utils/ApiRequest";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
    await sendPost("login", {
      username,
      password,
    }).then((res) => {
      localStorage.setItem("access_token", res.data["access_token"]);
      navigate('/dashboard');
    });
  };
  return (
    <>
      <Box
        sx={{
          bgcolor: Colors.background,
          width: "100%",
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          sx={{
            backgroundColor: Colors.white,
            width: "430px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingY: "4em",
            paddingX: "2em",
            gap: "2em",
            color: Colors.white,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "start",
            }}
          >
            <Typography
              fontWeight={"bold"}
              fontSize={27}
              color={Colors.primary}
            >
              Log in
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            disableElevation
            fullWidth
            onClick={handleLogin}
            sx={{ bgcolor: Colors.primary, borderRadius: "23px" }}
            variant="contained"
          >
            Log in
          </Button>
        </Card>
      </Box>
    </>
  );
};

export default Login;
