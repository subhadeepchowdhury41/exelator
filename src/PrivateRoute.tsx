/* eslint-disable react-hooks/exhaustive-deps */
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendGet } from "./utils/ApiRequest";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await sendGet("me")
        .then((res) => {
          if (res.status !== 200) {
            navigate("/login");
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

  return <>{children}</>;
};

export default PrivateRoute;
