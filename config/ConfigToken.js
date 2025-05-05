import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const secret_key = process.env.SECRET_KEY;

export const signToken = (user, rememberMe) => {
  const expiresIn = rememberMe ? "30d" : "1d";

  const payload = {
    id: user.id,
    username: user.username,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });

  return token;
};

export const createSendToken = (user, statusCode, res, rememberMe) => {
  const token = signToken(user, rememberMe);
  console.log(user);
  res.cookie("refreshToken", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    // sameSite: "Lax",
  });

  const response = {
    status: "success",
    token,
    message: "Successfully",
  };
  console.log(response);

  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(response),
    secret_key
  ).toString();

  res.status(statusCode).json({
    data: encryptedData,
  });
};
