import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Colors } from "../utils/Theme";

const Signup = () => {
  const [showPass, setShowPass] = useState(false);
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
              Sign up
            </Typography>
          </Box>
          <TextField fullWidth label="Name" />
          <TextField fullWidth label="Email" />
          <TextField type="password" fullWidth label="Password" />
          <Button
            disableElevation
            fullWidth
            sx={{ bgcolor: Colors.primary, borderRadius: "23px" }}
            variant="contained"
          >
            Sign up
          </Button>
        </Card>
      </Box>
    </>
  );
};

export default Signup;
